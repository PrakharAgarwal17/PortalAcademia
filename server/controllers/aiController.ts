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
 * Understands user concerns: stress/anxiety, low match scores, test failures, verification delays, time crunch, career path dilemmas, faculty sabbaticals
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
    const topPostings = trendingOpportunities.slice(0, 3).map((o) => `• **${o.title}** at ${o.organization} (${o.stipendOrPrize})`).join("\n");
    const candidateName = profile?.name || "Candidate";
    const userRole = profile?.accountType || "student";

    // 1. Emotional Concerns: Anxiety, Stress, Imposter Syndrome, Fear of Failure
    if (
        q.includes("anxious") || q.includes("stress") || q.includes("overwhelm") ||
        q.includes("scared") || q.includes("fear") || q.includes("depress") ||
        q.includes("worth") || q.includes("imposter") || q.includes("confidence") ||
        q.includes("worry") || q.includes("worried") || q.includes("give up") ||
        q.includes("hopeless") || q.includes("nervous")
    ) {
        return `### Empathetic Consultation for ${candidateName}
**I hear you, and your feelings are completely valid.** Navigating placement benchmarks, competitive technical expectations, and academic pressure can feel deeply overwhelming. Please remember: **your worth is never defined by a temporary benchmark or a single application result.**

Every top engineer and researcher has experienced self-doubt and setbacks. PortalAcademia is designed specifically as a growth launchpad, not an exclusionary gate.

#### Current Telemetry Grounding:
• **Verified Competencies**: ${studentSkills.length > 0 ? studentSkills.join(", ") : "Ready to be benchmarked"}
• **Assessment Track**: ${assessments.length} assessments completed so far
• **Active Application Pipeline**: ${applications.length} submitted

#### 3-Step Low-Friction Roadmap to Regain Momentum:
1. **Take One 10-Minute Diagnostic Benchmark**: Standardized assessments on your dashboard are diagnostic tools, not permanent records. Even a 60% score instantly validates your skills and boosts recruiter visibility.
2. **Focus on One High-Leverage Skill**: Instead of trying to master everything, pick **one** skill gap (e.g., Docker or API integration) and build a single micro-feature this week.
3. **Target Mentored Openings**: Apply to postings with structured mentorship programs where learning curves are welcomed.

*You have already taken the first step by being here. Which specific area feels most daunting right now? We can break it down together.*`;
    }

    // 2. Performance Concerns: Low Match Scores & Algorithmic Ranking
    if (
        q.includes("match score") || q.includes("low score") || q.includes("why is my score") ||
        q.includes("increase score") || q.includes("raise score") || q.includes("ranking") ||
        q.includes("shortlist") || q.includes("shortlisting") || (q.includes("score") && q.includes("low"))
    ) {
        const recommendedSkills = ["Docker", "Kubernetes", "FastAPI", "PostgreSQL", "Cloud Architecture"];
        const missing = recommendedSkills.filter((rs) => !studentSkills.some((s: string) => s.toLowerCase() === rs.toLowerCase()));

        return `### Demystifying Your Match Score & Recruiter Telemetry
It is completely understandable to be concerned when your match score looks low. Let's look behind the curtain so you know exactly how to turn this around.

Under **SIH Problem Statement 26044**, candidate match scores on PortalAcademia are calculated via a transparent two-factor formula:
**Match Score = (70% × Skill Tag Overlap) + (30% × Verified Assessment Badges)**

#### Why Your Score Might Currently Be Lower:
• **Unverified Self-Reported Skills**: Self-claimed skills receive partial weight until proven through benchmark assessments.
• **Assessment Multiplier**: If you haven't taken the Standardized Assessment, you automatically leave 30 percentage points off the table!
• **High-Impact Missing Tags**: Adding **${missing.slice(0, 2).join(" & ") || "Docker & PostgreSQL"}** will immediately bridge recruiter search filters.

#### Actionable Steps to Boost Your Score Today:
1. **Complete the Standardized Assessment**: Head to your dashboard's Skill Assessment section. Passing immediately attaches a cryptographically verified badge, jumping your score by up to 30%.
2. **Align Profile Tags**: Ensure your profile explicitly lists your relevant tech stack (${studentSkills.slice(0, 4).join(", ") || "e.g., React, Node.js"}).
3. **Request Institutional Verification**: Badges verified by your college placement cell achieve a **3.4x higher conversion** to interview rounds.`;
    }

    // 3. Setback Concerns: Assessment Failure & Retakes
    if (
        q.includes("fail") || q.includes("failed") || q.includes("retake") ||
        q.includes("failed assessment") || q.includes("retest") || q.includes("bad score")
    ) {
        return `### Diagnostic Assessment Recovery Protocol
**First and foremost: A failed assessment is diagnostic feedback, not a permanent disqualification.**

On PortalAcademia, assessments are engineered following SIH 26044 standards to reveal specific domain deficits rather than punish candidates. Recruiters cannot see your diagnostic trial history—they only see your highest verified badge.

#### Your Assessment Snapshot:
${assessments.length > 0
    ? assessments.map((a) => `• **${a.assessmentTitle}**: ${a.percentage}% (${a.passed ? "Passed" : "Diagnostic Complete"})`).join("\n")
    : "• No completed assessments recorded yet."}

#### Your Recovery Plan:
1. **Target the Core Deficit Areas**: Review the questions that challenged you. Most technical tests focus on async execution, data modeling, or error handling.
2. **Complete a Focused 48-Hour Sprint**: Spend two focused study blocks reviewing documentation and building a 20-line demonstration script.
3. **Re-attempt the Assessment**: There is no penalty for re-benchmarking. Once you cross the passing threshold (70%), your verified badge is automatically awarded and your match scores update across all active applications!`;
    }

    // 4. Administrative Concerns: Institutional Verification Delays & Placement Cell
    if (
        q.includes("verification") || q.includes("verify") || q.includes("college") ||
        q.includes("placement cell") || q.includes("pending") || q.includes("approval") ||
        q.includes("hod") || q.includes("unverified")
    ) {
        return `### Navigating Institutional Credential Verification
It can be frustrating when your portfolio credentials remain in **Pending Verification** status while you want to apply to opportunities.

#### How the Credential Gate Works (SIH 26044):
Your college placement officer or departmental coordinator reviews submitted certifications and project repositories via the **Institutional Verification Gate** using your AISHE code. Once approved, your profile receives the gold verified checkmark.

#### Concrete Actions to Expedite Verification:
1. **Verify Your Submission URLs**: Ensure your uploaded credential links (GitHub repositories, live deployments, certificate PDFs) are publicly accessible and not behind restricted logins.
2. **Contact Your Placement Cell**: Send a polite, structured note to your college's training & placement officer (TPO) or departmental coordinator with your PortalAcademia student ID and credential links.
3. **Apply While Pending**: You do not have to wait! You can still submit applications to live opportunities right now; your verified status will automatically synchronize as soon as your college approves it.`;
    }

    // 5. Workload Concerns: Balancing Coursework, Attendance & Internships
    if (
        q.includes("time") || q.includes("busy") || q.includes("balance") ||
        q.includes("attendance") || q.includes("semester") || q.includes("exam") ||
        q.includes("heavy") || q.includes("overload") || q.includes("schedule") || q.includes("hours")
    ) {
        return `### Balancing University Rigor with Career Milestones
Balancing mandatory 75% college attendance, mid-term examinations, laboratory records, and career preparation is one of the hardest parts of being a student. Your concern is shared by thousands of students.

#### Sustainable Strategy:
1. **Prioritize Remote & Hybrid Opportunities**: Filter the Opportunity Desk for remote or project-based internships with flexible hours that don't conflict with day classes.
2. **The 45-Minute Daily Habit**: Do not try to study 4 hours every night after exhausting lectures. Dedicate just 45 focused minutes each morning to one core technical concept or practice problem.
3. **Leverage Coursework as Portfolio Projects**: Use your semester lab submissions or final-year capstone project as verified portfolio submissions on PortalAcademia—turn academic requirements into career assets!`;
    }

    // 6. Career Direction & Tech Stack Dilemmas
    if (
        q.includes("which path") || q.includes("career") || q.includes("confused") ||
        q.includes("choose") || q.includes("frontend") || q.includes("backend") ||
        q.includes("full stack") || q.includes("machine learning") || q.includes("ai") || q.includes("switch")
    ) {
        return `### Career Trajectory & Domain Roadmap
When every technology seems important, feeling uncertain about which direction to pursue is a sign of ambition, not weakness.

#### Recommended Pathways Based on Market Telemetry:
• **Full Stack Web / Cloud Engineering**: Highest current listing volume on PortalAcademia. Core demand: React, Node.js/FastAPI, PostgreSQL, Docker.
• **AI / Data Science & ML**: High growth. Core demand: Python, PyTorch/TensorFlow, Data Pipelines, REST APIs.
• **Healthcare / Ayush Informatics**: Specific to SIH 26044 domain—interdisciplinary tech bridging electronic health records and clinical data telemetry.

#### Suggested Next Step:
Review the live postings below. Which role description excites you most when you read about daily responsibilities?
${topPostings}`;
    }

    // 7. Faculty Concerns: Corporate Sabbaticals, IP Rights & MHRD Credits
    if (
        userRole === "faculty" || q.includes("faculty") || q.includes("sabbatical") ||
        q.includes("immersion") || q.includes("drdo") || q.includes("grant") ||
        q.includes("ip") || q.includes("patent") || q.includes("cas") || q.includes("fdp")
    ) {
        return `### Faculty Industrial Immersion & Academic Consultancy Telemetry
As an academician navigating industry immersion, balancing departmental teaching loads with intellectual property boundaries is a critical consideration.

#### Policy Grounding under SIH 26044 & AICTE/MHRD:
1. **Career Advancement Scheme (CAS) Credits**: Corporate sabbaticals and industry consultancy projects completed through PortalAcademia qualify directly for MHRD/AICTE CAS API points.
2. **Intellectual Property & Co-Patenting**: PortalAcademia agreements utilize standard dual-ownership clauses—academic institutions retain research publication rights while corporate sponsors hold commercial licensing options.
3. **Curriculum Modernization**: Sabbatical findings can be directly converted into industry-aligned syllabus modules for your institution's board of studies.`;
    }

    // 8. General Skill Gaps & Opportunities (Default Fallback)
    const recommendedSkills = ["Docker", "Kubernetes", "FastAPI", "PostgreSQL", "Cloud Architecture"];
    const missing = recommendedSkills.filter((rs) => !studentSkills.some((s: string) => s.toLowerCase() === rs.toLowerCase()));

    return `### Contextual Career Telemetry for ${candidateName} (${userRole})
Affiliation: **${profile?.institution || profile?.institutionName || profile?.companyName || "Academic Network"}**
Verified Competencies: **${studentSkills.length > 0 ? studentSkills.join(", ") : "Ready to be benchmarked"}**

#### Key Recommendations for Your Profile:
1. **Skill Gap Optimization**: Industry listings on the portal heavily value: **${missing.slice(0, 3).join(", ")}**. Adding one of these to your stack will increase shortlist probability.
2. **Standardized Assessment**: Complete the pending benchmark test on your dashboard to convert self-reported claims into verified badges.
3. **Active Industry Opportunities**:
${topPostings || "Check the live Opportunity Desk for open postings."}

*Feel free to ask about specific concerns like match score calculation, interview prep, or balancing exams with internships.*`;
}

/**
 * @description Contextual AI Career Guide handling user queries with profile injection, deep concern empathy, and Mongo TTL logging
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
        const userName = profile?.name || "Candidate";
        const verifiedSkills = profile?.skills || [];
        const userInstitution = profile?.institution || profile?.institutionName || profile?.companyName || "Academic Network";
        const assessmentSummary = assessments.map((a) => `${a.assessmentTitle}: ${a.percentage}% (${a.passed ? "Passed" : "Diagnostic Completed"})`).join("; ");
        const appStatusSummary = applications.map((app) => `Match Score ${app.matchScore}%, Status: ${app.status}`).join("; ");
        const oppSummary = trendingOpportunities.map((o) => `${o.title} at ${o.organization} (${o.stipendOrPrize})`).join("; ");

        // Build empathetic, telemetry-grounded system prompt
        const systemPrompt = `You are the PortalAcademia Contextual AI Career & Academic Immersion Advisor for Smart India Hackathon 2026 (Problem Statement 26044, Ministry of Ayush).

YOUR MISSION & PERSONA:
You are not a cold, bureaucratic evaluation engine. You are an empathetic, highly perceptive, and domain-grounded mentor. You understand that career paths, placement benchmarks, university exams, imposter syndrome, and institutional delays cause intense personal stress, self-doubt, and anxiety for students and educators.

MANDATORY RESPONSE ARCHITECTURE:
1. IDENTIFY & VALIDATE THE USER'S CONCERN FIRST:
   - Actively detect the user's explicit question AND their underlying emotional or practical dilemma (e.g., anxiety over low match scores, fear of rejection or failing assessments, burnout from university attendance/workload, frustration over pending college approvals, or faculty IP anxiety during sabbaticals).
   - Start with genuine, reassuring, and validating empathy. Normalize their situation and establish psychological safety before diving into advice.

2. TELEMETRY-GROUNDED DIAGNOSIS:
   - Connect your advice directly to their live PortalAcademia telemetry:
     * User: ${userName} (Role: ${userRole})
     * Affiliation: ${userInstitution}
     * Verified Skills: ${verifiedSkills.join(", ") || "None verified yet"}
     * Standardized Assessment Record: ${assessmentSummary || "No benchmark tests taken yet"}
     * Application Funnel: ${applications.length} submitted (${appStatusSummary || "No active applications"})
     * Live Marketplace Postings: ${oppSummary || "Various postings available on Opportunity Desk"}
   - Transparently explain the logic: on PortalAcademia, Match Score = (70% Skill Tag Overlap + 30% Verified Assessment Badges). If an assessment hasn't been taken or skills are unverified, demystify why that impacts their score without judging their potential.

3. 3-STEP ACTIONABLE ROADMAP:
   - Provide 3 concrete, low-friction steps the user can execute on PortalAcademia TODAY to make measurable progress.

4. WARM CLOSING & FOLLOW-UP:
   - Close with supportive encouragement and 1-2 constructive follow-up prompts they can ask next.

FORMATTING RULES:
- Use clean Markdown with structured headers (###), bullet points, and bold keywords.
- Keep the tone encouraging, professional, and solutions-oriented.`;

        let assistantResponse = "";
        let modelUsed = "local-expert-rag";
        let tokensUsed = 120;

        let apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
        let apiBaseUrl = "https://api.openai.com/v1";

        // Candidate models on Groq: primary is 120B reasoning, fallback is compound-mini
        const groqCandidateModels = ["openai/gpt-oss-120b", "groq/compound-mini", "qwen/qwen3.8-27b"];

        if (apiKey && (apiKey.startsWith("gsk_") || process.env.GROQ_API_KEY)) {
            apiKey = process.env.GROQ_API_KEY || apiKey;
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
                            max_tokens: 1200,
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
                        console.warn(`Groq model ${candidateModel} returned HTTP ${response.status}. Trying next candidate...`);
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
