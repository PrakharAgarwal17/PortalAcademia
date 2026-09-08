import type { Request, Response } from "express";
import applicationModel, { type ApplicationStatus } from "../models/applicationModel.js";
import opportunityModel from "../models/opportunityModel.js";
import profileModel from "../models/profileModel.js";
import assessmentResultModel from "../models/assessmentResultModel.js";

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

        const { opportunityId, notes } = req.body;

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

        const application = await applicationModel.create({
            opportunityId,
            applicantId: req.userId,
            applicantName: profile.name || "Candidate",
            applicantEmail: profile.institutionEmail || profile.workEmail || "applicant@portalacademia.ac.in",
            applicantInstitution: profile.institution || profile.institutionName || "Academic Cohort",
            applicantSkills: profile.skills || [],
            matchScore,
            status: "Applied",
            appliedAt: new Date(),
            notes: notes || "",
        });

        // Increment applicant count on opportunity
        opportunity.applicantCount = (opportunity.applicantCount || 0) + 1;
        await opportunity.save();

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
        if (opportunity.createdBy.toString() !== req.userId) {
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
