import type { Request, Response } from "express";
import mongoose from "mongoose";
import communitySpaceModel from "../models/communitySpaceModel.js";
import communityMessageModel from "../models/communityMessageModel.js";
import profileModel from "../models/profileModel.js";

/**
 * @description List all technical enterprise community spaces
 * @route GET /api/community/spaces
 * @access Authenticated
 */
export async function getSpaces(req: Request, res: Response) {
    try {
        const spaces = await communitySpaceModel.find().sort({ memberCount: -1 }).lean();

        const userId = req.userId;
        const formatted = spaces.map((space) => ({
            ...space,
            isJoined: userId ? space.members.some((m) => m.toString() === userId) : false,
        }));

        return res.status(200).json({
            success: true,
            spaces: formatted,
        });
    } catch (error) {
        console.error("getSpaces error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch spaces." });
    }
}

/**
 * @description Join an enterprise community space (Requires Premium for students; Free for faculty & industry)
 * @route POST /api/community/spaces/:id/join
 * @access Authenticated
 */
export async function joinSpace(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid space ID." });
        }

        const space = await communitySpaceModel.findById(id);
        if (!space) {
            return res.status(404).json({ success: false, message: "Community space not found." });
        }

        // Validate Role and Premium Entitlement
        const profile = await profileModel.findOne({ userId: req.userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        const isPrivilegedRole = ["faculty", "industry", "institution"].includes(profile.accountType);
        const isPremiumStudent = profile.accountType === "student" && profile.isPremium === true;

        if (!isPrivilegedRole && !isPremiumStudent) {
            return res.status(403).json({
                success: false,
                message: "Accessing technical enterprise spaces requires an active Premium membership for students.",
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(req.userId);
        const alreadyMember = space.members.some((m) => m.toString() === req.userId);

        if (!alreadyMember) {
            space.members.push(userIdObj);
            space.memberCount = space.members.length;
            await space.save();
        }

        return res.status(200).json({
            success: true,
            message: "Successfully joined technical space.",
            space,
        });
    } catch (error) {
        console.error("joinSpace error:", error);
        return res.status(500).json({ success: false, message: "Failed to join space." });
    }
}

/**
 * @description Retrieve recent chat history for a community space
 * @route GET /api/community/spaces/:id/messages
 * @access Authenticated
 */
export async function getSpaceMessages(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid space ID." });
        }

        const space = await communitySpaceModel.findById(id);
        if (!space) {
            return res.status(404).json({ success: false, message: "Space not found." });
        }

        const messages = await communityMessageModel
            .find({ spaceId: new mongoose.Types.ObjectId(id) })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("getSpaceMessages error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch space messages." });
    }
}

/**
 * @description Create a technical community space
 * @route POST /api/community/spaces
 * @access Authenticated (Industry / Faculty / Admin)
 */
export async function createSpace(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const { name, description, industry, focus } = req.body;
        if (!name || !description || !industry) {
            return res.status(400).json({ success: false, message: "Name, description, and industry are required." });
        }

        const space = await communitySpaceModel.create({
            name: String(name).trim(),
            description: String(description).trim(),
            industry: String(industry).trim(),
            focus: focus ? String(focus).trim() : "",
            creatorId: new mongoose.Types.ObjectId(req.userId),
            members: [new mongoose.Types.ObjectId(req.userId)],
            memberCount: 1,
        });

        return res.status(201).json({
            success: true,
            message: "Community space created successfully.",
            space,
        });
    } catch (error) {
        console.error("createSpace error:", error);
        return res.status(500).json({ success: false, message: "Failed to create space." });
    }
}
