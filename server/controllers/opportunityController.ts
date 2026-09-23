import type { Request, Response } from "express";
import opportunityModel, { type OpportunityCategory, type OpportunityMode } from "../models/opportunityModel.js";
import profileModel from "../models/profileModel.js";
import { getCache, setCache, deleteCache } from "../config/redisClient.js";
import { sendOpportunitySkillMatchAlerts } from "../services/emailAlertService.js";
import { escapeRegex } from "../utils/sanitize.js";

/**
 * @description Fetch active opportunities with filtering by category, mode, domain, and recommendation
 * @route GET /api/opportunities
 * @access Public / Authenticated
 */
export async function getOpportunities(req: Request, res: Response) {
    try {
        const cacheKey = `cache:opportunities:${JSON.stringify(req.query)}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) {
            return res.status(200).json({
                ...cached,
                cached: true,
            });
        }

        const { category, mode, search, targetAudience, recommendedFor, limit = "50", page = "1" } = req.query;
        const filter: any = { status: "active" };

        if (category && category !== "all") {
            const catStr = escapeRegex(String(category).trim());
            filter.category = { $regex: new RegExp(`^${catStr}$`, "i") };
        }

        if (mode && mode !== "all") {
            const modeStr = escapeRegex(String(mode).trim());
            filter.mode = { $regex: new RegExp(`^${modeStr}$`, "i") };
        }

        if (targetAudience && targetAudience !== "all") {
            if (targetAudience === "student") {
                filter.targetAudience = { $ne: "faculty" };
                if (!category || category === "all") {
                    filter.category = { $nin: ["fdp", "sabbatical"] };
                }
            } else if (targetAudience === "faculty") {
                filter.targetAudience = { $ne: "student" };
            } else {
                filter.targetAudience = { $in: [targetAudience, "both"] };
            }
        }

        if (search) {
            const escapedSearch = String(search).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            filter.$or = [
                { title: searchRegex },
                { organization: searchRegex },
                { domain: searchRegex },
                { requiredSkills: { $in: [searchRegex] } },
            ];
        }

        if (recommendedFor === "student" && req.userId) {
            // Filter opportunities recommended by an institution
            filter.recommendedToStudentsBy = { $exists: true, $not: { $size: 0 } };
        } else if (recommendedFor === "faculty" && req.userId) {
            filter.recommendedToFacultyBy = { $exists: true, $not: { $size: 0 } };
        }

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const [opportunities, total] = await Promise.all([
            opportunityModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            opportunityModel.countDocuments(filter),
        ]);

        const responsePayload = {
            success: true,
            count: opportunities.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: opportunities,
        };

        // Cache public feed for 3 minutes
        await setCache(cacheKey, responsePayload, 180);

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error("getOpportunities error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch opportunities",
        });
    }
}

/**
 * @description Fetch single opportunity details
 * @route GET /api/opportunities/:id
 * @access Public / Authenticated
 */
export async function getOpportunityById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.findById(id);

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: opportunity,
        });
    } catch (error) {
        console.error("getOpportunityById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch opportunity",
        });
    }
}

/**
 * @description Fetch opportunities created by the authenticated industry or institution user
 * @route GET /api/opportunities/my-published
 * @access Authenticated (Industry / Institution)
 */
export async function getMyPublishedOpportunities(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const opportunities = await opportunityModel
            .find({ createdBy: req.userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: opportunities.length,
            data: opportunities,
        });
    } catch (error) {
        console.error("getMyPublishedOpportunities error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch published opportunities",
        });
    }
}

/**
 * @description Create / publish a new opportunity
 * @route POST /api/opportunities
 * @access Authenticated (Industry / Institution)
 */
export async function createOpportunity(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const {
            title,
            description,
            category,
            domain,
            location,
            mode,
            duration,
            stipendOrPrize,
            requiredSkills,
            eligibility,
            deadline,
            targetAudience,
        } = req.body;

        const finalCategory = (category || "internship").toString().toLowerCase().trim();
        const finalDomain = domain || "General Technology & Engineering";
        const finalDeadline = deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        if (!title || !description || !finalCategory) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory fields: title, description, and category are required.",
            });
        }

        // Determine organization name from user profile
        let organizationName = "PortalAcademia Partner";
        const profile = await profileModel.findOne({ userId: req.userId });
        if (profile) {
            organizationName =
                profile.companyName ||
                profile.institutionName ||
                profile.name ||
                organizationName;
        }

        const skillsArray = Array.isArray(requiredSkills)
            ? requiredSkills
            : typeof requiredSkills === "string"
            ? requiredSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

        const defaultTargetAudience = ["fdp", "sabbatical"].includes(finalCategory) ? "faculty" : "student";

        const newOpportunity = await opportunityModel.create({
            title,
            description,
            organization: organizationName,
            createdBy: req.userId,
            category: finalCategory,
            domain: finalDomain,
            location: location || "Remote",
            mode: mode || "Remote",
            duration: duration || "Flexible",
            stipendOrPrize: stipendOrPrize || "Certificate / Credits",
            requiredSkills: skillsArray,
            eligibility: eligibility || "Open to all qualified applicants.",
            deadline: finalDeadline,
            targetAudience: targetAudience || defaultTargetAudience,
            status: "active",
        });

        // Invalidate opportunities & analytics cache
        await Promise.all([
            deleteCache("cache:opportunities:*"),
            deleteCache("cache:analytics:market-trends"),
        ]);

        // Asynchronously dispatch skill-matched opportunity alerts in the background
        void sendOpportunitySkillMatchAlerts(newOpportunity);

        return res.status(201).json({
            success: true,
            message: "Opportunity published successfully",
            data: newOpportunity,
        });
    } catch (error: any) {
        console.error("createOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to publish opportunity",
        });
    }
}

/**
 * @description Update an existing opportunity
 * @route PUT /api/opportunities/:id
 * @access Authenticated (Owner / Publisher)
 */
export async function updateOpportunity(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.findById(id);

        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to edit this opportunity",
            });
        }

        const {
            title,
            description,
            category,
            domain,
            location,
            mode,
            duration,
            stipendOrPrize,
            deadline,
            requiredSkills,
            status,
            tags,
            selectionCriteria,
            perks,
        } = req.body;

        const allowedUpdates: Record<string, any> = {};
        if (title !== undefined) allowedUpdates.title = title;
        if (description !== undefined) allowedUpdates.description = description;
        if (category !== undefined) allowedUpdates.category = category;
        if (domain !== undefined) allowedUpdates.domain = domain;
        if (location !== undefined) allowedUpdates.location = location;
        if (mode !== undefined) allowedUpdates.mode = mode;
        if (duration !== undefined) allowedUpdates.duration = duration;
        if (stipendOrPrize !== undefined) allowedUpdates.stipendOrPrize = stipendOrPrize;
        if (deadline !== undefined) allowedUpdates.deadline = deadline;
        if (requiredSkills !== undefined) allowedUpdates.requiredSkills = requiredSkills;
        if (status !== undefined) allowedUpdates.status = status;
        if (tags !== undefined) allowedUpdates.tags = tags;
        if (selectionCriteria !== undefined) allowedUpdates.selectionCriteria = selectionCriteria;
        if (perks !== undefined) allowedUpdates.perks = perks;

        const updated = await opportunityModel.findByIdAndUpdate(id, allowedUpdates, {
            new: true,
            runValidators: true,
        });

        // Invalidate cache
        await Promise.all([
            deleteCache("cache:opportunities:*"),
            deleteCache("cache:analytics:market-trends"),
        ]);

        return res.status(200).json({
            success: true,
            message: "Opportunity updated",
            data: updated,
        });
    } catch (error) {
        console.error("updateOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update opportunity",
        });
    }
}

/**
 * @description Close or delete an opportunity
 * @route DELETE /api/opportunities/:id
 * @access Authenticated (Owner / Publisher)
 */
export async function deleteOpportunity(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.findById(id);

        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (!opportunity.createdBy || opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to delete this opportunity",
            });
        }

        opportunity.status = "closed";
        await opportunity.save();

        // Invalidate cache
        await Promise.all([
            deleteCache("cache:opportunities:*"),
            deleteCache("cache:analytics:market-trends"),
        ]);

        return res.status(200).json({
            success: true,
            message: "Opportunity closed successfully",
        });
    } catch (error) {
        console.error("deleteOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to close opportunity",
        });
    }
}

/**
 * @description Recommend an opportunity to students or faculty
 * @route POST /api/opportunities/:id/recommend
 * @access Authenticated (Institution)
 */
export async function recommendOpportunity(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id } = req.params;
        const { target = "students" } = req.body; // "students" | "faculty"

        const opportunity = await opportunityModel.findById(id);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        // Fetch recommending user's profile to find institution name
        const recommenderProfile = await profileModel.findOne({ userId: req.userId });
        const instName = recommenderProfile?.institutionName || recommenderProfile?.institution || recommenderProfile?.name;

        if (instName) {
            if (!opportunity.recommendedByColleges) {
                opportunity.recommendedByColleges = [];
            }
            if (!opportunity.recommendedByColleges.includes(instName)) {
                opportunity.recommendedByColleges.push(instName);
            }
        }

        const userObjId = req.userId as any;
        if (target === "students") {
            const alreadyRecommended = opportunity.recommendedToStudentsBy.some(
                (uid) => uid.toString() === req.userId
            );
            if (!alreadyRecommended) {
                opportunity.recommendedToStudentsBy.push(userObjId);
            }
        } else if (target === "faculty") {
            const alreadyRecommended = opportunity.recommendedToFacultyBy.some(
                (uid) => uid.toString() === req.userId
            );
            if (!alreadyRecommended) {
                opportunity.recommendedToFacultyBy.push(userObjId);
            }
        }

        await opportunity.save();

        // Invalidate opportunities cache so all feeds reflect this recommendation immediately
        await deleteCache("cache:opportunities:*");

        return res.status(200).json({
            success: true,
            message: `Opportunity successfully recommended to ${target}`,
            data: {
                recommendedToStudentsCount: opportunity.recommendedToStudentsBy.length,
                recommendedToFacultyCount: opportunity.recommendedToFacultyBy.length,
                recommendedByColleges: opportunity.recommendedByColleges,
            },
        });
    } catch (error) {
        console.error("recommendOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to recommend opportunity",
        });
    }
}
