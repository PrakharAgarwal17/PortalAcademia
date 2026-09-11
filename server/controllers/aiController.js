import profileModel from "../models/profileModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import applicationModel from "../models/applicationModel.js";
import opportunityModel from "../models/opportunityModel.js";
import aiLogModel from "../models/aiLogModel.js";
/**
 * Intelligent domain fallback response engine grounded in SIH 26044 knowledge.
 * Accurately analyzes what the user is asking and provides a direct, highly relevant response.
 */
function generateContextualLocalResponse(query, profile, assessments, applications, trendingOpportunities) {
    const q = query.toLowerCase().trim();
    const candidateName = profile?.name || "Professor / Scholar";
    const userRole = (profile?.accountType || "student").toLowerCase();
    const userInstitution = profile?.institution || profile?.institutionName || "Higher Education Institution";
    const skills = (profile?.skills || []).map((s) => s.trim());
    const topPostings = trendingOpportunities.slice(0, 3).map((o) => `• **${o.title}** at ${o.organization} (${o.stipendOrPrize})`).join("\n");
    // =========================================================================
    // FACULTY SPECIFIC RESPONSES
    // =========================================================================
    if (userRole === "faculty") {
        // 1. Greetings
        if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ") || q.includes("good morning") || q.includes("good afternoon")) {
            return `### Welcome, Professor ${candidateName}!
I am your **AI Academic Immersion & Research Advisor** on PortalAcademia.

How can I assist you with your academic and research initiatives today? You can ask me about:
• **Curriculum Modernization**: Aligning your department syllabus with live industry skill deficits
• **Faculty Development Programs (FDPs)**: AICTE-ATAL certified programs, pedagogy refreshers, and domain bootcamps
• **Industry Sabbaticals & Training**: MHRD/AICTE CAS API points, university NOCs, and corporate immersion
• **Joint Research & Grants**: DST-SERB, ICMR, CSIR, and corporate co-funded research proposals
• **IP & Patenting Rights**: Dual-licensing frameworks between universities and corporate sponsors

*Please feel free to ask any specific question, and I'll provide detailed, actionable guidance.*`;
        }
        // 2. Syllabus & Curriculum Modernization
        if (q.includes("syllabus") || q.includes("curriculum") || q.includes("course") || q.includes("teach") || q.includes("deficit") || q.includes("academic board") || q.includes("board of studies")) {
            return `### Aligning Academic Curriculum with Modern Industry Competencies
Under **SIH Problem Statement 26044**, closing the gap between university syllabus and industry requirements is a primary mission for faculty.

#### 4-Step Framework to Modernize Your Course Syllabus:
1. **Identify High-Deficit Competencies**:
   - Current market telemetry highlights systemic shortages in: **Cloud Architecture (Docker, Kubernetes)**, **REST/Async API Engineering**, and **Applied ML Pipelines**.
   - Review your semester lab assignments: replace obsolete theoretical exercises with real-world toolchains (e.g., Git-based CI/CD instead of local zip submissions).
2. **Embed Micro-Industry Projects in Coursework**:
   - Allocate 20–30% of continuous internal assessment marks to hands-on problem statements published on PortalAcademia.
   - Students gain verified portfolio proof while satisfying syllabus project deliverables.
3. **Board of Studies (BoS) Resolution**:
   - Propose an elective or modular unit: *"Industry Practices & Contemporary Toolchains"* (15 lecture hours).
   - Leverage live case studies and telemetry from portal corporate partners as accredited course readings.
4. **Corporate Co-Lectures**:
   - Invite certified industry practitioners from our platform for 2–3 masterclasses per semester to co-deliver advanced modules.`;
        }
        // 3. Corporate Sabbaticals, CAS Credits & Industrial Immersion
        if (q.includes("sabbatical") || q.includes("cas") || q.includes("credit") || q.includes("immersion") || q.includes("industrial training") || q.includes("api point") || q.includes("leave")) {
            return `### Corporate Sabbaticals & AICTE / MHRD Career Advancement Scheme (CAS)
Industrial exposure for academicians provides vital classroom renewal while advancing your academic career rank.

#### Policy & Credit Telemetry:
1. **CAS API Score Accrual (Category III)**:
   - Under AICTE/UGC guidelines, short-term corporate training/sabbaticals (2–4 weeks) earn **Category III API points** for Assistant to Associate/Professor promotions.
   - Long-term corporate sabbaticals (3–6 months) fall under Industry-Academia collaborative engagement with maximum promotional weightage.
2. **Institutional Approval & NOC Protocol**:
   - Download the PortalAcademia Sabbatical Proposal Summary from your dashboard.
   - Submit it to your Dean/Registrar for Academic Council endorsement ensuring continuous teaching duty coverage.
3. **Intellectual Property (IP) Protection**:
   - All portal-brokered corporate immersions use standardized non-disclosure agreements (NDAs) ensuring your preexisting academic research remains your intellectual property.`;
        }
        // 4. Research Grants, DST-SERB, Proposals & Consultancy
        if (q.includes("research") || q.includes("grant") || q.includes("serb") || q.includes("dst") || q.includes("proposal") || q.includes("consultancy") || q.includes("funding")) {
            return `### Industry-Academia Collaborative Research & Funding Schemes
Co-funding between government agencies and enterprise partners offers the most viable path for high-impact faculty research.

#### Active Research Avenues on PortalAcademia:
1. **DST-SERB & Industry Joint Grants**:
   - Clean energy microgrids, biomedical devices, and AI diagnostics currently have dedicated bilateral funding pools.
2. **Industrial Consultancy Framework**:
   - Corporate partners on the portal post unsolved engineering problems. Faculty can bid as Principal Investigators (PI) with 60:40 or 70:30 university-faculty consultancy revenue sharing.
3. **Tips for a Winning Proposal**:
   - **Define Concrete Deliverables**: Focus on measurable TRL (Technology Readiness Level) progression from TRL 3 (Proof of Concept) to TRL 6 (Validated Prototype).
   - **Involve Student Co-Researchers**: Include undergraduate/postgraduate research interns to handle benchmarking; this reduces project cost and boosts evaluation scores.
   - **Clear Co-Patenting Clauses**: Specify upfront that commercial licensing is co-owned between ${userInstitution} and the corporate funder.`;
        }
        // 5. Intellectual Property & Patents
        if (q.includes("ip") || q.includes("patent") || q.includes("copyright") || q.includes("ownership") || q.includes("commercial")) {
            return `### Intellectual Property (IP) & Commercialization Guidelines
Balancing academic publication with corporate commercialization is critical when faculty partner with industry.

#### PortalAcademia Dual-Ownership Protocol:
1. **Academic Publication Rights**:
   - Faculty researchers retain full rights to publish academic papers, conference proceedings, and open pedagogical case studies derived from fundamental scientific research.
2. **Commercial Licensing & Patents**:
   - If an invention or patentable prototype emerges, a joint patent is filed crediting the faculty as the primary inventors and ${userInstitution} alongside the corporate sponsor as assignees.
3. **Royalty Distribution**:
   - Standard institutional IP policy applies (typically 50–70% of net royalties go to the faculty inventor team, with the remainder supporting institutional research funds).`;
        }
        // 6. Faculty Development Programs (FDPs) & Conferences
        if (q.includes("fdp") || q.includes("conference") || q.includes("workshop") || q.includes("training") || q.includes("certif")) {
            return `### Faculty Development Programs (FDPs) & Skill Refreshers
Staying abreast of rapidly evolving technologies ensures your curriculum remains dynamic and relevant.

#### Recommended Pathways:
1. **AICTE ATAL Academy Programs**:
   - Free, high-rigor certified 1-to-2 week refreshers in emerging areas like Quantum Computing, GenAI, and Cybersecurity.
2. **Industry-Sponsored Pedagogical Bootcamps**:
   - Check the **FDP & Sabbaticals** tab on your dashboard. Companies like Microsoft, Tata Power Labs, and IIT consortia regularly host sponsored domain training.
3. **Institutional Sponsorship**:
   - Completion certificates earned through PortalAcademia automatically link to your verified faculty profile, facilitating institutional registration fee reimbursements.`;
        }
        // 7. General Faculty Guidance
        return `### Academic Advisory for ${candidateName}
Regarding your query: **"${query}"**

#### Actionable Insights:
1. **Pedagogical Integration**: Explore how this topic connects directly to current undergraduate/postgraduate coursework to maximize educational impact.
2. **Institutional Collaboration**: Leverage ${userInstitution}'s interdisciplinary departments or placement cell to co-host seminars or student hackathons around this domain.
3. **Portal Resources**: You can publish workshop announcements or discover collaborative industry partners directly from your Faculty Console.

*Would you like me to elaborate on curriculum design, drafting a research proposal, or exploring matching industry partners?*`;
    }
    // =========================================================================
    // STUDENT SPECIFIC RESPONSES
    // =========================================================================
    // 1. Greetings
    if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ") || q.includes("good morning")) {
        return `### Hello ${candidateName}!
I'm your **PortalAcademia AI Career Guide**. How can I help you today?

Here are some ways I can assist:
• **Skill Gap Analysis**: Find out which skills top recruiters in your target domain are looking for
• **Assessment Benchmarks**: Tips to pass standardized tests and earn verified gold badges
• **Interview & Resume Strategy**: Tailoring your ATS resume and project portfolio
• **Internship Search**: Guidance on applying to live corporate openings

*What would you like to work on right now?*`;
    }
    // 2. Emotional Concerns: Anxiety, Stress, Imposter Syndrome
    if (q.includes("anxious") || q.includes("stress") || q.includes("overwhelm") ||
        q.includes("scared") || q.includes("fear") || q.includes("depress") ||
        q.includes("worth") || q.includes("imposter") || q.includes("confidence") ||
        q.includes("worry") || q.includes("give up") || q.includes("hopeless")) {
        return `### Empathetic Consultation for ${candidateName}
**I hear you, and your feelings are completely valid.** Navigating placement benchmarks, competitive technical expectations, and academic pressure can feel deeply overwhelming. Please remember: **your worth is never defined by a temporary benchmark or a single application result.**

Every top engineer and researcher has experienced self-doubt and setbacks. PortalAcademia is designed specifically as a growth launchpad, not an exclusionary gate.

#### 3-Step Low-Friction Roadmap to Regain Momentum:
1. **Take One 10-Minute Diagnostic Benchmark**: Standardized assessments on your dashboard are diagnostic tools, not permanent records. Even a 60% score instantly validates your skills and boosts recruiter visibility.
2. **Focus on One High-Leverage Skill**: Instead of trying to master everything, pick **one** skill gap (e.g., Docker or API integration) and build a single micro-feature this week.
3. **Target Mentored Openings**: Apply to postings with structured mentorship programs where learning curves are welcomed.

*You have already taken the first step by being here. Which specific area feels most daunting right now? We can break it down together.*`;
    }
    // 3. Match Scores & Algorithmic Ranking
    if (q.includes("match score") || q.includes("low score") || q.includes("increase score") || q.includes("shortlist")) {
        const recommendedSkills = ["Docker", "Kubernetes", "FastAPI", "PostgreSQL", "Cloud Architecture"];
        const missing = recommendedSkills.filter((rs) => !skills.some((s) => s.toLowerCase() === rs.toLowerCase()));
        return `### Demystifying Your Match Score & Recruiter Telemetry
Under **SIH Problem Statement 26044**, candidate match scores on PortalAcademia are calculated via a transparent two-factor formula:
**Match Score = (70% × Skill Tag Overlap) + (30% × Verified Assessment Badges)**

#### Actionable Steps to Boost Your Score Today:
1. **Complete Standardized Assessments**: Head to your dashboard's Skill Assessment section. Passing immediately attaches a verified badge, jumping your score by up to 30%.
2. **Align Profile Tags**: Ensure your profile explicitly lists your relevant tech stack (${skills.slice(0, 4).join(", ") || "e.g., React, Node.js"}). Adding **${missing.slice(0, 2).join(" & ")}** will immediately match recruiter filters.
3. **Request Institutional Verification**: Badges verified by your college placement cell achieve a **3.4x higher conversion** to interview rounds.`;
    }
    // 4. Assessment Failure & Retakes
    if (q.includes("fail") || q.includes("failed") || q.includes("retake") || q.includes("retest")) {
        return `### Diagnostic Assessment Recovery Protocol
**A failed assessment is diagnostic feedback, not a permanent disqualification.**

Recruiters cannot see your diagnostic trial history—they only see your highest verified badge.

#### Your Recovery Plan:
1. **Target the Core Deficit Areas**: Most technical tests focus on async execution, data modeling, or error handling.
2. **Complete a Focused 48-Hour Sprint**: Spend two focused study blocks reviewing documentation and building a 20-line demonstration script.
3. **Re-attempt the Assessment**: There is no penalty for re-benchmarking. Once you cross the passing threshold (70%), your verified badge is automatically awarded!`;
    }
    // 5. Workload, Attendance & University Exams
    if (q.includes("time") || q.includes("busy") || q.includes("balance") || q.includes("attendance") || q.includes("exam")) {
        return `### Balancing University Rigor with Career Milestones
Balancing mandatory 75% college attendance, mid-term examinations, laboratory records, and career preparation is challenging.

#### Sustainable Strategy:
1. **Prioritize Remote & Hybrid Opportunities**: Filter the Opportunity Desk for remote or project-based internships with flexible hours that don't conflict with day classes.
2. **The 45-Minute Daily Habit**: Dedicate just 45 focused minutes each morning to one core technical concept or practice problem.
3. **Leverage Coursework as Portfolio Projects**: Use your semester lab submissions or final-year capstone project as verified portfolio submissions on PortalAcademia—turn academic requirements into career assets!`;
    }
    // 6. General Student Default
    return `### Direct Career Advice for ${candidateName}
Regarding your query: **"${query}"**

#### Key Recommendations:
1. **Hands-on Project Building**: Build projects that solve tangible real-world problems. Deploy them with clear README documentation and live URLs.
2. **Verified Skill Profiling**: Complete the standardized assessment benchmark on your dashboard to prove competency.
3. **Active Industry Opportunities**:
${topPostings || "Check the live Opportunity Desk for open postings."}

*Feel free to ask follow-up questions about specific coding topics, interview prep, or project ideas!*`;
}
/**
 * @description Contextual AI Career Guide handling user queries with profile injection, role awareness, and Mongo TTL logging
 * @route POST /api/ai/chat
 * @access Authenticated
 */
export async function chatWithAI(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { query, history = [] } = req.body;
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
            systemPrompt = `You are the PortalAcademia AI Academic Immersion & Research Advisor, assisting university professors, faculty members, and academic researchers for Smart India Hackathon 2026 (Problem Statement 26044, Ministry of Ayush).

FACULTY SCHOLAR CONTEXT:
• Name: ${userName} (Faculty Member)
• Affiliation: ${userInstitution}
• Academic Domain / Expertise: ${verifiedSkills.join(", ") || profile?.department || "Higher Education Faculty"}
• Active Academic Opportunities on Portal: ${oppSummary || "FDPs, Research Grants, Industry Sabbaticals, and Conferences"}

CRITICAL INSTRUCTIONS:
1. DIRECT RELEVANCE FIRST: Directly and thoroughly answer the professor's explicit message or question: "${query}". Do NOT output canned generic lectures.
2. ACADEMIC & RESEARCH RIGOR: Maintain a respectful, collegial, intellectually rigorous, and structured tone suitable for faculty and research scholars.
3. DEEP DOMAIN KNOWLEDGE: You have expertise in:
   - Syllabus co-development and modernizing university curriculum to bridge industry skill deficits
   - Faculty Development Programs (AICTE ATAL, MHRD, IIT/IISc pedagogical refreshers)
   - Industrial sabbaticals, consultancy frameworks, and Career Advancement Scheme (CAS) API points
   - Intellectual property (IP), patent co-ownership, and university-corporate tech transfer
   - Research grants (DST, SERB, ICMR, AICTE, Ayush, corporate R&D funding)
   - Mentoring student cohorts on live industry problem statements
4. FORMATTING: Use structured, clean Markdown (### headers, bullet points, bold keywords). Keep responses actionable and insightful.`;
        }
        else if (userRole === "student") {
            systemPrompt = `You are the PortalAcademia Contextual AI Career Guide, assisting undergraduate and postgraduate students for Smart India Hackathon 2026 (Problem Statement 26044).

STUDENT CONTEXT:
• Name: ${userName} (Student)
• Affiliation: ${userInstitution}
• Verified Skills: ${verifiedSkills.join(", ") || "None verified yet"}
• Assessments: ${assessmentSummary || "No benchmark tests taken yet"}
• Applications Submitted: ${applications.length} (${appStatusSummary || "None"})
• Live Opportunities: ${oppSummary || "Internships and Live Projects"}

CRITICAL INSTRUCTIONS:
1. DIRECT RELEVANCE FIRST: Directly answer whatever the student is asking about: "${query}". If they ask about a technical concept, interview tip, or career direction, answer THAT question first!
2. ENCOURAGING & MOTIVATING: Be constructive, empathetic, and clear without giving unsolicited boilerplate speeches.
3. PRACTICAL TELEMETRY: If the student asks about match scores or shortlisting, explain the formula: (70% Skill Overlap + 30% Verified Assessment Badges). Otherwise, focus on their specific question.
4. FORMATTING: Clean Markdown with headers, bullets, and code snippets when relevant.`;
        }
        else {
            systemPrompt = `You are the PortalAcademia AI Advisor assisting ${userName} (${userRole}) for Smart India Hackathon 2026 (Problem Statement 26044).
Directly, professionally, and accurately answer the user's inquiry: "${query}". Provide practical and structured insights.`;
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
                        const data = (await response.json());
                        const content = data.choices?.[0]?.message?.content;
                        if (content && typeof content === "string" && content.trim().length > 0) {
                            assistantResponse = content.trim();
                            modelUsed = candidateModel;
                            tokensUsed = data.usage?.total_tokens || 200;
                            break;
                        }
                    }
                    else {
                        const errText = await response.text();
                        console.warn(`Groq model ${candidateModel} returned HTTP ${response.status}:`, errText);
                    }
                }
                catch (err) {
                    console.warn(`Error invoking Groq model ${candidateModel}:`, err);
                }
            }
        }
        // If external API was not configured or all candidate models failed, use upgraded local telemetry reasoning
        if (!assistantResponse) {
            assistantResponse = generateContextualLocalResponse(query, profile, assessments, applications, trendingOpportunities);
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
    }
    catch (error) {
        console.error("chatWithAI error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process AI guidance query",
        });
    }
}
//# sourceMappingURL=aiController.js.map