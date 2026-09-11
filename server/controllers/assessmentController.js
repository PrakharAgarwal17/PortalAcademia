import assessmentModel from "../models/assessmentModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";
import profileModel from "../models/profileModel.js";
/**
 * @description List all standardized skill assessments
 * @route GET /api/assessments
 * @access Public / Authenticated
 */
export async function getAssessments(req, res) {
    try {
        const { category, skill } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        if (skill) {
            query.skillVectors = { $regex: new RegExp(String(skill), "i") };
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
    }
    catch (error) {
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
export async function getAssessmentById(req, res) {
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
    }
    catch (error) {
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
export async function submitAssessment(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
        }
        const { id } = req.params;
        const { answers } = req.body;
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
        const totalQuestions = assessment.questions.length;
        const evaluatedAnswers = [];
        // Grade each response against the master key
        for (const q of assessment.questions) {
            const studentAns = answers.find((a) => a.questionId === q.questionId);
            const selected = studentAns !== undefined ? studentAns.selectedOptionIndex : -1;
            const isCorrect = selected === q.correctOptionIndex;
            if (isCorrect) {
                correctCount += 1;
            }
            evaluatedAnswers.push({
                questionId: q.questionId,
                selectedOptionIndex: selected,
                isCorrect,
                explanation: q.explanation || "",
            });
        }
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = percentage >= assessment.passPercentage;
        const badgeAwarded = passed ? assessment.badgeAwarded : "";
        let verifiedSkillsAdded = [];
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
                isCorrect: ea.isCorrect,
            })),
            completedAt: new Date(),
        });
        return res.status(200).json({
            success: true,
            data: {
                resultId: result._id,
                score: correctCount,
                totalQuestions,
                percentage,
                passed,
                badgeAwarded,
                verifiedSkillsAdded,
                passPercentage: assessment.passPercentage,
                answers: evaluatedAnswers,
            },
        });
    }
    catch (error) {
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
export async function getMyResults(req, res) {
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
    }
    catch (error) {
        console.error("getMyResults error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch assessment history",
        });
    }
}
//# sourceMappingURL=assessmentController.js.map