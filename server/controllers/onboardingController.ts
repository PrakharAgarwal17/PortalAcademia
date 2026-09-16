import type { Request, Response } from "express";
import nodemailer from "nodemailer";
import { getCache, setCache } from "../config/redisClient.js";

// In-memory store for Onboarding verification OTPs
interface OnboardingOtpData {
    otp: number;
    email: string;
    expiresAt: number;
}

const OnboardingOtpMap = new Map<string, OnboardingOtpData>();

function getEmailCredentials(): {
    email: string;
    password: string;
} {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
        throw new Error("Email credentials are not defined in .env");
    }

    return { email, password };
}

// ============================================================
// AISHE Institutions Search & Lookup
// ============================================================

// Embedded representative database of Indian colleges & universities
const DEFAULT_INSTITUTIONS = [
    { name: "DIT University", aisheCode: "U-0774", state: "Uttarakhand" },
    { name: "Indian Institute of Technology Bombay", aisheCode: "U-0275", state: "Maharashtra" },
    { name: "Indian Institute of Technology Delhi", aisheCode: "U-0092", state: "Delhi" },
    { name: "Indian Institute of Technology Madras", aisheCode: "U-0456", state: "Tamil Nadu" },
    { name: "Indian Institute of Technology Kanpur", aisheCode: "U-0500", state: "Uttar Pradesh" },
    { name: "Indian Institute of Technology Kharagpur", aisheCode: "U-0570", state: "West Bengal" },
    { name: "Indian Institute of Science Bangalore", aisheCode: "U-0220", state: "Karnataka" },
    { name: "National Institute of Technology Trichy", aisheCode: "U-0467", state: "Tamil Nadu" },
    { name: "National Institute of Technology Surathkal", aisheCode: "U-0237", state: "Karnataka" },
    { name: "National Institute of Technology Rourkela", aisheCode: "U-0355", state: "Odisha" },
    { name: "Birla Institute of Technology and Science, Pilani", aisheCode: "U-0391", state: "Rajasthan" },
    { name: "Vellore Institute of Technology", aisheCode: "U-0484", state: "Tamil Nadu" },
    { name: "Delhi University", aisheCode: "U-0100", state: "Delhi" },
    { name: "Jawaharlal Nehru University", aisheCode: "U-0109", state: "Delhi" },
    { name: "Banaras Hindu University", aisheCode: "U-0501", state: "Uttar Pradesh" },
    { name: "Aligarh Muslim University", aisheCode: "U-0498", state: "Uttar Pradesh" },
    { name: "Anna University", aisheCode: "U-0439", state: "Tamil Nadu" },
    { name: "University of Mumbai", aisheCode: "U-0283", state: "Maharashtra" },
    { name: "Savitribai Phule Pune University", aisheCode: "U-0315", state: "Maharashtra" },
    { name: "Dr. A.P.J. Abdul Kalam Technical University", aisheCode: "U-0507", state: "Uttar Pradesh" },
    { name: "Manipal Academy of Higher Education", aisheCode: "U-0230", state: "Karnataka" },
    { name: "SRM Institute of Science and Technology", aisheCode: "U-0473", state: "Tamil Nadu" },
    { name: "Amity University, Noida", aisheCode: "U-0504", state: "Uttar Pradesh" },
    { name: "Thapar Institute of Engineering and Technology", aisheCode: "U-0388", state: "Punjab" },
];

// Safe AISHE dataset loader with multi-path resolution
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const esmRequire = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aisheDataSet: Array<{ name?: string; aishe_code?: string; state?: string; district?: string }> = [];

const candidateDatasetPaths = [
    path.resolve(__dirname, "../node_modules/aishe-institutions-list/data/institutions.json"),
    path.resolve(process.cwd(), "server/node_modules/aishe-institutions-list/data/institutions.json"),
    path.resolve(process.cwd(), "node_modules/aishe-institutions-list/data/institutions.json"),
];

for (const candidatePath of candidateDatasetPaths) {
    try {
        if (fs.existsSync(candidatePath)) {
            aisheDataSet = JSON.parse(fs.readFileSync(candidatePath, "utf-8"));
            if (aisheDataSet.length > 0) {
                break;
            }
        }
    } catch {}
}

if (!aisheDataSet.length) {
    try {
        aisheDataSet = esmRequire("aishe-institutions-list/data/institutions.json");
    } catch {
        aisheDataSet = [];
    }
}

const COMMON_ACRONYMS: Record<string, string> = {
    dit: "dit university",
    iit: "indian institute of technology",
    nit: "national institute of technology",
    iiit: "indian institute of information technology",
    iim: "indian institute of management",
    iisc: "indian institute of science",
    bits: "birla institute of technology",
    aiims: "all india institute of medical sciences",
    bhu: "banaras hindu university",
    jnu: "jawaharlal nehru university",
    du: "delhi university",
    dtu: "delhi technological university",
    nsut: "netaji subhas university",
    coep: "college of engineering pune",
    vjti: "veermata jijabai technological institute",
    vit: "vellore institute of technology",
    srm: "srm institute of science and technology",
};

function searchAishe(query: string, limit = 25) {
    if (!query || !aisheDataSet.length) return [];
    const cleanQuery = query.toLowerCase().trim();
    const normalizedQuery = cleanQuery.replace(/[.\-_]/g, "");
    
    // Generate query search variations (e.g. "iit bombay" -> also "indian institute of technology bombay")
    let expandedQuery = cleanQuery;
    for (const [acronym, expansion] of Object.entries(COMMON_ACRONYMS)) {
        const regex = new RegExp(`\\b${acronym}\\b`, "gi");
        if (regex.test(expandedQuery)) {
            expandedQuery = expandedQuery.replace(regex, expansion);
        }
    }

    const queryVariations = Array.from(new Set([cleanQuery, normalizedQuery, expandedQuery]));
    const results: Array<{ name?: string; aishe_code?: string; state?: string; district?: string }> = [];
    const seenCodes = new Set<string>();

    // 1st Priority: Exact or prefix match on name or aishe_code
    for (const inst of aisheDataSet) {
        const rawName = (inst.name || "").toLowerCase();
        const normName = rawName.replace(/[.\-_]/g, "");
        const code = (inst.aishe_code || "").toLowerCase();

        const matchesPrefix = queryVariations.some(
            (qv) => rawName.startsWith(qv) || normName.startsWith(qv) || code === qv || code.startsWith(qv)
        );
        if (matchesPrefix) {
            const key = inst.aishe_code || inst.name || "";
            if (!seenCodes.has(key)) {
                seenCodes.add(key);
                results.push(inst);
                if (results.length >= limit) return results;
            }
        }
    }

    // 2nd Priority: Exact word match or full phrase match
    for (const inst of aisheDataSet) {
        const rawName = (inst.name || "").toLowerCase();
        const normName = rawName.replace(/[.\-_]/g, "");
        const code = (inst.aishe_code || "").toLowerCase();
        const state = (inst.state || "").toLowerCase();
        const district = (inst.district || "").toLowerCase();
        const key = inst.aishe_code || inst.name || "";

        if (seenCodes.has(key)) continue;

        const isMatch = queryVariations.some((qv) => {
            if (rawName.includes(qv) || normName.includes(qv) || code.includes(qv)) return true;
            const words = qv.split(/\s+/).filter(Boolean);
            return words.length > 0 && words.every((w) => rawName.includes(w) || state.includes(w) || district.includes(w));
        });

        if (isMatch) {
            seenCodes.add(key);
            results.push(inst);
            if (results.length >= limit) break;
        }
    }

    return results;
}

export async function searchInstitutions(req: Request, res: Response): Promise<Response> {
    try {
        const query = (req.query.search as string || "").trim();
        const limit = req.query.limit ? Number(req.query.limit) : 25;

        const cacheKey = `cache:aishe:${query.toLowerCase()}:${limit}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) {
            return res.status(200).json({ institutions: cached, cached: true });
        }

        // 1. Primary: Search using the installed aishe-institutions-list package
        if (query) {
            try {
                const results = searchAishe(query, limit);
                if (Array.isArray(results) && results.length > 0) {
                    const formatted = results.map((item: any) => ({
                        name: item.name,
                        aisheCode: item.aishe_code || item.aisheCode || "",
                        state: item.state || "",
                        district: item.district || "",
                    }));
                    await setCache(cacheKey, formatted, 3600);
                    return res.status(200).json({ institutions: formatted });
                }
            } catch (pkgErr) {
                console.warn("aishe-institutions-list search failed, using fallback:", pkgErr);
            }
        }

        // 2. Secondary: Fallback to representative list if query matches or default listing
        const lowerQuery = query.toLowerCase();
        const filtered = query
            ? DEFAULT_INSTITUTIONS.filter(
                  (inst) =>
                      inst.name.toLowerCase().includes(lowerQuery) ||
                      inst.aisheCode.toLowerCase().includes(lowerQuery) ||
                      inst.state.toLowerCase().includes(lowerQuery)
              )
            : DEFAULT_INSTITUTIONS;

        return res.status(200).json({
            institutions: filtered,
        });
    } catch (error: any) {
        console.error("Search institutions error:", error);
        return res.status(500).json({
            message: "Failed to search institutions",
            institutions: DEFAULT_INSTITUTIONS.slice(0, 10),
        });
    }
}

// ============================================================
// Known Higher Education Domains & Smart Domain Engine
// ============================================================

const KNOWN_INSTITUTION_DOMAINS: Record<string, { domain: string; emails?: string[] }> = {
    // DIT University
    "dit": { domain: "dituniversity.edu.in", emails: ["registrar@dituniversity.edu.in", "admissions@dituniversity.edu.in", "info@dituniversity.edu.in"] },
    "dit university": { domain: "dituniversity.edu.in", emails: ["registrar@dituniversity.edu.in", "admissions@dituniversity.edu.in", "info@dituniversity.edu.in"] },
    "dehradun institute of technology": { domain: "dituniversity.edu.in", emails: ["registrar@dituniversity.edu.in", "admissions@dituniversity.edu.in", "info@dituniversity.edu.in"] },

    // Delhi University & Tech Universities
    "delhi university": { domain: "du.ac.in", emails: ["registrar@du.ac.in", "admin@du.ac.in", "info@du.ac.in"] },
    "university of delhi": { domain: "du.ac.in", emails: ["registrar@du.ac.in", "admin@du.ac.in", "info@du.ac.in"] },
    "du": { domain: "du.ac.in", emails: ["registrar@du.ac.in", "admin@du.ac.in", "info@du.ac.in"] },
    "dtu": { domain: "dtu.ac.in", emails: ["registrar@dtu.ac.in", "academic@dtu.ac.in", "info@dtu.ac.in"] },
    "delhi technological university": { domain: "dtu.ac.in", emails: ["registrar@dtu.ac.in", "academic@dtu.ac.in", "info@dtu.ac.in"] },
    "nsut": { domain: "nsut.ac.in", emails: ["registrar@nsut.ac.in", "academic@nsut.ac.in", "info@nsut.ac.in"] },
    "netaji subhas university of technology": { domain: "nsut.ac.in", emails: ["registrar@nsut.ac.in", "academic@nsut.ac.in", "info@nsut.ac.in"] },

    // IITs
    "iit bombay": { domain: "iitb.ac.in", emails: ["registrar@iitb.ac.in", "dean.ap@iitb.ac.in", "info@iitb.ac.in"] },
    "indian institute of technology bombay": { domain: "iitb.ac.in", emails: ["registrar@iitb.ac.in", "dean.ap@iitb.ac.in", "info@iitb.ac.in"] },
    "iit delhi": { domain: "iitd.ac.in", emails: ["registrar@admin.iitd.ac.in", "webmaster@iitd.ac.in"] },
    "indian institute of technology delhi": { domain: "iitd.ac.in", emails: ["registrar@admin.iitd.ac.in", "webmaster@iitd.ac.in"] },
    "iit madras": { domain: "iitm.ac.in", emails: ["registrar@iitm.ac.in", "admissions@iitm.ac.in"] },
    "indian institute of technology madras": { domain: "iitm.ac.in", emails: ["registrar@iitm.ac.in", "admissions@iitm.ac.in"] },
    "iit kanpur": { domain: "iitk.ac.in", emails: ["registrar@iitk.ac.in", "doaa@iitk.ac.in"] },
    "indian institute of technology kanpur": { domain: "iitk.ac.in", emails: ["registrar@iitk.ac.in", "doaa@iitk.ac.in"] },
    "iit kharagpur": { domain: "iitkgp.ac.in", emails: ["registrar@iitkgp.ac.in", "dean.ap@iitkgp.ac.in"] },
    "indian institute of technology kharagpur": { domain: "iitkgp.ac.in", emails: ["registrar@iitkgp.ac.in", "dean.ap@iitkgp.ac.in"] },
    "iit roorkee": { domain: "iitr.ac.in", emails: ["registrar@iitr.ac.in", "pgadm@iitr.ac.in"] },
    "indian institute of technology roorkee": { domain: "iitr.ac.in", emails: ["registrar@iitr.ac.in", "pgadm@iitr.ac.in"] },

    // BITS, VIT, SRM, Manipal, Amity, Thapar, LPU, etc.
    "birla institute of technology and science, pilani": { domain: "pilani.bits-pilani.ac.in", emails: ["registrar@pilani.bits-pilani.ac.in", "admissions@pilani.bits-pilani.ac.in"] },
    "bits pilani": { domain: "pilani.bits-pilani.ac.in", emails: ["registrar@pilani.bits-pilani.ac.in", "admissions@pilani.bits-pilani.ac.in"] },
    "vellore institute of technology": { domain: "vit.ac.in", emails: ["registrar@vit.ac.in", "admin@vit.ac.in", "info@vit.ac.in"] },
    "vit": { domain: "vit.ac.in", emails: ["registrar@vit.ac.in", "admin@vit.ac.in", "info@vit.ac.in"] },
    "srm institute of science and technology": { domain: "srmist.edu.in", emails: ["registrar@srmist.edu.in", "admissions.india@srmist.edu.in", "info@srmist.edu.in"] },
    "srm": { domain: "srmist.edu.in", emails: ["registrar@srmist.edu.in", "admissions.india@srmist.edu.in", "info@srmist.edu.in"] },
    "manipal academy of higher education": { domain: "manipal.edu", emails: ["registrar@manipal.edu", "admissions@manipal.edu", "info@manipal.edu"] },
    "amity university, noida": { domain: "amity.edu", emails: ["registrar@amity.edu", "admissions@amity.edu", "info@amity.edu"] },
    "amity university": { domain: "amity.edu", emails: ["registrar@amity.edu", "admissions@amity.edu", "info@amity.edu"] },
    "thapar institute of engineering and technology": { domain: "thapar.edu", emails: ["registrar@thapar.edu", "admissions@thapar.edu"] },
    "graphic era university": { domain: "geu.ac.in", emails: ["registrar@geu.ac.in", "admissions@geu.ac.in", "info@geu.ac.in"] },
    "graphic era": { domain: "geu.ac.in", emails: ["registrar@geu.ac.in", "admissions@geu.ac.in", "info@geu.ac.in"] },
    "upes": { domain: "upes.ac.in", emails: ["registrar@upes.ac.in", "enrollments@upes.ac.in", "info@upes.ac.in"] },
    "lovely professional university": { domain: "lpu.in", emails: ["registrar@lpu.co.in", "info@lpu.co.in", "admissions@lpu.co.in"] },
    "chandigarh university": { domain: "cuchd.in", emails: ["registrar@cumail.in", "admissions@cumail.in", "info@cuchd.in"] },
    "jawaharlal nehru university": { domain: "jnu.ac.in", emails: ["registrar@mail.jnu.ac.in", "admin@mail.jnu.ac.in"] },
    "banaras hindu university": { domain: "bhu.ac.in", emails: ["registrar@bhu.ac.in", "admin@bhu.ac.in"] },
    "aligarh muslim university": { domain: "amu.ac.in", emails: ["registrar.amu@amu.ac.in", "info@amu.ac.in"] },
    "anna university": { domain: "annauniv.edu", emails: ["registrar@annauniv.edu", "admissions@annauniv.edu"] },
    "university of mumbai": { domain: "mu.ac.in", emails: ["registrar@fort.mu.ac.in", "info@mu.ac.in"] },
    "savitribai phule pune university": { domain: "unipune.ac.in", emails: ["registrar@unipune.ac.in", "info@unipune.ac.in"] },
    "dr. a.p.j. abdul kalam technical university": { domain: "aktu.ac.in", emails: ["registrar@aktu.ac.in", "info@aktu.ac.in"] },
};

export function deriveOfficialInstitutionEmails(institutionName: string, website?: string): string[] {
    if (website) {
        try {
            const url = new URL(website.startsWith("http") ? website : `https://${website}`);
            const domain = url.hostname.replace(/^www\./, "");
            return [
                `registrar@${domain}`,
                `admin@${domain}`,
                `info@${domain}`,
                `admissions@${domain}`,
                `contact@${domain}`,
            ];
        } catch {}
    }

    const cleanName = institutionName
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // 1. Check known institution dictionary
    for (const [key, item] of Object.entries(KNOWN_INSTITUTION_DOMAINS)) {
        if (cleanName === key || cleanName.startsWith(key + " ") || cleanName.endsWith(" " + key) || cleanName.includes(key)) {
            if (item.emails && item.emails.length > 0) {
                return item.emails;
            }
            return [
                `registrar@${item.domain}`,
                `admissions@${item.domain}`,
                `info@${item.domain}`,
                `admin@${item.domain}`,
            ];
        }
    }

    // 2. Intelligent candidate domain derivation
    const words = cleanName.split(" ").filter((w) => !["of", "and", "the", "in", "for", "at"].includes(w));
    const firstWord = words[0] || "";
    const candidateDomains: string[] = [];

    // If first word is a short acronym/word (e.g. "dit", "vit", "srm", "mit", "geu", "upes")
    if (firstWord.length >= 2 && firstWord.length <= 5) {
        candidateDomains.push(`${firstWord}university.edu.in`);
        candidateDomains.push(`${firstWord}.edu.in`);
        candidateDomains.push(`${firstWord}.ac.in`);
        candidateDomains.push(`${firstWord}university.ac.in`);
    } else if (words.length > 1) {
        // Multi-word name: generate both acronym and compact slug
        const acronym = words.map((w) => w[0]).join("");
        const compactSlug = words.slice(0, 3).join("");
        candidateDomains.push(`${acronym}.ac.in`);
        candidateDomains.push(`${compactSlug}.ac.in`);
        candidateDomains.push(`${compactSlug}.edu.in`);
    } else {
        candidateDomains.push(`${cleanName}.ac.in`);
        candidateDomains.push(`${cleanName}.edu.in`);
    }

    const emails: string[] = [];
    for (const d of candidateDomains) {
        emails.push(`registrar@${d}`);
        emails.push(`admissions@${d}`);
        emails.push(`info@${d}`);
        emails.push(`admin@${d}`);
    }

    return Array.from(new Set(emails)).slice(0, 5);
}

// ============================================================
// Grok AI Official College Email Crawler
// ============================================================

export async function crawlCollegeEmails(req: Request, res: Response): Promise<Response> {
    try {
        const { institutionName, website } = req.body;

        if (!institutionName || typeof institutionName !== "string") {
            return res.status(400).json({
                message: "institutionName is required",
            });
        }

        const grokApiKey = process.env.GROK_API_KEY;

        // 1. If Grok API key is configured, query xAI Grok API
        if (grokApiKey) {
            try {
                const prompt = `You are a verification assistant for PortalAcademia.
Find or derive official public administrative, registrar, and academic contact emails for the educational institution: "${institutionName}"${website ? ` (Official website: ${website})` : ""}.
Examples of expected formats: registrar@..., admin@..., principal@..., admissions@..., contact@..., info@... with their authentic domain.
Output ONLY a JSON array of valid email strings, for example: ["registrar@domain.edu.in", "info@domain.edu.in"]. No markdown, no explanations.`;

                // Try modern xAI grok model identifiers
                const modelCandidates = ["grok-2-latest", "grok-2", "grok-beta"];
                for (const model of modelCandidates) {
                    try {
                        const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${grokApiKey}`,
                            },
                            body: JSON.stringify({
                                model,
                                messages: [{ role: "user", content: prompt }],
                                temperature: 0.1,
                            }),
                        });

                        if (grokResponse.ok) {
                            const grokData = await grokResponse.json();
                            const content = grokData.choices?.[0]?.message?.content?.trim();
                            if (content) {
                                const jsonMatch = content.match(/\[.*\]/s);
                                if (jsonMatch) {
                                    const parsedEmails = JSON.parse(jsonMatch[0]);
                                    if (Array.isArray(parsedEmails) && parsedEmails.length > 0) {
                                        return res.status(200).json({
                                            emails: parsedEmails,
                                            source: "grok_ai",
                                        });
                                    }
                                }
                            }
                        }
                    } catch {}
                }
            } catch (grokErr) {
                console.warn("Grok AI API call failed, using intelligent domain engine:", grokErr);
            }
        }

        // 2. Intelligent, domain-aware fallback generator
        const fallbackEmails = deriveOfficialInstitutionEmails(institutionName, website);

        return res.status(200).json({
            emails: fallbackEmails,
            source: "domain_heuristic",
        });
    } catch (error: any) {
        console.error("Crawl college emails error:", error);
        return res.status(500).json({
            message: "Failed to crawl college emails",
            emails: ["registrar@college.edu.in", "admin@college.edu.in", "info@college.edu.in"],
        });
    }
}

// ============================================================
// Institutional / Organization Email OTP Verification
// ============================================================

export async function sendVerificationOtp(req: Request, res: Response): Promise<Response> {
    try {
        const { email, purpose } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                message: "Valid email address is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otp = Math.floor(100000 + Math.random() * 900000);

        const { email: senderEmail, password: senderPassword } = getEmailCredentials();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        const actionText = purpose === "organization" ? "Organization Verification" : "Institutional Email Verification";

        await transporter.sendMail({
            from: senderEmail,
            to: normalizedEmail,
            subject: `Your OTP for ${actionText} — PortalAcademia`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">PortalAcademia</h2>
                        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                            Use the following one-time verification token to verify your <strong>${actionText}</strong> on PortalAcademia:
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; padding: 12px 24px; border-radius: 6px; display: inline-block;">
                                ${otp}
                            </span>
                        </div>
                        <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
                            • This token expires in 10 minutes.
                        </p>
                        <p style="color: #64748b; font-size: 12px; margin-top: 0;">
                            • If you did not request this verification, please disregard this message.
                        </p>
                    </div>
                </div>
            `,
        });

        OnboardingOtpMap.set(normalizedEmail, {
            otp,
            email: normalizedEmail,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins validity
        });

        return res.status(200).json({
            success: true,
            message: `Verification OTP dispatched to ${normalizedEmail}`,
        });
    } catch (error: any) {
        console.error("Send verification OTP error:", error);
        return res.status(500).json({
            message: error.message || "Failed to dispatch verification OTP",
        });
    }
}

export async function verifyOnboardingOtp(req: Request, res: Response): Promise<Response> {
    try {
        const { email, otp } = req.body;

        if (!email || otp === undefined) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const data = OnboardingOtpMap.get(normalizedEmail);

        if (!data) {
            return res.status(400).json({
                verified: false,
                message: "OTP expired or not requested for this email",
            });
        }

        if (Date.now() > data.expiresAt) {
            OnboardingOtpMap.delete(normalizedEmail);
            return res.status(400).json({
                verified: false,
                message: "Verification OTP has expired. Please request a new code.",
            });
        }

        if (Number(otp) !== data.otp) {
            return res.status(400).json({
                verified: false,
                message: "Incorrect OTP entered",
            });
        }

        // Clean up OTP on success
        OnboardingOtpMap.delete(normalizedEmail);

        return res.status(200).json({
            verified: true,
            message: "Email verified successfully!",
        });
    } catch (error: any) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            verified: false,
            message: "Failed to verify OTP",
        });
    }
}
