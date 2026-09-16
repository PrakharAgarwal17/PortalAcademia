import type { Request, Response } from "express";
import assessmentModel, { type IAssessmentQuestion } from "../models/assessmentModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import profileModel from "../models/profileModel.js";
import { getCache, setCache, deleteCache } from "../config/redisClient.js";

/**
 * @description List all standardized skill assessments
 * @route GET /api/assessments
 * @access Public / Authenticated
 */
export async function getAssessments(req: Request, res: Response) {
    try {
        const cacheKey = `cache:assessments:${JSON.stringify(req.query)}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) {
            return res.status(200).json({
                ...cached,
                cached: true,
            });
        }

        const { category, skill, assessmentType } = req.query;
        const query: any = {};

        if (category) {
            query.category = category;
        }
        if (assessmentType) {
            query.assessmentType = assessmentType;
        }
        if (skill) {
            query.skillVectors = { $regex: String(skill), $options: "i" };
        }

        // Fetch assessments, explicitly projecting out correct answers and secret option weights to prevent client cheating
        const assessments = await assessmentModel
            .find(query)
            .select("-questions.correctOptionIndex -questions.explanation -questions.optionDimensionWeights")
            .sort({ createdAt: -1 });

        const payload = {
            success: true,
            count: assessments.length,
            data: assessments,
        };

        // Cache for 10 minutes
        await setCache(cacheKey, payload, 600);

        return res.status(200).json(payload);
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
            .select("-questions.correctOptionIndex -questions.explanation -questions.optionDimensionWeights");

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

        const totalQuestions = assessment.questions.length;
        const isSoftSkills = assessment.assessmentType === "soft_skills" || assessment.category === "SoftSkills";

        if (isSoftSkills) {
            // Behavioral / Soft Skills Scenario-Based Assessment Evaluation
            const dimensions = ["communication", "teamwork", "problemSolving", "leadership"] as const;
            type Dimension = typeof dimensions[number];

            const rawTotals: Record<Dimension, number> = {
                communication: 0,
                teamwork: 0,
                problemSolving: 0,
                leadership: 0,
            };
            const maxTotals: Record<Dimension, number> = {
                communication: 0,
                teamwork: 0,
                problemSolving: 0,
                leadership: 0,
            };

            const evaluatedAnswers: Array<{
                questionId: string;
                selectedOptionIndex: number;
                writtenAnswer?: string;
                timeTakenSeconds?: number;
                isFlaggedAI: boolean;
                isCorrect: boolean;
                explanation: string;
            }> = [];

            for (const q of assessment.questions) {
                const studentAns = answers.find((a) => a.questionId === q.questionId);
                const selected = studentAns?.selectedOptionIndex !== undefined ? studentAns.selectedOptionIndex : -1;
                const timeTaken = studentAns?.timeTakenSeconds || 0;

                const weightsArr = q.optionDimensionWeights || [];
                for (const d of dimensions) {
                    const maxWeightInQ = weightsArr.length > 0
                        ? Math.max(...weightsArr.map((w: any) => Number(w[d] ?? 0)))
                        : 5;
                    maxTotals[d] += maxWeightInQ > 0 ? maxWeightInQ : 5;

                    if (selected >= 0 && selected < weightsArr.length) {
                        const chosenWeight = Number(weightsArr[selected]?.[d] ?? 0);
                        rawTotals[d] += chosenWeight;
                    }
                }

                evaluatedAnswers.push({
                    questionId: q.questionId,
                    selectedOptionIndex: selected,
                    writtenAnswer: "",
                    timeTakenSeconds: timeTaken,
                    isFlaggedAI: false,
                    isCorrect: selected >= 0,
                    explanation: q.explanation || "Scenario evaluated based on behavioral and collaboration dimensions.",
                });
            }

            const normalized: Record<Dimension, number> = {
                communication: 0,
                teamwork: 0,
                problemSolving: 0,
                leadership: 0,
            };
            const verdicts: Record<Dimension, string> = {
                communication: "Developing",
                teamwork: "Developing",
                problemSolving: "Developing",
                leadership: "Developing",
            };

            for (const d of dimensions) {
                const max = maxTotals[d] > 0 ? maxTotals[d] : 1;
                const raw = rawTotals[d];
                const pct = Math.min(100, Math.max(0, Math.round((raw / max) * 100)));
                normalized[d] = pct;
                if (pct >= 85) verdicts[d] = "Exemplary";
                else if (pct >= 70) verdicts[d] = "Proficient";
                else if (pct >= 50) verdicts[d] = "Competent";
                else verdicts[d] = "Developing";
            }

            const overallIndex = Math.round(
                (normalized.communication + normalized.teamwork + normalized.problemSolving + normalized.leadership) / 4
            );

            // Determine primary behavioral archetype
            const sortedDimensions: Dimension[] = [...dimensions].sort((a, b) => normalized[b] - normalized[a]);
            const top1: Dimension = sortedDimensions[0] ?? "communication";
            const top2: Dimension = sortedDimensions[1] ?? "teamwork";
            const lowest: Dimension = sortedDimensions[3] ?? "leadership";

            let archetype = "Balanced Workplace Professional";
            if (
                (top1 === "problemSolving" && top2 === "leadership") ||
                (top1 === "leadership" && top2 === "problemSolving")
            ) {
                archetype = "Decisive Technical Leader";
            } else if (
                (top1 === "communication" && top2 === "teamwork") ||
                (top1 === "teamwork" && top2 === "communication")
            ) {
                archetype = "Collaborative Team Orchestrator";
            } else if (
                (top1 === "problemSolving" && top2 === "teamwork") ||
                (top1 === "teamwork" && top2 === "problemSolving")
            ) {
                archetype = "Pragmatic Solutions Partner";
            } else if (
                (top1 === "communication" && top2 === "leadership") ||
                (top1 === "leadership" && top2 === "communication")
            ) {
                archetype = "Strategic Influencer & Communicator";
            }

            const dimensionLabels: Record<Dimension, string> = {
                communication: "Empathetic & Transparent Communication",
                teamwork: "Cross-Functional Collaboration & Team Synergy",
                problemSolving: "Systemic Root-Cause & Analytical Problem Solving",
                leadership: "Accountability, Mentorship & Technical Leadership",
            };

            const dimensionTips: Record<Dimension, string> = {
                communication: "Practice active listening and proactive asynchronous updates during ambiguous project stages.",
                teamwork: "Foster psychological safety by soliciting peer feedback early and offering compassionate code reviews.",
                problemSolving: "Balance immediate firefighting with preventive post-mortems and long-term architectural stability.",
                leadership: "Take proactive ownership of cross-team dependencies and mentor junior colleagues on engineering best practices.",
            };

            const keyStrengths = [
                `High competency in ${dimensionLabels[top1]} (${normalized[top1]}%)`,
                `Strong collaborative output in ${dimensionLabels[top2]} (${normalized[top2]}%)`,
            ];

            const growthAreas = [
                `Growth opportunity in ${dimensionLabels[lowest]} (${normalized[lowest]}%): ${dimensionTips[lowest]}`,
            ];

            const softSkillsReport = {
                communication: {
                    rawScore: rawTotals.communication,
                    maxPossible: maxTotals.communication,
                    normalizedScore: normalized.communication,
                    verdict: verdicts.communication,
                },
                teamwork: {
                    rawScore: rawTotals.teamwork,
                    maxPossible: maxTotals.teamwork,
                    normalizedScore: normalized.teamwork,
                    verdict: verdicts.teamwork,
                },
                problemSolving: {
                    rawScore: rawTotals.problemSolving,
                    maxPossible: maxTotals.problemSolving,
                    normalizedScore: normalized.problemSolving,
                    verdict: verdicts.problemSolving,
                },
                leadership: {
                    rawScore: rawTotals.leadership,
                    maxPossible: maxTotals.leadership,
                    normalizedScore: normalized.leadership,
                    verdict: verdicts.leadership,
                },
                overallIndex,
                archetype,
                keyStrengths,
                growthAreas,
            };

            const passed = overallIndex >= assessment.passPercentage;
            const badgeAwarded = passed ? (assessment.badgeAwarded || "Certified Workplace Collaborator") : "";
            let verifiedSkillsAdded: string[] = [];

            if (passed) {
                const profile = await profileModel.findOne({ userId: req.userId });
                if (profile) {
                    const currentSkills = new Set(profile.skills || []);
                    const vectorsToAdd = assessment.skillVectors && assessment.skillVectors.length > 0
                        ? assessment.skillVectors
                        : ["Workplace Communication", "Team Collaboration", "Critical Problem Solving", "Engineering Leadership"];
                    vectorsToAdd.forEach((skill) => currentSkills.add(skill));
                    profile.skills = Array.from(currentSkills);

                    if (profile.accountType === "faculty") {
                        const currentExpertise = new Set(profile.expertise || []);
                        vectorsToAdd.forEach((skill) => currentExpertise.add(skill));
                        profile.expertise = Array.from(currentExpertise);
                    }

                    await profile.save();
                    verifiedSkillsAdded = vectorsToAdd;
                }
            }

            const result = await assessmentResultModel.create({
                studentId: req.userId,
                assessmentId: assessment._id,
                assessmentTitle: assessment.title,
                assessmentType: "soft_skills",
                score: overallIndex,
                totalQuestions,
                percentage: overallIndex,
                passed,
                badgeAwarded: badgeAwarded || "",
                verifiedSkillsAdded,
                relatedSkills: assessment.skillVectors && assessment.skillVectors.length > 0
                    ? assessment.skillVectors
                    : ["Workplace Communication", "Team Collaboration", "Critical Problem Solving", "Engineering Leadership"],
                softSkillsReport,
                answers: evaluatedAnswers.map((ea) => ({
                    questionId: ea.questionId,
                    selectedOptionIndex: ea.selectedOptionIndex,
                    writtenAnswer: "",
                    timeTakenSeconds: ea.timeTakenSeconds || 0,
                    isFlaggedAI: false,
                    isCorrect: true,
                })),
                completedAt: new Date(),
            });

            // Compute cumulative attempts and average for this soft skills assessment
            const priorAttempts = await assessmentResultModel.find({
                studentId: req.userId,
                assessmentId: assessment._id,
            });
            const totalAttempts = priorAttempts.length;
            const sumPercentages = priorAttempts.reduce((sum, att) => sum + (att.percentage || 0), 0);
            const averagePercentage = totalAttempts > 0 ? Math.round(sumPercentages / totalAttempts) : overallIndex;

            return res.status(200).json({
                success: true,
                data: {
                    resultId: (result as any)._id,
                    score: overallIndex,
                    totalQuestions,
                    percentage: overallIndex,
                    averagePercentage,
                    totalAttempts,
                    passed,
                    badgeAwarded,
                    verifiedSkillsAdded,
                    passPercentage: assessment.passPercentage,
                    aiFlaggedCount: 0,
                    softSkillsReport,
                    assessmentType: "soft_skills",
                    answers: evaluatedAnswers,
                },
            });
        }

        // Standard Technical MCQ & Writing Evaluation Branch
        let correctCount = 0;
        let aiFlaggedCount = 0;
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
            assessmentType: "technical",
            score: correctCount,
            totalQuestions,
            percentage,
            passed,
            badgeAwarded: badgeAwarded || "",
            verifiedSkillsAdded,
            relatedSkills: assessment.skillVectors && assessment.skillVectors.length > 0 ? assessment.skillVectors : [],
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

        // Compute cumulative attempts and average for this skill/assessment
        const priorAttempts = await assessmentResultModel.find({
            studentId: req.userId,
            $or: [
                { assessmentId: assessment._id },
                { relatedSkills: { $in: assessment.skillVectors } }
            ]
        });
        const totalAttempts = priorAttempts.length;
        const sumPercentages = priorAttempts.reduce((sum, att) => sum + (att.percentage || 0), 0);
        const averagePercentage = totalAttempts > 0 ? Math.round(sumPercentages / totalAttempts) : percentage;

        return res.status(200).json({
            success: true,
            data: {
                resultId: (result as any)._id,
                score: correctCount,
                totalQuestions,
                percentage,
                averagePercentage,
                totalAttempts,
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
 * @description Get all past assessment results for the logged-in student with aggregated skill-level stats (average of all attempts)
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

        // Aggregate statistics per skill across all recorded attempts
        const skillStatsMap: Record<string, {
            skill: string;
            totalAttempts: number;
            averagePercentage: number;
            bestPercentage: number;
            latestPercentage: number;
            isPassed: boolean;
            badgeAwarded?: string | undefined;
            lastAttemptDate: Date;
            attempts: Array<{
                resultId: string;
                score: number;
                totalQuestions: number;
                percentage: number;
                passed: boolean;
                completedAt: Date;
            }>;
        }> = {};

        for (const resItem of results) {
            const skills = (resItem.relatedSkills && resItem.relatedSkills.length > 0)
                ? resItem.relatedSkills
                : (resItem.verifiedSkillsAdded && resItem.verifiedSkillsAdded.length > 0)
                ? resItem.verifiedSkillsAdded
                : [resItem.assessmentTitle.replace(/\s*(Competency Exam|Assessment|Specialist)/i, "").trim()];

            for (const rawSkill of skills) {
                const normalized = rawSkill.trim().toLowerCase();
                if (!normalized) continue;

                if (!skillStatsMap[normalized]) {
                    skillStatsMap[normalized] = {
                        skill: rawSkill.trim(),
                        totalAttempts: 0,
                        averagePercentage: 0,
                        bestPercentage: 0,
                        latestPercentage: resItem.percentage,
                        isPassed: false,
                        badgeAwarded: resItem.badgeAwarded || undefined,
                        lastAttemptDate: resItem.completedAt,
                        attempts: [],
                    };
                }

                const stat = skillStatsMap[normalized]!;
                stat.totalAttempts += 1;
                stat.attempts.push({
                    resultId: (resItem as any)._id.toString(),
                    score: resItem.score,
                    totalQuestions: resItem.totalQuestions,
                    percentage: resItem.percentage,
                    passed: resItem.passed,
                    completedAt: resItem.completedAt,
                });
                if (resItem.passed) stat.isPassed = true;
                if (resItem.badgeAwarded && !stat.badgeAwarded) {
                    stat.badgeAwarded = resItem.badgeAwarded;
                }
            }
        }

        // Finalize averages and best scores for each skill
        for (const key of Object.keys(skillStatsMap)) {
            const stat = skillStatsMap[key];
            if (!stat) continue;
            const pcts = stat.attempts.map((a) => a.percentage);
            stat.averagePercentage = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
            stat.bestPercentage = Math.max(...pcts);
        }

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results,
            skillStats: Object.values(skillStatsMap),
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

        // If the requested skill is a soft skill (speaking, communication, etc.), route directly to soft skills assessment!
        const SOFT_SKILL_KEYWORDS = [
            "speaking",
            "communication",
            "soft skill",
            "softskill",
            "teamwork",
            "leadership",
            "presentation",
            "conflict resolution",
            "negotiation",
            "interpersonal",
            "verbal",
            "collaboration",
            "problem solving",
        ];
        const isSoft = SOFT_SKILL_KEYWORDS.some((kw) => mainSkill.toLowerCase().includes(kw));
        if (isSoft) {
            return generateSoftSkillAssessment(req, res);
        }

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

        // Invalidate assessments cache
        await deleteCache("cache:assessments:*");

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

/**
 * Deterministic fallback scenarios covering authentic workplace dilemmas & speaking response scenarios
 */
function buildDeterministicSoftSkillScenarios(): IAssessmentQuestion[] {
    return [
        {
            questionId: "soft_q1_speaking",
            questionText: "Sample 1 — Explaining a technical concept: You are working on a project and your non-technical manager asks you: 'Can you explain what an API is and why our application needs one?' What would you say? (Record or articulate a 60–90 second answer).",
            type: "speaking",
            difficultyLevel: "speaking",
            concept: "Explaining Technical Concepts Simply",
            speakingDurationSeconds: 90,
            evaluationRubric: [
                "Clarity",
                "Structure",
                "Vocabulary",
                "Ability to explain technical concepts simply",
                "Relevance",
                "Confidence/fluency"
            ],
            options: [
                "Analogy-First: Compare an API to a restaurant waiter taking customer requests to the kitchen and bringing back the meal, showing why our app needs one to securely connect to external services without exposing core database internals.",
                "Protocol-Direct: Explain low-level HTTP protocols, REST endpoints, JSON serialization, and status codes without analogies.",
                "Business-Centric: Focus on business velocity and cost savings, explaining that APIs allow our application to plug into payment processors and auth providers in days instead of months.",
                "Process-Delegation: Provide a quick high-level summary and share architectural documentation links for deeper reading."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 4, problemSolving: 5, leadership: 4 },
                { communication: 2, teamwork: 2, problemSolving: 4, leadership: 2 },
                { communication: 4, teamwork: 4, problemSolving: 4, leadership: 5 },
                { communication: 2, teamwork: 2, problemSolving: 2, leadership: 2 }
            ],
            correctOptionIndex: 0,
            explanation: "Using intuitive real-world analogies to communicate complex system concepts to non-technical stakeholders demonstrates top-tier communication and collaborative problem solving.",
            weight: 2
        },
        {
            questionId: "soft_q2_speaking",
            questionText: "Sample 2 — Team communication: You are working in a team and another developer has implemented something differently from what the team agreed upon. Speak for 60 seconds explaining how you would approach the situation.",
            type: "speaking",
            difficultyLevel: "speaking",
            concept: "Team Communication & Conflict Handling",
            speakingDurationSeconds: 60,
            evaluationRubric: [
                "Professional communication",
                "Collaboration",
                "Conflict handling",
                "Clarity",
                "Tone"
            ],
            options: [
                "Empathetic 1-on-1: Schedule a supportive private conversation to curiously inquire about the edge cases that led to their implementation, review the original team ADR together, and collaborate on an aligned solution without public confrontation.",
                "Direct Rejection: Leave blocking change requests on the PR citing the sprint architecture agreement and ask the tech lead to enforce compliance.",
                "Silent Concession: Quietly adapt your own code to accommodate their changes to avoid friction and preserve sprint velocity.",
                "Public Standup Escalation: Bring up the divergence immediately in the morning standup so the whole team can debate the two approaches."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 5, leadership: 5 },
                { communication: 2, teamwork: 1, problemSolving: 2, leadership: 2 },
                { communication: 1, teamwork: 2, problemSolving: 1, leadership: 1 },
                { communication: 3, teamwork: 3, problemSolving: 3, leadership: 3 }
            ],
            correctOptionIndex: 0,
            explanation: "Empathetic private alignment focused on understanding intent preserves psychological safety while maintaining engineering standards.",
            weight: 2
        },
        {
            questionId: "soft_q3_speaking",
            questionText: "Sample 3 — Interview-style question: 'Tell me about a technical problem you faced in a project and how you solved it.' Speak for 60–90 seconds articulating the challenge, your diagnostic process, and the verified outcome.",
            type: "speaking",
            difficultyLevel: "speaking",
            concept: "Technical Storytelling & Problem Description",
            speakingDurationSeconds: 90,
            evaluationRubric: [
                "How clearly they describe the problem",
                "Whether their answer has a logical structure (STAR)",
                "Technical vocabulary",
                "Conciseness",
                "Communication fluency"
            ],
            options: [
                "STAR Framework: Clearly define the high-impact roadblock, explain systematic telemetry/debugging tools and metrics used, describe the engineered solution, and conclude with verified performance gains and regression tests.",
                "Implementation Dive: Detail the low-level code mechanics, framework idiosyncrasies, and package configurations without framing the broader user or business problem.",
                "Blame Attribution: State that an upstream dependency or former colleague wrote faulty code, and highlight how you rewrote their section.",
                "Collaborative Retrospective: Describe how you paired with colleagues, reviewed logs, iterated on a fix together, and documented the root cause in a team knowledge base."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 4, problemSolving: 5, leadership: 5 },
                { communication: 2, teamwork: 2, problemSolving: 4, leadership: 2 },
                { communication: 1, teamwork: 1, problemSolving: 3, leadership: 1 },
                { communication: 5, teamwork: 5, problemSolving: 4, leadership: 4 }
            ],
            correctOptionIndex: 0,
            explanation: "Clear logical structure (Situation, Task, Action, Result) combined with precise technical vocabulary delivers concise, high-credibility communication.",
            weight: 2
        },
        {
            questionId: "soft_q4_speaking",
            questionText: "Sample 4 — Presentation: You have 90 seconds to explain your project to an HR manager who has no technical background. Speak for up to 90 seconds explaining the user problem, the solution, and the real-world value.",
            type: "speaking",
            difficultyLevel: "speaking",
            concept: "Non-Technical Project Presentation",
            speakingDurationSeconds: 90,
            evaluationRubric: [
                "Presentation structure",
                "Non-technical clarity",
                "Value proposition delivery",
                "Time management",
                "Professional demeanor"
            ],
            options: [
                "Value-Driven Narrative: Hook the audience with the real user pain point, describe the intuitive solution in accessible language, quantify the impact (e.g. hours saved, adoption rate), and highlight cross-functional teamwork.",
                "Technical Architecture Walkthrough: List the technologies used (React, TypeScript, Node.js, PostgreSQL) and explain the database schemas and microservice topology.",
                "Effort-Centric Description: Explain how many hours of coding, debugging, and testing went into building the application.",
                "Interactive User Journey: Walk through a day-in-the-life scenario of a user interacting with the application and experiencing immediate benefits."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 4, leadership: 5 },
                { communication: 1, teamwork: 2, problemSolving: 2, leadership: 1 },
                { communication: 2, teamwork: 1, problemSolving: 2, leadership: 1 },
                { communication: 5, teamwork: 4, problemSolving: 4, leadership: 4 }
            ],
            correctOptionIndex: 0,
            explanation: "Tailoring technical narratives to non-technical stakeholders by focusing on measurable value, storytelling, and empathy demonstrates strategic executive maturity.",
            weight: 2
        },
        {
            questionId: "soft_q2",
            questionText: "Sprint Deadline vs Technical Debt: Two days before sprint freeze, the Product Manager requests a high-priority feature tweak promised to a key enterprise client. Adding it now will mean bypassing automated integration tests and increasing technical debt in a core billing module. What is your approach?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Trade-off Negotiation & Quality Advocacy",
            options: [
                "Schedule a quick 15-minute sync with the PM to present the architectural risks and test coverage impact. Propose delivering a scoped-down version behind a feature flag for that specific client, while scheduling full test automation in the next immediate sprint.",
                "Strictly reject the request citing the team's Definition of Done and engineering quality guidelines, refusing to compromise test coverage for sprint scope changes.",
                "Agree to implement the full feature immediately and work overtime over the weekend to write the missing integration tests on your own time.",
                "Analyze the minimal blast radius of the change, isolate the billing logic with temporary runtime guards, and notify the QA team to perform targeted manual sanity verification before sign-off."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 5, leadership: 4 },
                { communication: 2, teamwork: 1, problemSolving: 2, leadership: 3 },
                { communication: 2, teamwork: 3, problemSolving: 2, leadership: 1 },
                { communication: 3, teamwork: 4, problemSolving: 4, leadership: 3 }
            ],
            correctOptionIndex: 0,
            explanation: "Collaborative problem solving that addresses business urgency through feature flags without alienating cross-functional partners or quietly creating tech debt.",
            weight: 2
        },
        {
            questionId: "soft_q3",
            questionText: "Disagreement Over System Architecture: You and a senior peer strongly disagree on whether to migrate an existing monolithic service to event-driven microservices or refactor it into a modular monolith. The discussion in code reviews and architecture meetings has stalled progress for over a week. How do you break the deadlock?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Architectural Alignment & Constructive Debate",
            options: [
                "Compile an objective Architectural Decision Record (ADR) mapping both options against concrete team metrics: infrastructure costs, team cognitive load, operational complexity, and delivery velocity. Propose a small time-boxed spike (proof-of-concept) to test the riskiest assumptions before deciding.",
                "Escalate immediately to the VP of Engineering or Tech Lead to make the final executive decision and end the debate.",
                "Concede to your peer's proposal to preserve team harmony and avoid further conflict, even if you harbor technical reservations.",
                "Invite a neutral Staff Engineer from another domain team to review both architectural diagrams and facilitate a consensus workshop."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 4, problemSolving: 5, leadership: 5 },
                { communication: 2, teamwork: 1, problemSolving: 2, leadership: 2 },
                { communication: 1, teamwork: 3, problemSolving: 1, leadership: 1 },
                { communication: 4, teamwork: 5, problemSolving: 4, leadership: 3 }
            ],
            correctOptionIndex: 0,
            explanation: "Grounds architectural debate in empirical data and low-risk prototyping (spikes), demonstrating high analytical problem solving and collaborative leadership.",
            weight: 2
        },
        {
            questionId: "soft_q4",
            questionText: "Underperforming Teammate in a Paired Deliverable: You are paired with a colleague on a mission-critical sprint deliverable. For the past three daily standups, they have reported being blocked by minor issues, hasn't committed working code, and is falling behind schedule. How do you intervene?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Peer Mentorship & Accountability",
            options: [
                "Reach out via a supportive 1-on-1 call to understand what is genuinely blocking them, offer to pair-program on the tricky module for an hour, and help break their task into smaller, manageable milestones.",
                "Take over their assigned branch quietly in the evening and complete the feature yourself to ensure the team hits the sprint commitment.",
                "Raise their lack of progress publicly in the next team standup so the Scrum Master and Manager are forced to reallocate the tickets.",
                "Re-evaluate the task dependencies together, identify if the ticket was poorly specified, and collaborate on updating the acceptance criteria and technical notes."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 4, leadership: 4 },
                { communication: 1, teamwork: 1, problemSolving: 3, leadership: 1 },
                { communication: 1, teamwork: 1, problemSolving: 1, leadership: 1 },
                { communication: 4, teamwork: 4, problemSolving: 5, leadership: 3 }
            ],
            correctOptionIndex: 0,
            explanation: "Empathetic communication combined with hands-on pairing promotes peer growth while protecting sprint commitments without toxicity or martyr behavior.",
            weight: 2
        },
        {
            questionId: "soft_q5",
            questionText: "Managing Unrealistic Stakeholder Expectations: During a quarterly roadmap review, the sales director promises an enterprise client that a complex real-time analytics dashboard will be delivered in 3 weeks, though your team's engineering estimation was 8 weeks. How do you handle this discrepancy?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Stakeholder Expectation Management",
            options: [
                "Meet with the sales director and product manager with a transparent breakdown of work streams. Present a phased delivery proposal: an MVP covering the client's core high-value metrics in 3 weeks, followed by deep analytics in subsequent releases.",
                "Publicly dispute the timeline in the all-hands meeting to make it clear engineering was never consulted before promises were made.",
                "Ask the engineering team to cut corners on code reviews, error logging, and performance benchmarks to hit the 3-week deadline.",
                "Quantify the technical risks, required resources, and trade-offs in an executive summary email to leadership, requesting budget for contractor augmentation if 3 weeks is mandatory."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 5, leadership: 5 },
                { communication: 1, teamwork: 1, problemSolving: 1, leadership: 2 },
                { communication: 1, teamwork: 2, problemSolving: 1, leadership: 1 },
                { communication: 4, teamwork: 3, problemSolving: 4, leadership: 4 }
            ],
            correctOptionIndex: 0,
            explanation: "Demonstrates strategic diplomacy by turning an unviable deadline into a viable phased-release milestone that satisfies client needs without burning out engineering.",
            weight: 2
        },
        {
            questionId: "soft_q6",
            questionText: "Receiving Critical Feedback on Code & Design: During an in-depth pull request review, a staff architect leaves 25 comments criticizing your API design, pointing out edge cases you missed, and questioning your chosen data structure. You spent the entire week on this PR. How do you process and respond?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Feedback Receptivity & Continuous Learning",
            options: [
                "Take a step back to detach ego from code. Go through each comment systematically, thank the reviewer for identifying edge cases, ask clarifying questions where trade-offs aren't clear, and update the PR with unit tests addressing the concerns.",
                "Defend your design choices assertively on all 25 comments, arguing that the architect's suggestions are over-engineered for the current business phase.",
                "Accept and blindly implement all 25 changes without question, even if you suspect some of the suggestions might degrade database performance.",
                "Schedule a quick 10-minute huddle with the architect to align on the core design principles and agree on which changes are blocking vs non-blocking suggestions."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 4, problemSolving: 5, leadership: 4 },
                { communication: 2, teamwork: 1, problemSolving: 2, leadership: 2 },
                { communication: 1, teamwork: 2, problemSolving: 1, leadership: 1 },
                { communication: 5, teamwork: 5, problemSolving: 4, leadership: 4 }
            ],
            correctOptionIndex: 0,
            explanation: "Emotional intelligence and constructive receptivity allow turning dense critical feedback into elevated code quality and technical maturity.",
            weight: 2
        },
        {
            questionId: "soft_q7",
            questionText: "Ethical Dilemma: Privacy & Telemetry Tracking: A product feature requires capturing user keystroke telemetry and search queries to improve predictive suggestions. While reviewing the implementation, you notice that sensitive user credentials or personal identifying information (PII) might occasionally be transmitted unmasked to external logging tools. What do you do?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Engineering Ethics & Security Advocacy",
            options: [
                "Immediately halt merging the branch, file a security concern, and present a client-side masking and regex sanitization solution to the lead and PM that scrubs PII while retaining the needed telemetry signals.",
                "Ship the feature as designed since telemetry is standard practice and security compliance can be audited at a later quarterly review.",
                "Delete the telemetry code unilaterally without informing the product team to ensure user privacy is preserved.",
                "Document the exact risk with reproducible test cases, calculate compliance exposure under GDPR/data regulations, and schedule an emergency review with the engineering manager."
            ],
            optionDimensionWeights: [
                { communication: 4, teamwork: 4, problemSolving: 5, leadership: 5 },
                { communication: 1, teamwork: 1, problemSolving: 1, leadership: 1 },
                { communication: 1, teamwork: 1, problemSolving: 2, leadership: 2 },
                { communication: 5, teamwork: 3, problemSolving: 4, leadership: 5 }
            ],
            correctOptionIndex: 0,
            explanation: "Exemplifies ethical engineering leadership by protecting end-user privacy while proactively engineering a compliant technical alternative.",
            weight: 2
        },
        {
            questionId: "soft_q8",
            questionText: "Navigating Team Burnout & Morale Dip: Following three back-to-back intense sprint crunches, several team members appear visibly exhausted, PR review times have doubled, and cynicism is rising in retro meetings. As an active team member, what step do you take?",
            type: "mcq",
            difficultyLevel: "medium",
            concept: "Team Dynamics & Sustainable Engineering",
            options: [
                "Use the team retrospective to voice constructive observations about unsustainable pacing. Advocate for dedicating the next sprint to tech debt, documentation, and tooling upgrades to allow the team to recharge while maintaining productivity.",
                "Ignore the mood and focus solely on your individual tickets to avoid getting dragged into team politics.",
                "Complain openly on private messaging channels to validate your peers' frustration with management.",
                "Propose quick asynchronous team rituals (like peer shoutouts/kudos) and volunteer to take on some tedious triage tasks to alleviate pressure on teammates."
            ],
            optionDimensionWeights: [
                { communication: 5, teamwork: 5, problemSolving: 4, leadership: 5 },
                { communication: 1, teamwork: 1, problemSolving: 1, leadership: 1 },
                { communication: 1, teamwork: 2, problemSolving: 1, leadership: 1 },
                { communication: 4, teamwork: 5, problemSolving: 3, leadership: 4 }
            ],
            correctOptionIndex: 0,
            explanation: "Constructive cultural leadership that addresses the systemic causes of burnout through structural sprint planning rather than passive venting.",
            weight: 2
        }
    ];
}

/**
 * Calls Groq LLM to synthesize dynamic scenario-based soft skills MCQs with dimensional weights
 */
async function generateAiSoftSkillQuestions(
    theme: string,
    userRole: string,
    candidateSkills: string[]
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

    const systemPrompt = `You are an organizational psychologist and senior engineering leader designing scenario-based workplace dilemma questions to assess behavioral competencies, team dynamics, communication, and leadership in software engineers.
Target Focus / Theme: ${theme}.
Candidate role: ${userRole}. Background: ${candidateSkills.slice(0, 6).join(", ") || "Engineering & Team Collaboration"}.

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "${theme} Behavioral Assessment",
  "description": "Scenario-based evaluation measuring workplace communication, cross-functional collaboration, problem solving, and engineering leadership.",
  "category": "SoftSkills",
  "difficulty": "Intermediate",
  "badgeAwarded": "Certified Workplace Collaborator",
  "questions": [
    {
      "questionId": "sq1",
      "questionText": "Detailed workplace dilemma description (1-3 sentences establishing high stakes, trade-offs, or interpersonal friction)...",
      "type": "mcq",
      "concept": "Crisis Management & Accountability",
      "options": [
        "Action option A: Balanced proactive response...",
        "Action option B: Individualist or reactive response...",
        "Action option C: People-first or passive response...",
        "Action option D: Analytical or procedural response..."
      ],
      "optionDimensionWeights": [
        { "communication": 5, "teamwork": 4, "problemSolving": 5, "leadership": 5 },
        { "communication": 2, "teamwork": 2, "problemSolving": 4, "leadership": 3 },
        { "communication": 4, "teamwork": 5, "problemSolving": 3, "leadership": 4 },
        { "communication": 1, "teamwork": 1, "problemSolving": 3, "leadership": 1 }
      ],
      "correctOptionIndex": 0,
      "explanation": "Why balanced communication and collaborative problem solving excels in this scenario.",
      "weight": 2
    }
  ]
}

Strict requirements:
- Exactly 8 scenario-based questions.
- Every question MUST be a realistic workplace situation (production outages, deadline crunches vs tech debt, architecture arguments, underperforming peers, stakeholder demands, critical PR reviews, ethics/PII leaks, burnout).
- NO definitional questions (e.g. NEVER ask 'What is active listening?').
- Each question must have exactly 4 options.
- optionDimensionWeights MUST contain exactly 4 items corresponding to the 4 options.
- Each item in optionDimensionWeights MUST have integers between 0 and 5 for all 4 keys: "communication", "teamwork", "problemSolving", "leadership".
- Output pure JSON only. No markdown fences.`;

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
                        {
                            role: "user",
                            content: `Generate an 8-question scenario-based behavioral assessment for "${theme}". Output pure JSON only.`,
                        },
                    ],
                    temperature: 0.4,
                    max_completion_tokens: 4000,
                    response_format: { type: "json_object" },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`Groq soft skills model ${candidateModel} returned status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const rawContent = data.choices?.[0]?.message?.content;
            if (!rawContent) continue;

            const parsed = JSON.parse(rawContent);
            if (Array.isArray(parsed.questions) && parsed.questions.length >= 6) {
                // Ensure all questions have optionDimensionWeights
                const validQuestions = parsed.questions.map((q: any, idx: number) => ({
                    questionId: q.questionId || `sq_${idx + 1}`,
                    questionText: q.questionText,
                    type: "mcq" as const,
                    difficultyLevel: "medium" as const,
                    concept: q.concept || "Behavioral Dilemma",
                    options: Array.isArray(q.options) && q.options.length === 4
                        ? q.options
                        : ["Collaborative resolution", "Direct action", "Peer consultation", "Process escalation"],
                    optionDimensionWeights: Array.isArray(q.optionDimensionWeights) && q.optionDimensionWeights.length === 4
                        ? q.optionDimensionWeights.map((w: any) => ({
                            communication: Math.min(5, Math.max(0, Number(w.communication ?? 3))),
                            teamwork: Math.min(5, Math.max(0, Number(w.teamwork ?? 3))),
                            problemSolving: Math.min(5, Math.max(0, Number(w.problemSolving ?? 3))),
                            leadership: Math.min(5, Math.max(0, Number(w.leadership ?? 3))),
                        }))
                        : [
                            { communication: 5, teamwork: 4, problemSolving: 5, leadership: 4 },
                            { communication: 2, teamwork: 2, problemSolving: 4, leadership: 3 },
                            { communication: 4, teamwork: 5, problemSolving: 3, leadership: 4 },
                            { communication: 2, teamwork: 2, problemSolving: 2, leadership: 2 },
                        ],
                    correctOptionIndex: 0,
                    explanation: q.explanation || "Evaluated across communication, teamwork, problem solving, and leadership dimensions.",
                    weight: 2,
                }));

                return {
                    title: parsed.title || `${theme} Behavioral Competency Assessment`,
                    description: parsed.description || "Scenario-based evaluation measuring workplace communication, cross-functional collaboration, and leadership.",
                    badgeAwarded: parsed.badgeAwarded || "Certified Workplace Collaborator",
                    questions: validQuestions,
                };
            }
        } catch (err) {
            console.warn(`Groq soft skills candidate ${candidateModel} failed:`, err);
        }
    }
    return null;
}

/**
 * @description Generate dedicated Scenario-Based Soft Skills & Behavioral Assessment
 * @route POST /api/assessments/generate-soft-skills
 * @access Authenticated
 */
export async function generateSoftSkillAssessment(req: Request, res: Response) {
    try {
        const { theme: explicitTheme, targetSkill, skill } = req.body as {
            theme?: string;
            targetSkill?: string;
            skill?: string;
        };
        const rawTheme = explicitTheme || targetSkill || skill || "Workplace Collaboration & Speaking Scenarios";
        const theme = String(rawTheme).trim();

        // Fetch user profile context
        const profile = req.userId ? await profileModel.findOne({ userId: req.userId }) : null;
        const userRole = profile?.accountType || "candidate";
        const candidateSkills = [
            ...(profile?.skills || []),
            ...(profile?.expertise || []),
        ];

        // Call Groq LLM to synthesize scenarios dynamically
        const aiAssessment = await generateAiSoftSkillQuestions(theme, userRole, candidateSkills);

        const questions: IAssessmentQuestion[] = aiAssessment?.questions && aiAssessment.questions.length >= 6
            ? aiAssessment.questions
            : buildDeterministicSoftSkillScenarios();

        const isSpeaking = theme.toLowerCase().includes("speaking") || theme.toLowerCase().includes("communication");
        const title = aiAssessment?.title || (isSpeaking ? `${theme} Competency & Behavioral Assessment` : `${theme} Behavioral Assessment`);
        const description = aiAssessment?.description || "Authentic scenario-based evaluation measuring technical concept articulation, team conflict resolution, problem communication, and executive presentation.";
        const badgeAwarded = aiAssessment?.badgeAwarded || (isSpeaking ? "Certified Effective Communicator & Speaker" : "Certified Workplace Collaborator");

        // Create persistent assessment record in DB
        const newAssessment = await assessmentModel.create({
            title,
            description,
            category: "SoftSkills",
            assessmentType: "soft_skills",
            skillVectors: ["Workplace Communication", "Team Collaboration", "Critical Problem Solving", "Engineering Leadership"],
            durationMinutes: 15,
            passPercentage: 60,
            difficulty: "Intermediate",
            questions,
            badgeAwarded,
            createdBy: req.userId ? (req.userId as any) : undefined,
        } as any);

        // Sanitize questions so correct answers and secret optionDimensionWeights aren't exposed to client
        const sanitized = newAssessment.toObject();
        sanitized.questions = (sanitized.questions || []).map((q: any) => {
            const { correctOptionIndex, explanation, optionDimensionWeights, ...rest } = q;
            return rest;
        });

        // Invalidate assessments cache
        await deleteCache("cache:assessments:*");

        return res.status(201).json({
            success: true,
            data: sanitized,
        });
    } catch (error) {
        console.error("generateSoftSkillAssessment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate soft skills assessment",
        });
    }
}

