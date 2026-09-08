import type { Request, Response } from "express";
import nodemailer from "nodemailer";

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

// Safe AISHE dataset loader
import { createRequire } from "module";
const esmRequire = createRequire(import.meta.url);

let aisheDataSet: Array<{ name?: string; aishe_code?: string; state?: string; district?: string }> = [];
try {
    aisheDataSet = esmRequire("aishe-institutions-list/data/institutions.json");
} catch {
    aisheDataSet = [];
}

function searchAishe(query: string, limit = 25) {
    if (!query || !aisheDataSet.length) return [];
    const cleanQuery = query.toLowerCase().trim();
    const words = cleanQuery.split(/\s+/).filter(Boolean);
    const results = [];
    for (const inst of aisheDataSet) {
        const name = (inst.name || "").toLowerCase();
        const code = (inst.aishe_code || "").toLowerCase();
        const state = (inst.state || "").toLowerCase();
        if (code.includes(cleanQuery) || words.every((w) => name.includes(w) || state.includes(w))) {
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
Examples of expected formats: registrar@..., admin@..., principal@..., contact@..., info@... with their authentic domain.
Output ONLY a JSON array of valid email strings, for example: ["registrar@domain.edu.in", "info@domain.edu.in"]. No markdown, no explanations.`;

                const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${grokApiKey}`,
                    },
                    body: JSON.stringify({
                        model: "grok-beta",
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
            } catch (grokErr) {
                console.warn("Grok AI API call failed, generating fallback domain suggestions:", grokErr);
            }
        }

        // 2. Intelligent fallback email generation based on institution name / website
        let domain = "ac.in";
        if (website) {
            try {
                const url = new URL(website.startsWith("http") ? website : `https://${website}`);
                domain = url.hostname.replace(/^www\./, "");
            } catch {
                domain = "ac.in";
            }
        } else {
            const words = institutionName
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .split(" ")
                .filter((w) => !["of", "and", "the", "in", "for"].includes(w));
            const acronym = words.map((w) => w[0]).join("");
            domain = `${acronym}.ac.in`;
        }

        const fallbackEmails = [
            `registrar@${domain}`,
            `admin@${domain}`,
            `principal@${domain}`,
            `info@${domain}`,
            `academics@${domain}`,
        ];

        return res.status(200).json({
            emails: fallbackEmails,
            source: "domain_heuristic",
        });
    } catch (error: any) {
        console.error("Crawl college emails error:", error);
        return res.status(500).json({
            message: "Failed to crawl college emails",
            emails: ["registrar@college.ac.in", "admin@college.ac.in", "info@college.ac.in"],
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
