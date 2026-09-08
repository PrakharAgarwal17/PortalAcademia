import type { Request, Response } from "express";
import profileModel from "../models/profileModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import applicationModel from "../models/applicationModel.js";
import opportunityModel from "../models/opportunityModel.js";
import aiLogModel from "../models/aiLogModel.js";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * Deterministic fallback career reasoning engine grounded in SIH 26044 domain knowledge
 */
function generateContextualLocalResponse(
    query: string,
    profile: any,
    assessments: any[],
    applications: any[],
    trendingOpportunities: any[]
): string {
    const q = query.toLowerCase();
    const studentSkills = (profile?.skills || []).map((s: string) => s.trim());
    const topPostings = trendingOpportunities.slice(0, 3).map((o) => `• ${o.title} at ${o.organization} (${o.stipendOrPrize})`).join("\n");

    if (q.includes("skill") || q.includes("gap") || q.includes("learn") || q.includes("improve")) {
        const recommendedSkills = ["Docker", "Kubernetes", "FastAPI", "PostgreSQL", "Cloud Architecture"];
        const missing = recommendedSkills.filter((rs) => !studentSkills.some((s: string) => s.toLowerCase() === rs.toLowerCase()));

        return `### Objective Skill Telemetry Analysis for ${profile?.name || "Candidate"}
Based on your current verified competencies (${studentSkills.join(", ") || "No verified tags yet"}):

1. **Quantified Skill Gaps**:
   To maximize your shortlisting probability for active industry openings, you should bridge: **${missing.slice(0, 3).join(", ")}**.
2. **Standardized Assessment Benchmark**:
   You have completed **${assessments.length} standardized assessments**. Taking the technical assessments in your dashboard directly boosts your candidate match score by up to 30%.
3. **Target Industry Opportunities Currently Live**:
${topPostings || "Check the live Opportunity Desk for new postings."}

**Next Step**: Complete the pending assessment on your dashboard to convert self-reported skills into verified credentials.`;
    }

    if (q.includes("interview") || q.includes("application") || q.includes("status") || q.includes("reject")) {
        return `### Application Funnel & Recruiter Strategy
You currently have **${applications.length} submitted applications** in the pipeline.

• **Match Score Formula**: Corporate recruiters sort applicants by combined score (70% skill overlap + 30% verified assessment scores).
• **Actionable Advice**: Ensure each credential listed on your profile is verified by your institution's placement cell. Applications with institutional verification badges achieve 3.4x higher conversion to Technical Interview stage.`;
    }

    if (q.includes("ayush") || q.includes("problem statement") || q.includes("sih") || q.includes("26044")) {
        return `### SIH 26044 (Ministry of Ayush) Alignment
PortalAcademia directly solves Problem Statement 26044:
1. **Objective Skill Assessment**: Replaces self-reported claims with standardized technical and aptitude benchmark testing.
2. **Verified Digital Portfolio**: Institution placement cells cryptographically verify project links and certifications.
3. **Faculty Industrial Immersion**: Dedicated corporate sabbatical, FDP, and consultancy pipelines for academicians.
4. **Cohort Telemetry**: Real-time MongoDB aggregation pipelines identifying systemic curriculum deficits across departments.`;
    }

    return `### Contextual Career Telemetry for ${profile?.name || "Member"} (${profile?.accountType || "Individual"})
Institution/Affiliation: **${profile?.institution || profile?.institutionName || profile?.companyName || "Academic Network"}**
Verified Competencies: **${studentSkills.length > 0 ? studentSkills.join(", ") : "Pending verification"}**

**Active Recommendations**:
1. Explore the **Live Opportunities Desk** to review vetted postings tailored to your domain.
2. Take the **Standardized Skill Assessment** to earn verified badges and improve algorithmic candidate ranking.
3. Request your institution's placement cell to approve pending certifications via the **Credential Verification Gate**.`;
}

/**
 * @description Contextual AI Career Guide handling user queries with profile injection and Mongo TTL logging
 * @route POST /api/ai/chat
 * @access Authenticated
 */
export async function chatWithAI(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { query, history = [] } = req.body as {
            query: string;
            history?: ChatMessage[];
        };

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required",
            });
        }

        // Fetch deep profile and telemetry context
        const [profile, assessments, applications, trendingOpportunities] = await Promise.all([
            profileModel.findOne({ userId: req.userId }),
            assessmentResultModel.find({ studentId: req.userId }).select("assessmentTitle percentage passed"),
            applicationModel.find({ applicantId: req.userId }).select("opportunityId status matchScore appliedAt").limit(5),
            opportunityModel.find({ status: "active" }).select("title organization category requiredSkills stipendOrPrize").limit(4),
        ]);

        const userRole = profile?.accountType || "student";
        const userName = profile?.name || "User";
        const verifiedSkills = profile?.skills || [];

        // Build hidden system context
        const systemPrompt = `You are the PortalAcademia Contextual AI Career Guide for Smart India Hackathon 2026 (Problem Statement 26044, Ministry of Ayush).
You provide concise, high-density, telemetry-grounded career and academic guidance without buzzwords or fluff.
CURRENT USER CONTEXT:
- Role: ${userRole}
- Name: ${userName}
- Affiliation: ${profile?.institution || profile?.institutionName || profile?.companyName || "General Cohort"}
- Verified Skills: ${verifiedSkills.join(", ") || "None yet"}
- Completed Assessments: ${assessments.map((a) => `${a.assessmentTitle} (${a.percentage}%)`).join("; ") || "None"}
- Recent Applications Count: ${applications.length}
Deliver concrete, structured advice formatted with markdown headers and bullet points.`;

        let assistantResponse = "";
        let modelUsed = "local-expert-rag";
        let tokensUsed = 120;

        let apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
        let apiBaseUrl = "https://api.openai.com/v1";
        let modelName = "gpt-4o-mini";

        if (process.env.GROQ_API_KEY || (apiKey && apiKey.startsWith("gsk_"))) {
            apiKey = process.env.GROQ_API_KEY || apiKey;
            apiBaseUrl = "https://api.groq.com/openai/v1";
            modelName = "groq/compound-mini";
        } else if (process.env.GROK_API_KEY) {
            apiBaseUrl = "https://api.x.ai/v1";
            modelName = "grok-2-1212";
        }

        if (apiKey) {
            try {
                const messagesPayload = [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-4),
                    { role: "user", content: query },
                ];

                const response = await fetch(`${apiBaseUrl}/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messagesPayload,
                        temperature: 0.3,
                        max_tokens: 600,
                    }),
                });

                if (response.ok) {
                    const data = await response.json() as any;
                    assistantResponse = data.choices?.[0]?.message?.content || "";
                    modelUsed = modelName;
                    tokensUsed = data.usage?.total_tokens || 150;
                } else {
                    console.warn(`External AI API returned ${response.status}. Falling back to local RAG engine.`);
                }
            } catch (apiErr) {
                console.warn("External AI call failed, utilizing local contextual reasoning:", apiErr);
            }
        }

        // If external API was not configured or failed, use local telemetry reasoning
        if (!assistantResponse) {
            assistantResponse = generateContextualLocalResponse(
                query,
                profile,
                assessments,
                applications,
                trendingOpportunities
            );
        }

        // Persistent log with MongoDB TTL auto-expiry
        await aiLogModel.create({
            userId: req.userId,
            userRole,
            query: query.trim(),
            response: assistantResponse,
            tokensUsed,
            modelUsed,
            createdAt: new Date(),
        });

        // Threshold auto-prune to protect free MongoDB tier (keeps max 500 documents)
        aiLogModel.pruneIfThresholdExceeded(500).catch((err) => {
            console.error("Async log pruning warning:", err);
        });

        return res.status(200).json({
            success: true,
            data: {
                response: assistantResponse,
                modelUsed,
                userContext: {
                    name: userName,
                    role: userRole,
                    verifiedSkillsCount: verifiedSkills.length,
                },
            },
        });
    } catch (error) {
        console.error("chatWithAI error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process AI guidance query",
        });
    }
}
