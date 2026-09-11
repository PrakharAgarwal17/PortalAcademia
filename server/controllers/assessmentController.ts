import type { Request, Response } from "express";
import assessmentModel from "../models/assessmentModel.js";
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

        // If passed, inject verified skill vectors into the student's live profile
        if (passed) {
            const profile = await profileModel.findOne({ userId: req.userId });
            if (profile) {
                const currentSkills = new Set(profile.skills || []);
                assessment.skillVectors.forEach((skill) => currentSkills.add(skill));
                profile.skills = Array.from(currentSkills);
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
 * @description Dynamically generate a 10-question assessment tailored to selected skills
 * @route POST /api/assessments/generate
 * @access Authenticated
 */
export async function generateSkillAssessment(req: Request, res: Response) {
    try {
        const { selectedSkills, targetSkill: explicitTarget } = req.body as {
            selectedSkills?: string[];
            targetSkill?: string;
        };

        // Determine primary target skill/language for this dedicated test
        const mainSkill =
            explicitTarget ||
            (selectedSkills && selectedSkills.length > 0 ? selectedSkills[0] : "Full-Stack Web Development");

        // Build 10 clean questions for mainSkill: 3 Easy MCQs, 3 Medium MCQs, 4 Real-Life Developer Stack Writing Questions
        const questions = [
            // 3 Easy MCQs
            {
                questionId: "q1_easy",
                questionText: `What is the primary architectural purpose of using ${mainSkill} in modern application development?`,
                type: "mcq" as const,
                difficultyLevel: "easy" as const,
                concept: "Core Architecture & Role",
                options: [
                    `To provide modular execution, scalable application logic, and structured state management using ${mainSkill}.`,
                    "To bypass network encryption and write directly to low-level hardware BIOS memory.",
                    "To format plain text documents without executing any application code.",
                    "To replace database storage engines with local browser cookies."
                ],
                correctOptionIndex: 0,
                explanation: `${mainSkill} provides structured application execution and modular logic management.`,
                weight: 1,
            },
            {
                questionId: "q2_easy",
                questionText: `When managing state and data flow in ${mainSkill}, which practice ensures maintainability and prevents unexpected side-effects?`,
                type: "mcq" as const,
                difficultyLevel: "easy" as const,
                concept: "State Management & Data Flow",
                options: [
                    "Mutating unhandled global objects across random independent functions.",
                    "Enforcing predictable unidirectional data flow and isolating state mutations.",
                    "Disabling all variable type checks and linting rules during production builds.",
                    "Storing plain-text auth tokens in unencrypted local file caches."
                ],
                correctOptionIndex: 1,
                explanation: "Unidirectional data flow and explicit state boundaries prevent unexpected side-effects.",
                weight: 1,
            },
            {
                questionId: "q3_easy",
                questionText: `In ${mainSkill}, what is the main advantage of non-blocking asynchronous operation handling?`,
                type: "mcq" as const,
                difficultyLevel: "easy" as const,
                concept: "Asynchronous IO & Concurrency",
                options: [
                    "It halts main execution until network payloads complete.",
                    "It allows the runtime event loop to handle concurrent requests while awaiting IO operations.",
                    "It converts HTTP calls directly into binary machine instructions.",
                    "It locks CPU threads to force single-threaded execution."
                ],
                correctOptionIndex: 1,
                explanation: "Asynchronous non-blocking operations keep the runtime responsive under concurrent IO workloads.",
                weight: 1,
            },
            // 3 Medium Concept MCQs
            {
                questionId: "q4_med",
                questionText: `How does memoization or intelligent response caching improve application throughput in ${mainSkill}?`,
                type: "mcq" as const,
                difficultyLevel: "medium" as const,
                concept: "Algorithmic Efficiency & Caching",
                options: [
                    "By storing expensive computation or query results and reusing them for identical input parameters.",
                    "By clearing active system memory immediately after every function call.",
                    "By spawning duplicate background network requests every second.",
                    "By forcing database re-indexing on every user interaction."
                ],
                correctOptionIndex: 0,
                explanation: "Caching/Memoization stores computed results to eliminate redundant processing overhead.",
                weight: 2,
            },
            {
                questionId: "q5_med",
                questionText: `How should concurrent data access and state synchronization be handled in high-traffic ${mainSkill} deployments?`,
                type: "mcq" as const,
                difficultyLevel: "medium" as const,
                concept: "Concurrency Control & State Consistency",
                options: [
                    "Allow uncoordinated write operations without transaction boundaries.",
                    "Utilize atomic database operations, optimistic locking, or mutexes to prevent race conditions.",
                    "Rely on client-side setTimeouts to synchronize server records.",
                    "Store transactional state exclusively in volatile browser storage."
                ],
                correctOptionIndex: 1,
                explanation: "Atomic operations and optimistic locking ensure state integrity under concurrent access.",
                weight: 2,
            },
            {
                questionId: "q6_med",
                questionText: `Which architectural pattern effectively decouples core business logic from third-party infrastructure in ${mainSkill}?`,
                type: "mcq" as const,
                difficultyLevel: "medium" as const,
                concept: "Clean Architecture & Decoupling",
                options: [
                    "Writing raw database connection strings inside client view components.",
                    "Layered / Hexagonal Architecture separating domain logic, use cases, and interface adapters.",
                    "Using global static singletons for all state without abstraction layers.",
                    "Hardcoding third-party API secrets inside client bundle assets."
                ],
                correctOptionIndex: 1,
                explanation: "Hexagonal/Clean Architecture decouples core application domain logic from external adapters.",
                weight: 2,
            },
            // 4 Real-Life Stack Writing Questions (Timed: 3 Min Each)
            {
                questionId: "q7_write",
                questionText: `Production Latency & Memory Leak Debugging: A high-traffic ${mainSkill} service is experiencing sudden latency spikes and memory growth under peak traffic. Walk through your step-by-step diagnostic process, tools you would use (profilers, logs, heap dumps), and how you would isolate and resolve the bottleneck.`,
                type: "writing" as const,
                difficultyLevel: "writing" as const,
                concept: "Real-World Profiling & Performance Debugging",
                options: ["Descriptive Real-World Scenario Answer Required"],
                correctOptionIndex: 0,
                explanation: "Requires detailing empirical profiling, heap dump inspection, isolation of memory leaks/CPU bottlenecks, and post-fix validation.",
                weight: 3,
            },
            {
                questionId: "q8_write",
                questionText: `Concurrency & Race Condition Handling: In a high-concurrency application built with ${mainSkill}, two simultaneous requests race to update the same user account state, leading to data corruption or double-processing. Describe how you would redesign the data flow, locking strategy, or transaction boundaries to guarantee consistency.`,
                type: "writing" as const,
                difficultyLevel: "writing" as const,
                concept: "Real-World Concurrency & State Integrity",
                options: ["Descriptive Real-World Scenario Answer Required"],
                correctOptionIndex: 0,
                explanation: "Requires detailing atomic transaction isolation, optimistic locking/versioning, or queue-based sequencing.",
                weight: 3,
            },
            {
                questionId: "q9_write",
                questionText: `Third-Party Dependency Failure & Fault Tolerance: An external microservice or third-party API that your ${mainSkill} application relies on starts timing out intermittently during peak hours. How would you design circuit breakers, exponential backoff retries, and fallback caching to keep your system resilient?`,
                type: "writing" as const,
                difficultyLevel: "writing" as const,
                concept: "Real-World Fault Tolerance & API Resilience",
                options: ["Descriptive Real-World Scenario Answer Required"],
                correctOptionIndex: 0,
                explanation: "Requires detailing circuit breaker states (Closed/Open/Half-Open), exponential backoff jitter, fallback responses, and telemetry alerting.",
                weight: 3,
            },
            {
                questionId: "q10_write",
                questionText: `Security Audit & Hardening: During a security code review of a ${mainSkill} module, you notice potential vulnerabilities related to authentication token handling and input validation. Detail your approach to refactoring token management (httpOnly cookies, CSRF protection) and sanitizing input to harden the system against exploits.`,
                type: "writing" as const,
                difficultyLevel: "writing" as const,
                concept: "Real-World System Security & Hardening",
                options: ["Descriptive Real-World Scenario Answer Required"],
                correctOptionIndex: 0,
                explanation: "Requires detailing secure cookie flags, input validation schemas, auth token refresh rotation, and RBAC middleware enforcement.",
                weight: 3,
            },
        ];

        const title = `${mainSkill} Competency Exam`;
        const badge = `Verified ${mainSkill} Specialist`;

        // Save generated assessment instance to DB
        const newAssessment = await assessmentModel.create({
            title,
            description: `Dedicated 10-question evaluation covering 3 Easy MCQs, 3 Medium Concept MCQs, and 4 Real-Life Stack Scenario Writing Questions on ${mainSkill}.`,
            category: "Technical",
            skillVectors: [mainSkill],
            durationMinutes: 20,
            passPercentage: 65,
            difficulty: "Intermediate",
            questions,
            badgeAwarded: badge,
            createdBy: req.userId ? (req.userId as any) : undefined,
        } as any);

        return res.status(201).json({
            success: true,
            data: newAssessment,
        });
    } catch (error) {
        console.error("generateSkillAssessment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate custom assessment",
        });
    }
}

