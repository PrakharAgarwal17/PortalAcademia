import type { Request, Response } from "express";
import profileModel from "../models/profileModel.js";
import opportunityModel from "../models/opportunityModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";

/**
 * @description Compute cohort readiness, skill distribution, and curriculum deficits via MongoDB Aggregation Pipelines
 * @route GET /api/analytics/institution/cohort
 * @access Authenticated (Institution)
 */
export async function getCohortAnalytics(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const institutionProfile = await profileModel.findOne({ userId: req.userId });
        const instName = institutionProfile?.institutionName || institutionProfile?.name;

        // Match criteria for students in this institution
        const studentMatch: any = { accountType: "student" };
        if (instName) {
            const escapedName = instName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            studentMatch.$or = [
                { institution: { $regex: new RegExp(escapedName, "i") } },
                { institutionName: { $regex: new RegExp(escapedName, "i") } },
            ];
        }

        // Pipeline 1: Aggregation for top skills in cohort
        const skillAggregation = await profileModel.aggregate([
            { $match: studentMatch },
            { $unwind: "$skills" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$skills" } } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        // Pipeline 2: Aggregation for summary metrics (readiness, verification rate)
        const summaryAggregation = await profileModel.aggregate([
            { $match: studentMatch },
            {
                $project: {
                    skillsCount: { $size: { $ifNull: ["$skills", []] } },
                    certsCount: { $size: { $ifNull: ["$certifications", []] } },
                    verifiedCertsCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ["$certifications", []] },
                                as: "c",
                                cond: { $eq: ["$$c.isVerified", true] },
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    avgSkills: { $avg: "$skillsCount" },
                    totalCertifications: { $sum: "$certsCount" },
                    verifiedCertifications: { $sum: "$verifiedCertsCount" },
                },
            },
        ]);

        // Pipeline 3: Top trending skills required by industry to identify curriculum deficits
        const marketSkills = await opportunityModel.aggregate([
            { $match: { status: "active" } },
            { $unwind: "$requiredSkills" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$requiredSkills" } } },
                    demand: { $sum: 1 },
                },
            },
            { $sort: { demand: -1 } },
            { $limit: 6 },
        ]);

        const summary = summaryAggregation[0] || {
            totalStudents: 0,
            avgSkills: 0,
            totalCertifications: 0,
            verifiedCertifications: 0,
        };

        const totalStudents = summary.totalStudents || 1;
        const verificationRate = summary.totalCertifications > 0
            ? Math.round((summary.verifiedCertifications / summary.totalCertifications) * 100)
            : 0;

        // Calculate curriculum skill deficit percentages against market demand
        const cohortSkillMap = new Map<string, number>();
        skillAggregation.forEach((s) => cohortSkillMap.set(s._id, s.count));

        const curriculumDeficits = marketSkills.map((ms) => {
            const studentCount = cohortSkillMap.get(ms._id) || 0;
            const deficiencyPct = Math.max(
                5,
                Math.round(((totalStudents - studentCount) / totalStudents) * 100)
            );
            return {
                skill: ms._id.toUpperCase(),
                marketDemandIndex: ms.demand,
                cohortProficiencyCount: studentCount,
                curriculumDeficitPercent: deficiencyPct,
            };
        });

        const avgReadiness = Math.min(
            96,
            Math.max(45, Math.round((summary.avgSkills || 3) * 14 + verificationRate * 0.3))
        );

        return res.status(200).json({
            success: true,
            data: {
                totalStudents: summary.totalStudents,
                averageReadinessScore: avgReadiness,
                verificationRate,
                totalCertificationsSubmitted: summary.totalCertifications,
                totalVerifiedCredentials: summary.verifiedCertifications,
                topSkillsDistribution: skillAggregation.map((s) => ({
                    skill: s._id,
                    studentCount: s.count,
                    percentage: Math.round((s.count / totalStudents) * 100),
                })),
                curriculumDeficits,
            },
        });
    } catch (error) {
        console.error("getCohortAnalytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compute cohort telemetry",
        });
    }
}

/**
 * @description Compute industry hiring demand trends and market deficits via MongoDB Aggregation Pipelines
 * @route GET /api/analytics/industry/market-trends
 * @access Public / Authenticated
 */
export async function getMarketTrends(req: Request, res: Response) {
    try {
        // Aggregate top in-demand skills from active postings
        const skillDemand = await opportunityModel.aggregate([
            { $match: { status: "active" } },
            { $unwind: "$requiredSkills" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$requiredSkills" } } },
                    openPostings: { $sum: 1 },
                },
            },
            { $sort: { openPostings: -1 } },
            { $limit: 10 },
        ]);

        // Aggregate opportunities volume by category
        const categoryVolume = await opportunityModel.aggregate([
            { $match: { status: "active" } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalApplicants: { $sum: "$applicantCount" },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Talent supply aggregation
        const talentSupply = await profileModel.aggregate([
            { $match: { accountType: "student" } },
            { $unwind: "$skills" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$skills" } } },
                    availableCandidates: { $sum: 1 },
                },
            },
        ]);

        const supplyMap = new Map<string, number>();
        talentSupply.forEach((ts) => supplyMap.set(ts._id, ts.availableCandidates));

        const demandVsSupply = skillDemand.map((sd) => {
            const supply = supplyMap.get(sd._id) || 1;
            const deficitRatio = Math.round((sd.openPostings / (supply + sd.openPostings)) * 100);
            return {
                skill: sd._id,
                openPostings: sd.openPostings,
                availableTalent: supply,
                marketDeficitPercent: deficitRatio,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                demandVsSupply,
                categoryVolume,
            },
        });
    } catch (error) {
        console.error("getMarketTrends error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compute market trends",
        });
    }
}

/**
 * @description Compute student individual skill distance vs live industry postings
 * @route GET /api/analytics/student/gap
 * @access Authenticated (Student)
 */
export async function getStudentSkillGap(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const profile = await profileModel.findOne({ userId: req.userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }

        const studentSkills = (profile.skills || []).map((s) => s.toLowerCase().trim());

        // Top in-demand market skills
        const topMarketSkills = await opportunityModel.aggregate([
            { $match: { status: "active" } },
            { $unwind: "$requiredSkills" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$requiredSkills" } } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        // Student's passed assessments
        const passedAssessments = await assessmentResultModel
            .find({ studentId: req.userId, passed: true })
            .select("assessmentTitle percentage verifiedSkillsAdded");

        const possessedSkills: string[] = [];
        const missingSkills: string[] = [];

        topMarketSkills.forEach((ms) => {
            if (studentSkills.some((s) => s.includes(ms._id) || ms._id.includes(s))) {
                possessedSkills.push(ms._id);
            } else {
                missingSkills.push(ms._id);
            }
        });

        const totalMarketEvaluated = topMarketSkills.length || 1;
        const readinessIndex = Math.round((possessedSkills.length / totalMarketEvaluated) * 100);

        return res.status(200).json({
            success: true,
            data: {
                studentName: profile.name,
                readinessIndex,
                possessedSkills,
                missingSkills,
                verifiedAssessmentsCount: passedAssessments.length,
                passedAssessments,
            },
        });
    } catch (error) {
        console.error("getStudentSkillGap error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compute skill gap telemetry",
        });
    }
}
