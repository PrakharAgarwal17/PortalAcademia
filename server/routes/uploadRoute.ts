import express, { type Request, type Response, type NextFunction } from "express";
import { createRequire } from "module";
import upload from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { getCache, setCache } from "../config/redisClient.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import profileModel from "../models/profileModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import opportunityModel from "../models/opportunityModel.js";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const router = express.Router();

/**
 * Rate Limiter Middleware for Costly / Abusable File Upload & OCR Endpoints
 * Enforces max 10 uploads per 15 minutes per user / IP using Redis with seamless in-memory fallback.
 */
async function uploadRateLimiter(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const actorId = req.userId || req.ip || "unknown-actor";
        const key = `ratelimit:resume-upload:${actorId}`;
        const current = await getCache<{ count: number; firstAt: number }>(key);
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes window
        const maxUploads = 10;

        if (current) {
            if (current.count >= maxUploads) {
                return res.status(429).json({
                    success: false,
                    message: "Too many upload requests. You have reached the limit of 10 resume analyses per 15 minutes. Please try again later.",
                });
            }
            const remainingSec = Math.max(1, Math.round((windowMs - (now - current.firstAt)) / 1000));
            await setCache(key, { count: current.count + 1, firstAt: current.firstAt }, remainingSec);
        } else {
            await setCache(key, { count: 1, firstAt: now }, 15 * 60);
        }
        next();
    } catch (err) {
        // Fail-open for rate limiter so transient cache faults don't break genuine user requests
        console.warn("Upload rate-limiter fallback triggered:", err);
        next();
    }
}

/**
 * POST /api/upload/single
 * Uploads a single file to Cloudinary and returns its secure URL string
 */
router.post(
    "/single",
    isloggedIn,
    upload.single("file"),
    async (req: Request, res: Response): Promise<Response> => {
        try {
            const file = (req as any).file as Express.Multer.File | undefined;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const folder = (req.body.folder as string) || "portal_academia/uploads";
            const isImage = file.mimetype.startsWith("image/");
            const resourceType = isImage ? "image" : "auto";

            const result = await uploadToCloudinary(
                file.buffer,
                folder,
                resourceType
            );

            return res.status(200).json({
                success: true,
                message: "File uploaded successfully",
                url: result.url,
                publicId: result.publicId,
            });
        } catch (error: any) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload file",
            });
        }
    }
);

/**
 * POST /api/upload/resume-score
 * Uploads a resume (PDF / DOCX), extracts text, computes unified ATS match score, and saves to Cloudinary.
 * Guarded by auth and Redis sliding-window rate limiting.
 */
router.post(
    "/resume-score",
    isloggedIn,
    uploadRateLimiter,
    upload.single("resume"),
    async (req: Request, res: Response): Promise<Response> => {
        try {
            const file = (req as any).file as Express.Multer.File | undefined;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "No resume file provided. Please upload a PDF or DOCX file.",
                });
            }

            const originalName = file.originalname || "resume.pdf";
            const isPdf = file.mimetype === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");
            const isDocx =
                file.mimetype.includes("word") ||
                originalName.toLowerCase().endsWith(".docx") ||
                file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            if (!isPdf && !isDocx) {
                return res.status(400).json({
                    success: false,
                    message: "Unsupported file type. Please upload a valid PDF (.pdf) or Word document (.docx).",
                });
            }

            // Max file size: 5MB
            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeds 5MB limit. Please upload a smaller resume.",
                });
            }

            // 1. Text Extraction
            let extractedText = "";
            if (isPdf) {
                const parser = new PDFParse({ data: file.buffer });
                try {
                    const parsed = await parser.getText();
                    extractedText = parsed.text || "";
                } finally {
                    await parser.destroy().catch(() => {});
                }
            } else {
                const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
                extractedText = docxResult.value || "";
            }

            // Clean extracted text
            const normalizedText = extractedText.replace(/\r\n/g, "\n").trim();

            // 2. Fetch User Profile and Past Assessments for Skill Reconciliation
            const profile = await profileModel.findOne({ userId: req.userId } as any);
            const pastResults = await assessmentResultModel
                .find({ studentId: req.userId, passed: true } as any)
                .select("assessmentTitle percentage relatedSkills");

            // 3. Resolve Target Job Requirements
            let requiredSkills: string[] = [];
            let jobTitle = "Opportunity";

            if (req.body.opportunityId) {
                const opp = await opportunityModel.findById(req.body.opportunityId);
                if (opp) {
                    requiredSkills = opp.requiredSkills || [];
                    jobTitle = opp.title;
                }
            } else if (req.body.requiredSkills) {
                try {
                    requiredSkills = typeof req.body.requiredSkills === "string"
                        ? JSON.parse(req.body.requiredSkills)
                        : req.body.requiredSkills;
                } catch (_) {
                    requiredSkills = String(req.body.requiredSkills)
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
            }

            // 4. Extract Detected Skills from Document Text
            const candidateSkillPool = new Set<string>();
            (profile?.skills || []).forEach((sk) => candidateSkillPool.add(sk.toLowerCase().trim()));

            // Scan extracted document text for presence of required skills and profile skills
            const lowerDoc = normalizedText.toLowerCase();
            requiredSkills.forEach((rs) => {
                if (lowerDoc.includes(rs.toLowerCase().trim())) {
                    candidateSkillPool.add(rs.toLowerCase().trim());
                }
            });

            // 5. Structure Information from Document Text and Profile
            const hasSummary = /summary|objective|profile|about me/i.test(normalizedText) || Boolean(profile?.bio);
            const hasEducation = /education|qualification|degree|b\.?tech|bachelor|master|university|college|school/i.test(normalizedText) || (profile?.education && profile.education.length > 0);
            const hasExperience = /experience|employment|work history|project|internship|roles/i.test(normalizedText) || (profile?.pastExperience && profile.pastExperience.length > 0);

            // Extract email/phone if present in resume text
            const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const phoneMatch = normalizedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

            const assessmentScores = pastResults.map((r) => ({
                skill: r.assessmentTitle || (r.relatedSkills && r.relatedSkills[0]) || "",
                score: r.percentage,
            }));

            // 6. Calculate Authoritative Unified ATS Score
            const atsAnalysis = calculateAtsScore(
                {
                    fullName: profile?.name || "Candidate",
                    email: emailMatch ? emailMatch[0] : (profile?.institutionEmail || (profile as any)?.email),
                    phone: phoneMatch ? phoneMatch[0] : profile?.contact,
                    location: profile?.location || "India",
                    summary: hasSummary ? (profile?.bio || normalizedText.slice(0, 150)) : "",
                    skills: Array.from(candidateSkillPool),
                    verifiedSkills: profile?.verifiedSkills || [],
                    assessmentScores,
                    institutionCredentials: (profile?.certifications || []).map((c: any) => ({
                        title: c.title,
                        isVerified: Boolean(c.isVerified),
                    })),
                    education: hasEducation ? (profile?.education || [{ education: "Higher Education" }]) : [],
                    experience: hasExperience ? (profile?.pastExperience || [{ title: "Professional Project" }]) : [],
                    certifications: profile?.certifications || [],
                },
                {
                    requiredSkills,
                    title: jobTitle,
                }
            );

            // 7. Upload Raw Resume Buffer to Cloudinary
            const uploadResult = await uploadToCloudinary(
                file.buffer,
                "portal_academia/resumes",
                "auto"
            );

            return res.status(200).json({
                success: true,
                message: "Resume successfully parsed, scored, and uploaded",
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                filename: originalName,
                atsAnalysis,
                extractedSkillsCount: candidateSkillPool.size,
                charCount: normalizedText.length,
            });
        } catch (error: any) {
            console.error("Resume upload & scoring error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to process and score resume upload",
            });
        }
    }
);

export default router;
