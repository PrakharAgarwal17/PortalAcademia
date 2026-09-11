import opportunityModel, {} from "../models/opportunityModel.js";
import profileModel from "../models/profileModel.js";
/**
 * @description Fetch active opportunities with filtering by category, mode, domain, and recommendation
 * @route GET /api/opportunities
 * @access Public / Authenticated
 */
export async function getOpportunities(req, res) {
    try {
        const { category, mode, search, recommendedFor, limit = "50", page = "1" } = req.query;
        const filter = { status: "active" };
        if (category && category !== "all") {
            filter.category = category;
        }
        if (mode && mode !== "all") {
            filter.mode = mode;
        }
        if (search) {
            const searchRegex = new RegExp(String(search), "i");
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
        }
        else if (recommendedFor === "faculty" && req.userId) {
            filter.recommendedToFacultyBy = { $exists: true, $not: { $size: 0 } };
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [opportunities, total] = await Promise.all([
            opportunityModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            opportunityModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            count: opportunities.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: opportunities,
        });
    }
    catch (error) {
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
export async function getOpportunityById(req, res) {
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
    }
    catch (error) {
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
export async function getMyPublishedOpportunities(req, res) {
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
    }
    catch (error) {
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
export async function createOpportunity(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { title, description, category, domain, location, mode, duration, stipendOrPrize, requiredSkills, eligibility, deadline, } = req.body;
        if (!title || !description || !category || !domain || !deadline) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory fields: title, description, category, domain, deadline are required.",
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
                ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
        const newOpportunity = await opportunityModel.create({
            title,
            description,
            organization: organizationName,
            createdBy: req.userId,
            category,
            domain,
            location: location || "Remote",
            mode: mode || "Remote",
            duration: duration || "Flexible",
            stipendOrPrize: stipendOrPrize || "Certificate / Credits",
            requiredSkills: skillsArray,
            eligibility: eligibility || "Open to all qualified applicants.",
            deadline,
            status: "active",
        });
        return res.status(201).json({
            success: true,
            message: "Opportunity published successfully",
            data: newOpportunity,
        });
    }
    catch (error) {
        console.error("createOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to publish opportunity",
        });
    }
}
/**
 * @description Update an existing opportunity
 * @route PUT /api/opportunities/:id
 * @access Authenticated (Owner / Publisher)
 */
export async function updateOpportunity(req, res) {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.findById(id);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }
        if (opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to edit this opportunity",
            });
        }
        const updated = await opportunityModel.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        return res.status(200).json({
            success: true,
            message: "Opportunity updated",
            data: updated,
        });
    }
    catch (error) {
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
export async function deleteOpportunity(req, res) {
    try {
        const { id } = req.params;
        const opportunity = await opportunityModel.findById(id);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }
        if (opportunity.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to delete this opportunity",
            });
        }
        opportunity.status = "closed";
        await opportunity.save();
        return res.status(200).json({
            success: true,
            message: "Opportunity closed successfully",
        });
    }
    catch (error) {
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
export async function recommendOpportunity(req, res) {
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
        const userObjId = req.userId;
        if (target === "students") {
            const alreadyRecommended = opportunity.recommendedToStudentsBy.some((uid) => uid.toString() === req.userId);
            if (!alreadyRecommended) {
                opportunity.recommendedToStudentsBy.push(userObjId);
            }
        }
        else if (target === "faculty") {
            const alreadyRecommended = opportunity.recommendedToFacultyBy.some((uid) => uid.toString() === req.userId);
            if (!alreadyRecommended) {
                opportunity.recommendedToFacultyBy.push(userObjId);
            }
        }
        await opportunity.save();
        return res.status(200).json({
            success: true,
            message: `Opportunity successfully recommended to ${target}`,
            data: {
                recommendedToStudentsCount: opportunity.recommendedToStudentsBy.length,
                recommendedToFacultyCount: opportunity.recommendedToFacultyBy.length,
            },
        });
    }
    catch (error) {
        console.error("recommendOpportunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to recommend opportunity",
        });
    }
}
//# sourceMappingURL=opportunityController.js.map