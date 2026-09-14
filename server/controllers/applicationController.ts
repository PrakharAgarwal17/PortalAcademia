import type { Request, Response } from "express";
import applicationModel, { type ApplicationStatus } from "../models/applicationModel.js";
import opportunityModel from "../models/opportunityModel.js";
import profileModel from "../models/profileModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import {
    generateEmbedding,
    cosineSimilarity,
    buildCandidateText,
    buildJobText,
} from "../services/vectorService.js";

/**
 * @description Apply to an active opportunity with automated objective match scoring
 * @route POST /api/applications
 * @access Authenticated (Student / Faculty)
 */
export async function applyToOpportunity(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
        }

        const { opportunityId, notes, resumeUrl, resumeData, customAtsScore } = req.body;

        if (!opportunityId) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory parameter: opportunityId",
            });
        }

        const opportunity = await opportunityModel.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found",
            });
        }

        if (opportunity.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "This opportunity is closed for applications",
            });
        }

        // Check for duplicate application
        const existingApplication = await applicationModel.findOne({
            opportunityId,
            applicantId: req.userId,
        });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted an application for this opportunity.",
                data: existingApplication,
            });
        }

        // Fetch applicant profile
        const profile = await profileModel.findOne({ userId: req.userId });
        if (!profile) {
            return res.status(400).json({
                success: false,
                message: "Please complete your profile onboarding before submitting applications.",
            });
        }

        const studentSkills = (profile.skills || []).map((s) => s.toLowerCase().trim());
        const requiredSkills = (opportunity.requiredSkills || []).map((s) => s.toLowerCase().trim());

        // 1. Skill Overlap Calculation (70% Weight)
        let matchedCount = 0;
        if (requiredSkills.length > 0) {
            for (const reqSkill of requiredSkills) {
                if (studentSkills.some((s) => s.includes(reqSkill) || reqSkill.includes(s))) {
                    matchedCount += 1;
                }
            }
        }
        const skillScore = requiredSkills.length > 0
            ? (matchedCount / requiredSkills.length) * 100
            : 85;

        // 2. Objective Assessment Benchmark (30% Weight)
        const pastResults = await assessmentResultModel
            .find({ studentId: req.userId, passed: true })
            .select("percentage");

        let assessmentScore = 70; // baseline aptitude if no test taken yet
        if (pastResults.length > 0) {
            const sum = pastResults.reduce((acc, curr) => acc + curr.percentage, 0);
            assessmentScore = Math.round(sum / pastResults.length);
        }

        // Blended vector match score
        const matchScore = Math.min(
            100,
            Math.max(10, Math.round(skillScore * 0.7 + assessmentScore * 0.3))
        );

        // 3. ATS Score Calculation (Zero LLM Token Usage - Fast & Deterministic)
        let atsScore = customAtsScore;
        if (atsScore === undefined || typeof atsScore !== "number") {
            const skillWeight = Math.round(skillScore * 0.45);
            const resumeWeight = (resumeUrl || resumeData) ? 25 : 10;

            let profileWeight = 0;
            if (profile.bio) profileWeight += 5;
            if (profile.education && profile.education.length > 0) profileWeight += 10;
            if (profile.pastExperience && profile.pastExperience.length > 0) profileWeight += 10;
            if (profile.certifications && profile.certifications.length > 0) profileWeight += 5;

            atsScore = Math.min(100, Math.max(15, skillWeight + resumeWeight + profileWeight));
        }

        const application = await applicationModel.create({
            opportunityId,
            applicantId: req.userId,
            applicantName: profile.name || "Candidate",
            applicantEmail: profile.institutionEmail || profile.workEmail || "applicant@portalacademia.ac.in",
            applicantInstitution: profile.institution || profile.institutionName || "Academic Cohort",
            applicantSkills: profile.skills || [],
            matchScore,
            atsScore,
            resumeUrl: resumeUrl || "",
            resumeData: resumeData || null,
            status: "Applied",
            appliedAt: new Date(),
            notes: notes || "",
        });

        // Increment applicant count on opportunity
        opportunity.applicantCount = (opportunity.applicantCount || 0) + 1;
        await opportunity.save();

        // ── Fire-and-forget: generate semantic embedding & score ──
        (async () => {
            try {
                const assessments = await assessmentResultModel
                    .find({ studentId: req.userId as any, passed: true } as any)
                    .select("assessmentTitle percentage passed");

                const candidateText = buildCandidateText(profile, assessments);
                const candidateVec = await generateEmbedding(candidateText);
                if (!candidateVec) return;

                // Fetch job embedding (explicitly select the hidden field)
                const opp = await opportunityModel
                    .findById(opportunityId)
                    .select("+jobEmbedding");

                let semanticScore = 0;
                if (opp && opp.jobEmbedding && opp.jobEmbedding.length > 0) {
                    semanticScore = Math.round(
                        cosineSimilarity(candidateVec, opp.jobEmbedding) * 100
                    );
                }

                await applicationModel.findByIdAndUpdate(application._id, {
                    candidateEmbedding: candidateVec,
                    semanticScore,
                });

                console.log(
                    `[vectorService] Embedding generated for application ${application._id}, semanticScore=${semanticScore}`
                );
            } catch (embErr) {
                console.error("[vectorService] Async embedding generation failed:", embErr);
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            data: application,
        });
    } catch (error: any) {
        console.error("applyToOpportunity error:", error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this opportunity",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to submit application",
        });
    }
}

/**
 * @description Fetch all applications submitted by the logged-in user
 * @route GET /api/applications/my-applications
 * @access Authenticated (Student / Faculty)
 */
export async function getMyApplications(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const applications = await applicationModel
            .find({ applicantId: req.userId })
            .populate({
                path: "opportunityId",
                select: "title organization category domain location mode stipendOrPrize deadline status",
            })
            .sort({ appliedAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications,
        });
    } catch (error) {
        console.error("getMyApplications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applications",
        });
    }
}

/**
 * @description Fetch all applicants for a specific opportunity (ranked by match score)
 * @route GET /api/applications/opportunity/:opportunityId
 * @access Authenticated (Opportunity Creator / Recruiter)
 */
export async function getApplicantsForOpportunity(req: Request, res: Response) {
    try {
        const { opportunityId } = req.params;

        const opportunity = await opportunityModel.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        // Verify that logged-in user is the creator or has admin/industry privileges
        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not the recruiter for this opportunity",
            });
        }

        const applicants = await applicationModel
            .find({ opportunityId: opportunityId as any })
            .sort({ matchScore: -1, appliedAt: 1 });

        return res.status(200).json({
            success: true,
            count: applicants.length,
            data: applicants,
        });
    } catch (error) {
        console.error("getApplicantsForOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applicants",
        });
    }
}

/**
 * @description Transition applicant stage progression in the recruitment pipeline
 * @route PATCH /api/applications/:id/status
 * @access Authenticated (Recruiter / Industry)
 */
export async function updateApplicationStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status, reviewerNotes } = req.body as {
            status: ApplicationStatus;
            reviewerNotes?: string;
        };

        const validStatuses: ApplicationStatus[] = [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Technical Interview",
            "Offered",
            "Rejected",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status: Must be one of [${validStatuses.join(", ")}]`,
            });
        }

        const application = await applicationModel.findById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        application.status = status;
        if (reviewerNotes !== undefined) {
            application.reviewerNotes = reviewerNotes;
        }

        await application.save();

        return res.status(200).json({
            success: true,
            message: `Application status updated to ${status}`,
            data: application,
        });
    } catch (error) {
        console.error("updateApplicationStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update application status",
        });
    }
}

/**
 * @description Get applicants for an opportunity ranked by semantic similarity score
 * @route GET /api/applications/opportunity/:opportunityId/semantic-ranking
 * @access Authenticated (Recruiter / Publisher)
 */
export async function getSemanticRanking(req: Request, res: Response) {
    try {
        const { opportunityId } = req.params;

        const opportunity = await opportunityModel.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not the recruiter for this opportunity",
            });
        }

        const applicants = await applicationModel
            .find({ opportunityId: opportunityId as any })
            .sort({ semanticScore: -1, matchScore: -1, appliedAt: 1 });

        return res.status(200).json({
            success: true,
            count: applicants.length,
            data: applicants,
        });
    } catch (error) {
        console.error("getSemanticRanking error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch semantic ranking",
        });
    }
}

/**
 * @description Batch-update application statuses within a semantic score range
 * @route POST /api/applications/opportunity/:opportunityId/batch-triage
 * @access Authenticated (Recruiter / Publisher)
 */
export async function batchTriage(req: Request, res: Response) {
    try {
        const { opportunityId } = req.params;
        const { action, minSemanticScore, maxSemanticScore = 100 } = req.body as {
            action: ApplicationStatus;
            minSemanticScore: number;
            maxSemanticScore?: number;
        };

        const validStatuses: ApplicationStatus[] = [
            "Applied", "Under Review", "Shortlisted", "Technical Interview", "Offered", "Rejected",
        ];

        if (!validStatuses.includes(action)) {
            return res.status(400).json({
                success: false,
                message: `Invalid action: Must be one of [${validStatuses.join(", ")}]`,
            });
        }

        if (typeof minSemanticScore !== "number") {
            return res.status(400).json({
                success: false,
                message: "minSemanticScore is required and must be a number",
            });
        }

        const opportunity = await opportunityModel.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not the recruiter for this opportunity",
            });
        }

        const result = await applicationModel.updateMany(
            {
                opportunityId: opportunityId as any,
                semanticScore: { $gte: minSemanticScore, $lte: maxSemanticScore },
            },
            { $set: { status: action } }
        );

        return res.status(200).json({
            success: true,
            message: `Batch triage complete: ${result.modifiedCount} applications moved to ${action}`,
            data: { modifiedCount: result.modifiedCount },
        });
    } catch (error) {
        console.error("batchTriage error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to perform batch triage",
        });
    }
}

/**
 * @description Search applicants for an opportunity using natural language semantic query
 * @route POST /api/applications/opportunity/:opportunityId/semantic-search
 * @access Authenticated (Recruiter / Publisher)
 */
export async function semanticSearchCandidates(req: Request, res: Response) {
    try {
        const { opportunityId } = req.params;
        const { query } = req.body as { query: string };

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "query parameter is required",
            });
        }

        const opportunity = await opportunityModel.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not the recruiter for this opportunity",
            });
        }

        // Embed the search query
        const queryVector = await generateEmbedding(query.trim());
        if (!queryVector) {
            return res.status(503).json({
                success: false,
                message: "Semantic search temporarily unavailable (embedding service unreachable)",
            });
        }

        // Fetch all candidates with their embeddings for this opportunity
        const applicants = await applicationModel
            .find({ opportunityId: opportunityId as any })
            .select("+candidateEmbedding");

        // Compute cosine similarity and rank
        const ranked = applicants
            .filter((app) => app.candidateEmbedding && app.candidateEmbedding.length > 0)
            .map((app) => {
                const score = Math.round(
                    cosineSimilarity(queryVector, app.candidateEmbedding) * 100
                );
                const appObj = app.toObject();
                delete (appObj as any).candidateEmbedding; // Don't send 384 floats to client
                return { ...appObj, searchScore: score };
            })
            .sort((a, b) => b.searchScore - a.searchScore);

        // Also include candidates without embeddings at the bottom
        const noEmbedding = applicants
            .filter((app) => !app.candidateEmbedding || app.candidateEmbedding.length === 0)
            .map((app) => {
                const appObj = app.toObject();
                delete (appObj as any).candidateEmbedding;
                return { ...appObj, searchScore: 0 };
            });

        return res.status(200).json({
            success: true,
            count: ranked.length + noEmbedding.length,
            data: [...ranked, ...noEmbedding],
        });
    } catch (error) {
        console.error("semanticSearchCandidates error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to perform semantic search",
        });
    }
}

/**
 * @description Generate an AI candidate brief (strengths, gaps, interview questions) via Groq LLM
 * @route GET /api/applications/:id/ai-brief
 * @access Authenticated (Recruiter / Publisher)
 */
export async function getAICandidateBrief(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const application = await applicationModel.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await opportunityModel.findById(application.opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not the recruiter for this opportunity",
            });
        }

        // Build context for the LLM
        const jobContext = `Job: ${opportunity.title} at ${opportunity.organization}. ` +
            `Description: ${opportunity.description}. ` +
            `Required Skills: ${(opportunity.requiredSkills || []).join(", ")}. ` +
            `Domain: ${opportunity.domain}.`;

        const candidateContext = `Candidate: ${application.applicantName}. ` +
            `Institution: ${application.applicantInstitution}. ` +
            `Skills: ${(application.applicantSkills || []).join(", ")}. ` +
            `Match Score: ${application.matchScore}%. ` +
            `Semantic Score: ${application.semanticScore}%. ` +
            `ATS Score: ${application.atsScore || 0}%.`;

        const briefPrompt = `You are a senior technical recruiter AI. Given the following job posting and candidate profile, generate a concise candidate assessment brief.

${jobContext}

${candidateContext}

Respond in EXACTLY this JSON format (no markdown, no code fences, just raw JSON):
{
  "verdict": "One-line executive verdict (e.g., Strong Match - Top 10%)",
  "matchedCompetencies": ["competency 1", "competency 2", "competency 3"],
  "identifiedGaps": ["gap 1", "gap 2"],
  "interviewQuestions": ["question 1", "question 2", "question 3"]
}`;

        // Use existing Groq API setup from aiController pattern
        const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
        const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "groq/compound-mini"];

        let briefData: {
            verdict: string;
            matchedCompetencies: string[];
            identifiedGaps: string[];
            interviewQuestions: string[];
        } | null = null;

        if (apiKey) {
            for (const model of groqModels) {
                try {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: "system", content: "You are a technical recruiter AI. Respond only in valid JSON." },
                                { role: "user", content: briefPrompt },
                            ],
                            temperature: 0.3,
                            max_tokens: 600,
                        }),
                    });

                    if (response.ok) {
                        const data = (await response.json()) as any;
                        const content = data.choices?.[0]?.message?.content;
                        if (content) {
                            // Strip markdown code fences if present
                            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                            briefData = JSON.parse(cleaned);
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`[ai-brief] Groq model ${model} failed:`, err);
                }
            }
        }

        // Fallback if Groq is unavailable
        if (!briefData) {
            briefData = {
                verdict: `Match Score: ${application.matchScore}% | Semantic Score: ${application.semanticScore}%`,
                matchedCompetencies: (application.applicantSkills || []).filter((s: string) =>
                    (opportunity.requiredSkills || []).some((rs: string) =>
                        rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase())
                    )
                ),
                identifiedGaps: (opportunity.requiredSkills || []).filter((rs: string) =>
                    !(application.applicantSkills || []).some((s: string) =>
                        rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase())
                    )
                ),
                interviewQuestions: ["AI brief generation temporarily unavailable. Review candidate manually."],
            };
        }

        return res.status(200).json({
            success: true,
            data: briefData,
        });
    } catch (error) {
        console.error("getAICandidateBrief error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate AI candidate brief",
        });
    }
}
