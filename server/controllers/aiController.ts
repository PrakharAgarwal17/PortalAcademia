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
 * Intelligent domain fallback response engine grounded in PortalAcademia telemetry.
 * Provides concise, direct responses to career/academic queries and generic responses for off-topic queries.
 */
function generateContextualLocalResponse(
    query: string,
    profile: any,
    assessments: any[],
    applications: any[],
    trendingOpportunities: any[]
): string {
    const q = query.toLowerCase().trim();
    const candidateName = profile?.name || "Scholar";
    const userRole = (profile?.accountType || "student").toLowerCase();

    // 1. Detect Code Generation Requests (Strict Policy)
    const codeGenKeywords = [
        "write code", "generate code", "code for", "write python", "write javascript",
        "write react", "write java", "write c++", "write html", "write css", "code snippet",
        "give me code", "create function", "implement code", "script for", "build program", "write script"
    ];

    if (codeGenKeywords.some((kw) => q.includes(kw))) {
        return "I am your PortalAcademia AI Career & Academic Guide focused strictly on career strategy, skill guidance, and placement prep. I do not generate code or write scripts. Please use PortalAcademia standardized skill assessments to test and verify your coding skills!";
    }

    // 2. Detect Irrelevant / Off-Topic Queries
    const offTopicKeywords = [
        "movie", "film", "actor", "actress", "song", "music", "joke", "funny",
        "recipe", "food", "cook", "dish", "weather", "rain", "temperature",
        "cricket", "football", "sports", "match", "gaming", "politics", "election",
        "crypto", "bitcoin", "stock market", "dance", "singing", "gossip", "story"
    ];

    if (offTopicKeywords.some((kw) => q.includes(kw))) {
        return "I am your PortalAcademia AI Guide focused strictly on academic and career development. Please ask me about your skills, assessments, internships, or academic initiatives.";
    }

    // =========================================================================
    // FACULTY SPECIFIC RESPONSES (Concise & Direct)
    // =========================================================================
    if (userRole === "faculty") {
        if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ")) {
            return `### Hello Professor ${candidateName}!
I am your **AI Academic & Research Advisor**. Ask me about syllabus modernization, research grants (DST-SERB), FDPs, or corporate sabbaticals.`;
        }

        if (q.includes("syllabus") || q.includes("curriculum") || q.includes("course") || q.includes("teach")) {
            return `### Modernizing Course Syllabus
1. **Identify Skill Deficits**: Embed cloud (Docker, API design) and applied ML in lab assignments.
2. **Micro-Projects**: Allocate 20% internal marks to real-world problem statements.
3. **Board of Studies**: Introduce modular electives matching live portal industry telemetry.`;
        }

        if (q.includes("sabbatical") || q.includes("cas") || q.includes("credit") || q.includes("immersion")) {
            return `### Corporate Sabbaticals & CAS Credits
1. **API Score (Cat III)**: Short-term corporate immersions (2–4 weeks) earn Category III API points under AICTE/UGC rules.
2. **NOC Protocol**: Generate your Sabbatical Proposal summary from your dashboard for Academic Council endorsement.`;
        }

        if (q.includes("research") || q.includes("grant") || q.includes("serb") || q.includes("dst") || q.includes("proposal")) {
            return `### Research Grants & Consultancy
1. **Joint Grants**: Explore DST-SERB and corporate co-funded research schemes.
2. **TRL Deliverables**: Target clear Technology Readiness Level progression (TRL 3 to TRL 6).
3. **Consultancy**: Bid as Principal Investigator (PI) for industry problem statements via your Faculty Console.`;
        }

        return `### Academic Guidance for Professor ${candidateName}
Regarding **"${query}"**: Focus on integrating this directly into coursework, engaging student researchers, or exploring matching industry partners on your Faculty Console.`;
    }

    // =========================================================================
    // STUDENT SPECIFIC RESPONSES (Concise & Direct)
    // =========================================================================

    // Greetings
    if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ")) {
        return `### Hello ${candidateName}!
I am your **PortalAcademia AI Career Guide**. How can I help with your skill gaps, assessment tests, or internship search today?`;
    }

    // Emotional / Anxiety
    if (
        q.includes("anxious") || q.includes("stress") || q.includes("overwhelm") ||
        q.includes("scared") || q.includes("fear") || q.includes("imposter") || q.includes("worry")
    ) {
        return `### Career Guidance for ${candidateName}
Placement pressure can feel overwhelming, but your worth is not defined by a single benchmark.
1. Take one 10-minute skill test on your dashboard to gauge your baseline.
2. Focus on mastering **one core skill** this week instead of trying to learn everything at once.
What specific skill or topic would you like to tackle first?`;
    }

    // Match Score
    if (q.includes("match score") || q.includes("low score") || q.includes("increase score")) {
        return `### Boosting Your Match Score
**Formula: Match Score = (70% Skill Overlap) + (30% Verified Assessment Badges)**
1. Add target skills to your profile.
2. Take standardized assessment tests on your dashboard to earn verified badges.`;
    }

    // Retake / Fail Assessment
    if (q.includes("fail") || q.includes("failed") || q.includes("retake") || q.includes("retest")) {
        return `### Assessment Recovery
Tests are diagnostic. Recruiters only see your highest passed badge (65%+ threshold). Review core concepts and retake the test anytime on your dashboard!`;
    }

    // Workload / Exams
    if (q.includes("time") || q.includes("busy") || q.includes("balance") || q.includes("exam") || q.includes("attendance")) {
        return `### Balancing Exams & Placement Prep
1. Apply for flexible or remote internships on the Opportunity Desk.
2. Spend 45 minutes daily on core skill building.
3. Use semester lab projects as verified portfolio submissions on PortalAcademia.`;
    }

    // General Student Fallback
    return `### Career Advice for ${candidateName}
Regarding **"${query}"**:
1. Build hands-on projects with clean documentation and live demos.
2. Take standardized tests on your dashboard to verify your skills.
3. Check the Opportunity Desk for matching corporate postings.`;
}


/**
 * @description Contextual AI Career Guide handling user queries with profile injection, role awareness, and Mongo TTL logging
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

        const userRole = (profile?.accountType || "student").toLowerCase();
        const userName = profile?.name || (userRole === "faculty" ? "Professor" : "Scholar");
        const verifiedSkills = profile?.skills || [];
        const userInstitution = profile?.institution || profile?.institutionName || profile?.companyName || "Academic Network";
        const assessmentSummary = assessments.map((a) => `${a.assessmentTitle}: ${a.percentage}% (${a.passed ? "Passed" : "Diagnostic Completed"})`).join("; ");
        const appStatusSummary = applications.map((app) => `Match Score ${app.matchScore}%, Status: ${app.status}`).join("; ");
        const oppSummary = trendingOpportunities.map((o) => `${o.title} at ${o.organization} (${o.stipendOrPrize})`).join("; ");

        // =========================================================================
        // DYNAMIC ROLE-BASED SYSTEM PROMPT
        // =========================================================================
        let systemPrompt = "";

        if (userRole === "faculty") {
            systemPrompt = `You are the PortalAcademia AI Academic Immersion & Research Advisor, assisting university professors and faculty members.

FACULTY SCHOLAR CONTEXT:
• Name: ${userName} (Faculty Member)
• Affiliation: ${userInstitution}
• Academic Domain / Expertise: ${verifiedSkills.join(", ") || profile?.department || "Higher Education Faculty"}

CRITICAL INSTRUCTIONS:
1. MINIMAL & CONCISE: Give crisp, minimal, and direct responses that answer ONLY what was explicitly asked. Do NOT include unsolicited long lectures or filler words.
2. IRRELEVANT / OFF-TOPIC QUERIES: If the user asks about irrelevant or non-academic topics (e.g. movies, sports, recipes, jokes, weather, politics, or general chit-chat), respond ONLY with: "I am your PortalAcademia AI Guide focused strictly on academic and career development. Please ask me about your skills, assessments, internships, or academic initiatives."
3. DIRECT & RELEVANT: Focus strictly on answering the explicit query: "${query}". Keep formatting clean and minimal.`;
        } else if (userRole === "student") {
            systemPrompt = `You are the PortalAcademia Contextual AI Career Guide, assisting students.

STUDENT CONTEXT:
• Name: ${userName} (Student)
• Affiliation: ${userInstitution}
• Verified Skills: ${verifiedSkills.join(", ") || "None verified yet"}

CRITICAL INSTRUCTIONS:
1. MINIMAL & CONCISE: Give crisp, minimal, and direct responses that answer ONLY what was explicitly asked: "${query}". Keep responses short and to the point without extra fluff or long speeches.
2. IRRELEVANT / OFF-TOPIC QUERIES: If the user asks about irrelevant topics (e.g. movies, recipes, sports, jokes, weather, politics, crypto, or random chit-chat), respond ONLY with: "I am your PortalAcademia AI Guide focused strictly on academic and career development. Please ask me about your skills, assessments, internships, or career strategy."
3. ABSOLUTE CODE GENERATION RESTRICTION: Do NOT write or generate raw source code, functions, programs, or scripts for the user. If asked to write or generate code, decline politely with: "I am your PortalAcademia AI Career & Academic Guide focused strictly on career strategy, skill guidance, and placement prep. I do not generate code. Please use PortalAcademia standardized assessments to test and verify your coding skills!"
4. DIRECT & ACTIONABLE: Provide practical, direct guidance with short bullet points when requested.`;
        } else {
            systemPrompt = `You are the PortalAcademia AI Advisor assisting ${userName} (${userRole}).
Give a minimal, direct, and concise response to "${query}". Do NOT generate code scripts. If off-topic, politely reply that you handle academic/career guidance.`;
        }

        let assistantResponse = "";
        let modelUsed = "local-expert-rag";
        let tokensUsed = 120;

        let apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
        let apiBaseUrl = "https://api.groq.com/openai/v1";

        // Candidate models on Groq: qwen3.8-27b is fast and reliable; openai/gpt-oss-120b and compound-mini as fallbacks
        const groqCandidateModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "groq/compound-mini"];

        if (apiKey && (apiKey.startsWith("gsk_") || process.env.GROQ_API_KEY || process.env.GROK_API_KEY)) {
            apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || apiKey;
            apiBaseUrl = "https://api.groq.com/openai/v1";

            const sanitizedHistory = (history || [])
                .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
                .slice(-6);

            const messagesPayload = [
                { role: "system", content: systemPrompt },
                ...sanitizedHistory,
                { role: "user", content: query },
            ];

            // Attempt primary model, fail over to candidate models if needed
            for (const candidateModel of groqCandidateModels) {
                try {
                    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: candidateModel,
                            messages: messagesPayload,
                            temperature: 0.4,
                            max_tokens: 1000,
                        }),
                    });

                    if (response.ok) {
                        const data = (await response.json()) as any;
                        const content = data.choices?.[0]?.message?.content;
                        if (content && typeof content === "string" && content.trim().length > 0) {
                            assistantResponse = content.trim();
                            modelUsed = candidateModel;
                            tokensUsed = data.usage?.total_tokens || 200;
                            break;
                        }
                    } else {
                        const errText = await response.text();
                        console.warn(`Groq model ${candidateModel} returned HTTP ${response.status}:`, errText);
                    }
                } catch (err) {
                    console.warn(`Error invoking Groq model ${candidateModel}:`, err);
                }
            }
        }

        // If external API was not configured or all candidate models failed, use upgraded local telemetry reasoning
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
