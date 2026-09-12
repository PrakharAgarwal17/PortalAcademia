import type { Request, Response } from "express";
import assessmentModel, { type IAssessmentQuestion } from "../models/assessmentModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import profileModel from "../models/profileModel.js";

/**
 * @description List all standardized skill assessments
 * @route GET /api/assessments
 * @access Public / Authenticated
 */
export async function getAssessments(req: Request, res: Response) {
    try {
        const { category, skill } = req.query;
        const query: any = {};

        if (category) {
            query.category = category;
        }
        if (skill) {
            query.skillVectors = { $regex: String(skill), $options: "i" };
        }

        // Fetch assessments, explicitly projecting out correct answers to prevent client cheating
        const assessments = await assessmentModel
            .find(query)
            .select("-questions.correctOptionIndex -questions.explanation")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: assessments.length,
            data: assessments,
        });
    } catch (error) {
        console.error("getAssessments error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assessments",
        });
    }
}

/**
 * @description Get a specific assessment for examination
 * @route GET /api/assessments/:id
 * @access Authenticated
 */
export async function getAssessmentById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const assessment = await assessmentModel
            .findById(id)
            .select("-questions.correctOptionIndex -questions.explanation");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: assessment,
        });
    } catch (error) {
        console.error("getAssessmentById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assessment details",
        });
    }
}

/**
 * @description Submit assessment answers, compute objective score, and award verified badge/skills
 * @route POST /api/assessments/:id/submit
 * @access Authenticated (Student)
 */
export async function submitAssessment(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
        }

        const { id } = req.params;
        const { answers } = req.body as {
            answers: Array<{
                questionId: string;
                selectedOptionIndex?: number;
                writtenAnswer?: string;
                timeTakenSeconds?: number;
            }>;
        };

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission payload: answers array required",
            });
        }

        const assessment = await assessmentModel.findById(id);
        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found",
            });
        }

        let correctCount = 0;
        let aiFlaggedCount = 0;
        const totalQuestions = assessment.questions.length;
        const evaluatedAnswers: Array<{
            questionId: string;
            selectedOptionIndex: number;
            writtenAnswer?: string;
            timeTakenSeconds?: number;
            isFlaggedAI: boolean;
            isCorrect: boolean;
            explanation: string;
        }> = [];

        // Grade each response against master key
        for (const q of assessment.questions) {
            const studentAns = answers.find((a) => a.questionId === q.questionId);
            const selected = studentAns?.selectedOptionIndex !== undefined ? studentAns.selectedOptionIndex : -1;
            const written = studentAns?.writtenAnswer ? studentAns.writtenAnswer.trim() : "";
            const timeTaken = studentAns?.timeTakenSeconds || 0;

            let isCorrect = false;
            let isFlaggedAI = false;

            if (q.type === "writing" || q.difficultyLevel === "writing") {
                // Writing question grading: check length and response speed
                isCorrect = written.length >= 20;
                // If confirmed in under 10 seconds for a non-trivial writing response, mark as AI generated
                if (written.length >= 15 && timeTaken > 0 && timeTaken < 10) {
                    isFlaggedAI = true;
                    aiFlaggedCount += 1;
                }
            } else {
                // MCQ grading
                isCorrect = selected === q.correctOptionIndex;
            }

            if (isCorrect) {
                correctCount += 1;
            }

            evaluatedAnswers.push({
                questionId: q.questionId,
                selectedOptionIndex: selected,
                writtenAnswer: written,
                timeTakenSeconds: timeTaken,
                isFlaggedAI,
                isCorrect,
                explanation: q.explanation || "",
            });
        }

        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = percentage >= assessment.passPercentage;
        const badgeAwarded = passed ? assessment.badgeAwarded : "";
        let verifiedSkillsAdded: string[] = [];

        // If passed, inject verified skill vectors into the user's live profile
        if (passed) {
            const profile = await profileModel.findOne({ userId: req.userId });
            if (profile) {
                const currentSkills = new Set(profile.skills || []);
                assessment.skillVectors.forEach((skill) => currentSkills.add(skill));
                profile.skills = Array.from(currentSkills);

                // For faculty profiles, also add to expertise
                if (profile.accountType === "faculty") {
                    const currentExpertise = new Set(profile.expertise || []);
                    assessment.skillVectors.forEach((skill) => currentExpertise.add(skill));
                    profile.expertise = Array.from(currentExpertise);
                }

                await profile.save();
                verifiedSkillsAdded = assessment.skillVectors;
            }
        }

        // Record persistent assessment result
        const result = await assessmentResultModel.create({
            studentId: req.userId,
            assessmentId: assessment._id,
            assessmentTitle: assessment.title,
            score: correctCount,
            totalQuestions,
            percentage,
            passed,
            badgeAwarded: badgeAwarded || "",
            verifiedSkillsAdded,
            answers: evaluatedAnswers.map((ea) => ({
                questionId: ea.questionId,
                selectedOptionIndex: ea.selectedOptionIndex,
                writtenAnswer: ea.writtenAnswer || "",
                timeTakenSeconds: ea.timeTakenSeconds || 0,
                isFlaggedAI: ea.isFlaggedAI,
                isCorrect: ea.isCorrect,
            })),
            completedAt: new Date(),
        });

        return res.status(200).json({
            success: true,
            data: {
                resultId: (result as any)._id,
                score: correctCount,
                totalQuestions,
                percentage,
                passed,
                badgeAwarded,
                verifiedSkillsAdded,
                passPercentage: assessment.passPercentage,
                aiFlaggedCount,
                answers: evaluatedAnswers,
            },
        });
    } catch (error) {
        console.error("submitAssessment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to grade assessment submission",
        });
    }
}

/**
 * @description Get all past assessment results for the logged-in student
 * @route GET /api/assessments/my-results
 * @access Authenticated (Student)
 */
export async function getMyResults(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const results = await assessmentResultModel
            .find({ studentId: req.userId })
            .sort({ completedAt: -1 });

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error("getMyResults error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assessment history",
        });
    }
}

/**
 * Builds standard deterministic 10-question evaluation fallback questions
 */
function buildDeterministicFallbackQuestions(mainSkill: string): IAssessmentQuestion[] {
    return [
        // 3 Easy MCQs
        {
            questionId: "q1_easy",
            questionText: `What is the primary architectural purpose of using ${mainSkill} in modern application development?`,
            type: "mcq",
            difficultyLevel: "easy",
            concept: "Core Architecture & Role",
            options: [
                `To provide modular execution, scalable application logic, and structured state management using ${mainSkill}.`,
                "To bypass network encryption and write directly to low-level hardware BIOS memory.",
                "To format plain text documents without executing any application code.",
                "To replace database storage engines with local browser cookies.",
            ],
            correctOptionIndex: 0,
            explanation: `${mainSkill} provides structured application execution and modular logic management.`,
            weight: 1,
        },
        {
            questionId: "q2_easy",
            questionText: `When managing state and data flow in ${mainSkill}, which practice ensures maintainability and prevents unexpected side-effects?`,
            type: "mcq",
            difficultyLevel: "easy",
            concept: "State Management & Data Flow",
            options: [
                "Mutating unhandled global objects across random independent functions.",
                "Enforcing predictable unidirectional data flow and isolating state mutations.",
                "Disabling all variable type checks and linting rules during production builds.",
                "Storing plain-text auth tokens in unencrypted local file caches.",
            ],
            correctOptionIndex: 1,
            explanation: "Unidirectional data flow and explicit state boundaries prevent unexpected side-effects.",
            weight: 1,
        },
        {
            questionId: "q3_easy",
            questionText: `In ${mainSkill}, what is the main advantage of non-blocking asynchronous operation handling?`,
            type: "mcq",
            difficultyLevel: "easy",
            concept: "Asynchronous IO & Concurrency",
            options: [
                "It halts main execution until network payloads complete.",
                "It allows the runtime event loop to handle concurrent requests while awaiting IO operations.",
                "It converts HTTP calls directly into binary machine instructions.",
                "It locks CPU threads to force single-threaded execution.",
            ],
            correctOptionIndex: 1,
            explanation: "Asynchronous non-blocking operations keep the runtime responsive under concurrent IO workloads.",
            weight: 1,
        },
        // 3 Medium Concept MCQs
        {
            questionId: "q4_med",
            questionText: `How does memoization or intelligent response caching improve application throughput in ${mainSkill}?`,
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Algorithmic Efficiency & Caching",
            options: [
                "By storing expensive computation or query results and reusing them for identical input parameters.",
                "By clearing active system memory immediately after every function call.",
                "By spawning duplicate background network requests every second.",
                "By forcing database re-indexing on every user interaction.",
            ],
            correctOptionIndex: 0,
            explanation: "Caching/Memoization stores computed results to eliminate redundant processing overhead.",
            weight: 2,
        },
        {
            questionId: "q5_med",
            questionText: `How should concurrent data access and state synchronization be handled in high-traffic ${mainSkill} deployments?`,
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Concurrency Control & State Consistency",
            options: [
                "Allow uncoordinated write operations without transaction boundaries.",
                "Utilize atomic database operations, optimistic locking, or mutexes to prevent race conditions.",
                "Rely on client-side setTimeouts to synchronize server records.",
                "Store transactional state exclusively in volatile browser storage.",
            ],
            correctOptionIndex: 1,
            explanation: "Atomic operations and optimistic locking ensure state integrity under concurrent access.",
            weight: 2,
        },
        {
            questionId: "q6_med",
            questionText: `Which architectural pattern effectively decouples core business logic from third-party infrastructure in ${mainSkill}?`,
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Clean Architecture & Decoupling",
            options: [
                "Writing raw database connection strings inside client view components.",
                "Layered / Hexagonal Architecture separating domain logic, use cases, and interface adapters.",
                "Using global static singletons for all state without abstraction layers.",
                "Hardcoding third-party API secrets inside client bundle assets.",
            ],
            correctOptionIndex: 1,
            explanation: "Hexagonal/Clean Architecture decouples core application domain logic from external adapters.",
            weight: 2,
        },
        // 4 Real-Life Stack Writing Questions (Timed: 3 Min Each)
        {
            questionId: "q7_write",
            questionText: `Production Latency & Memory Leak Debugging: A high-traffic ${mainSkill} service is experiencing sudden latency spikes and memory growth under peak traffic. Walk through your step-by-step diagnostic process, tools you would use (profilers, logs, heap dumps), and how you would isolate and resolve the bottleneck.`,
            type: "writing",
            difficultyLevel: "writing",
            concept: "Real-World Profiling & Performance Debugging",
            options: ["Descriptive Real-World Scenario Answer Required"],
            correctOptionIndex: 0,
            explanation: "Requires detailing empirical profiling, heap dump inspection, isolation of memory leaks/CPU bottlenecks, and post-fix validation.",
            weight: 3,
        },
        {
            questionId: "q8_write",
            questionText: `Concurrency & Race Condition Handling: In a high-concurrency application built with ${mainSkill}, two simultaneous requests race to update the same user account state, leading to data corruption or double-processing. Describe how you would redesign the data flow, locking strategy, or transaction boundaries to guarantee consistency.`,
            type: "writing",
            difficultyLevel: "writing",
            concept: "Real-World Concurrency & State Integrity",
            options: ["Descriptive Real-World Scenario Answer Required"],
            correctOptionIndex: 0,
            explanation: "Requires detailing atomic transaction isolation, optimistic locking/versioning, or queue-based sequencing.",
            weight: 3,
        },
        {
            questionId: "q9_write",
            questionText: `Third-Party Dependency Failure & Fault Tolerance: An external microservice or third-party API that your ${mainSkill} application relies on starts timing out intermittently during peak hours. How would you design circuit breakers, exponential backoff retries, and fallback caching to keep your system resilient?`,
            type: "writing",
            difficultyLevel: "writing",
            concept: "Real-World Fault Tolerance & API Resilience",
            options: ["Descriptive Real-World Scenario Answer Required"],
            correctOptionIndex: 0,
            explanation: "Requires detailing circuit breaker states (Closed/Open/Half-Open), exponential backoff jitter, fallback responses, and telemetry alerting.",
            weight: 3,
        },
        {
            questionId: "q10_write",
            questionText: `Security Audit & Hardening: During a security code review of a ${mainSkill} module, you notice potential vulnerabilities related to authentication token handling and input validation. Detail your approach to refactoring token management (httpOnly cookies, CSRF protection) and sanitizing input to harden the system against exploits.`,
            type: "writing",
            difficultyLevel: "writing",
            concept: "Real-World System Security & Hardening",
            options: ["Descriptive Real-World Scenario Answer Required"],
            correctOptionIndex: 0,
            explanation: "Requires detailing secure cookie flags, input validation schemas, auth token refresh rotation, and RBAC middleware enforcement.",
            weight: 3,
        },
    ];
}

/**
 * Generates an on-the-spot 10-question evaluation using Groq LLM
 */
async function generateAiQuestions(
    mainSkill: string,
    userRole: string,
    userSkills: string[]
): Promise<{
    title?: string;
    description?: string;
    badgeAwarded?: string;
    questions: IAssessmentQuestion[];
} | null> {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    if (!apiKey) {
        return null;
    }

    const groqCandidateModels = [
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "groq/compound-mini",
        "groq/compound",
        "openai/gpt-oss-20b",
    ];

    const systemPrompt = `You are an expert technical examiner creating a standardized, rigorous, 10-question skill verification exam for "${mainSkill}".
Candidate role: ${userRole}. Background skills/expertise: ${userSkills.slice(0, 8).join(", ") || "General Engineering"}.

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "${mainSkill} Competency Assessment",
  "description": "Comprehensive evaluation covering core mechanics, architecture tradeoffs, and real-world scenarios in ${mainSkill}.",
  "category": "Technical",
  "difficulty": "Intermediate",
  "badgeAwarded": "Verified ${mainSkill} Specialist",
  "questions": [
    {
      "questionId": "q1_easy",
      "questionText": "Question text...",
      "type": "mcq",
      "difficultyLevel": "easy",
      "concept": "Core Architecture",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Why this option is correct...",
      "weight": 1
    }
  ]
}

Strict requirements:
- Exactly 10 questions total.
- Questions 1-3: Easy MCQs (fundamental syntax, mechanics, or core concept recall, 4 distinct options, correctOptionIndex 0-3, weight 1, questionId: "q1_easy", "q2_easy", "q3_easy").
- Questions 4-6: Medium MCQs (architecture, scalability, concurrency, edge-case debugging, 4 distinct options, correctOptionIndex 0-3, weight 2, questionId: "q4_med", "q5_med", "q6_med").
- Questions 7-10: Timed Practical Scenario Writing Questions (real-world production outages, race conditions, dependency failover, system security & hardening, type: "writing", difficultyLevel: "writing", concept: "Production Scenario", options: ["Descriptive Real-World Scenario Answer Required"], correctOptionIndex: 0, explanation: "Rubric evaluation criteria...", weight: 3, questionId: "q7_write", "q8_write", "q9_write", "q10_write").
- Ensure all questions and options are deeply technical and specific to "${mainSkill}". Output pure JSON only.`;

    for (const candidateModel of groqCandidateModels) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: candidateModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Generate the 10-question assessment for ${mainSkill}` },
                    ],
                    temperature: 0.3,
                    max_tokens: 3200,
                    response_format: { type: "json_object" },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = (await response.json()) as any;
                const content = data.choices?.[0]?.message?.content;
                if (content && typeof content === "string") {
                    let cleaned = content.trim();
                    if (cleaned.startsWith("```")) {
                        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
                    }
                    const firstBrace = cleaned.indexOf("{");
                    const lastBrace = cleaned.lastIndexOf("}");
                    if (firstBrace !== -1 && lastBrace > firstBrace) {
                        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                    }
                    const parsed = JSON.parse(cleaned);
                    if (Array.isArray(parsed.questions) && parsed.questions.length >= 8) {
                        const sanitizedQuestions: IAssessmentQuestion[] = parsed.questions.slice(0, 10).map((q: any, idx: number) => {
                            const isWriting = idx >= 6 || q.type === "writing" || q.difficultyLevel === "writing";
                            const questionId = isWriting ? `q${idx + 1}_write` : (idx < 3 ? `q${idx + 1}_easy` : `q${idx + 1}_med`);
                            const options = isWriting
                                ? ["Descriptive Real-World Scenario Answer Required"]
                                : Array.isArray(q.options) && q.options.length >= 2
                                ? q.options.map(String)
                                : ["Option A", "Option B", "Option C", "Option D"];
                            const rawIdx = typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0;
                            const correctOptionIndex = isWriting ? 0 : Math.max(0, Math.min(rawIdx, options.length - 1));

                            return {
                                questionId: q.questionId || questionId,
                                questionText: String(q.questionText || `Evaluation scenario on ${mainSkill} (Item ${idx + 1})`),
                                type: isWriting ? ("writing" as const) : ("mcq" as const),
                                difficultyLevel: isWriting ? ("writing" as const) : (idx < 3 ? ("easy" as const) : ("medium" as const)),
                                concept: String(q.concept || (isWriting ? "Production Implementation" : "Technical Core")),
                                options,
                                correctOptionIndex,
                                explanation: String(q.explanation || `Core principles of ${mainSkill}.`),
                                weight: isWriting ? 3 : (idx < 3 ? 1 : 2),
                            };
                        });

                        return {
                            title: parsed.title || `${mainSkill} Competency Exam`,
                            description: parsed.description || `Dedicated 10-question evaluation covering 3 Easy MCQs, 3 Medium Concept MCQs, and 4 Real-Life Stack Scenario Writing Questions on ${mainSkill}.`,
                            badgeAwarded: parsed.badgeAwarded || `Verified ${mainSkill} Specialist`,
                            questions: sanitizedQuestions,
                        };
                    }
                }
            }
        } catch (err) {
            console.warn(`Groq candidate ${candidateModel} failed, trying fallback:`, err);
        }
    }
    return null;
}

/**
 * @description Dynamically generate a 10-question assessment tailored to selected skills on the spot using AI
 * @route POST /api/assessments/generate
 * @access Authenticated
 */
export async function generateSkillAssessment(req: Request, res: Response) {
    try {
        const { selectedSkills, targetSkill: explicitTarget, skill } = req.body as {
            selectedSkills?: string[];
            targetSkill?: string;
            skill?: string;
        };

        // Determine primary target skill/technology for this dedicated test
        const rawSkill =
            explicitTarget ||
            skill ||
            (selectedSkills && selectedSkills.length > 0 ? selectedSkills[0] : undefined) ||
            "Full-Stack Web Development";
        const mainSkill = String(rawSkill).trim();

        // Fetch requesting user's profile to ground exam context and difficulty
        const profile = req.userId ? await profileModel.findOne({ userId: req.userId }) : null;
        const userRole = profile?.accountType || "candidate";
        const candidateSkills = [
            ...(profile?.skills || []),
            ...(profile?.expertise || []),
        ];

        // Call Groq LLM to synthesize questions dynamically on the spot
        const aiAssessment = await generateAiQuestions(mainSkill, userRole, candidateSkills);

        const questions: IAssessmentQuestion[] = aiAssessment?.questions && aiAssessment.questions.length >= 8
            ? aiAssessment.questions
            : buildDeterministicFallbackQuestions(mainSkill);

        const title = aiAssessment?.title || `${mainSkill} Competency Exam`;
        const description = aiAssessment?.description || `Dedicated 10-question evaluation covering 3 Easy MCQs, 3 Medium Concept MCQs, and 4 Real-Life Stack Scenario Writing Questions on ${mainSkill}.`;
        const badgeAwarded = aiAssessment?.badgeAwarded || `Verified ${mainSkill} Specialist`;

        // Save generated assessment instance to DB
        const newAssessment = await assessmentModel.create({
            title,
            description,
            category: "Technical",
            skillVectors: [mainSkill],
            durationMinutes: 20,
            passPercentage: 65,
            difficulty: "Intermediate",
            questions,
            badgeAwarded,
            createdBy: req.userId ? (req.userId as any) : undefined,
        } as any);

        // Sanitize questions so correct answers aren't exposed in initial payload
        const sanitized = newAssessment.toObject();
        sanitized.questions = (sanitized.questions || []).map((q: any) => {
            const { correctOptionIndex, explanation, ...rest } = q;
            return rest;
        });

        return res.status(201).json({
            success: true,
            data: sanitized,
        });
    } catch (error) {
        console.error("generateSkillAssessment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate custom assessment",
        });
    }
}

