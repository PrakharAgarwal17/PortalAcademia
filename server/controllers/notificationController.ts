import type { Request, Response } from "express";
import mongoose from "mongoose";
import notificationModel from "../models/notificationModel.js";
import profileModel from "../models/profileModel.js";

export async function getNotifications(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const page = Math.max(1, parseInt(String(req.query["page"] ?? "1")));
        const limit = Math.min(50, parseInt(String(req.query["limit"] ?? "20")));

        const notifications = await notificationModel
            .find({ userId: userId as any })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const unreadCount = await notificationModel.countDocuments({ userId: userId as any, isRead: false });

        return res.status(200).json({ success: true, notifications, unreadCount });
    } catch (error) {
        console.error("[getNotifications]", error);
        return res.status(500).json({ message: "Failed to fetch notifications.", error });
    }
}

export async function markAsRead(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid notification ID." });
        }

        await notificationModel.findOneAndUpdate(
            { _id: id, userId: userId as any } as any,
            { isRead: true }
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[markAsRead]", error);
        return res.status(500).json({ message: "Failed to mark notification.", error });
    }
}

export async function markAllAsRead(req: Request, res: Response) {
    try {
        const userId = req.userId;
        await notificationModel.updateMany({ userId: userId as any, isRead: false }, { isRead: true });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[markAllAsRead]", error);
        return res.status(500).json({ message: "Failed to mark notifications.", error });
    }
}

/**
 * @description Broadcast an institutional announcement to enrolled students and/or faculty
 * @route POST /api/notifications/broadcast
 * @access Authenticated (Institution)
 */
export async function broadcastAnnouncement(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const institutionProfile = req.userProfile || await profileModel.findOne({ userId });
        if (!institutionProfile || institutionProfile.accountType !== "institution") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only registered academic institutions can broadcast announcements.",
            });
        }

        const instName = institutionProfile.institutionName || institutionProfile.name;
        if (!instName) {
            return res.status(400).json({
                success: false,
                message: "Institution name required on your profile to broadcast announcements.",
            });
        }

        const { title, message, targetAudience = "all" } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ success: false, message: "Announcement title is required." });
        }
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ success: false, message: "Announcement message body is required." });
        }
        if (!["all", "students", "faculty"].includes(targetAudience)) {
            return res.status(400).json({
                success: false,
                message: "Target audience must be 'all', 'students', or 'faculty'.",
            });
        }

        // Scope to affiliated students and/or faculty
        const escapedName = instName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const institutionMatch = {
            $or: [
                { institution: { $regex: new RegExp(escapedName, "i") } },
                { institutionName: { $regex: new RegExp(escapedName, "i") } },
            ],
        };

        let roleFilter: any = { $in: ["student", "faculty"] };
        if (targetAudience === "students") roleFilter = "student";
        if (targetAudience === "faculty") roleFilter = "faculty";

        const recipients = await profileModel
            .find({
                ...institutionMatch,
                accountType: roleFilter,
            })
            .select("userId name accountType")
            .lean();

        const validRecipients = recipients.filter(
            (r) => r.userId && String(r.userId) !== String(userId)
        );

        const cleanTitle = String(title).trim().slice(0, 150);
        const cleanMessage = String(message).trim().slice(0, 2000);

        if (validRecipients.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Announcement saved, but no affiliated recipients were found.",
                recipientCount: 0,
                targetAudience,
            });
        }

        const notificationsToInsert = validRecipients.map((r) => ({
            userId: r.userId,
            type: "general" as const,
            title: `[Campus Notice] ${cleanTitle}`,
            message: cleanMessage,
            metadata: {
                institutionName: instName,
                senderRole: "institution",
                senderId: String(userId),
                targetAudience,
                recipientRole: r.accountType,
            },
            isRead: false,
        }));

        await notificationModel.insertMany(notificationsToInsert);

        return res.status(200).json({
            success: true,
            message: `Announcement successfully broadcast to ${validRecipients.length} campus member(s).`,
            recipientCount: validRecipients.length,
            targetAudience,
        });
    } catch (error) {
        console.error("[broadcastAnnouncement]", error);
        return res.status(500).json({ success: false, message: "Failed to broadcast announcement.", error });
    }
}

/**
 * @description Retrieve broadcast history sent by the institution
 * @route GET /api/notifications/broadcast-history
 * @access Authenticated (Institution)
 */
export async function getBroadcastHistory(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const institutionProfile = req.userProfile || await profileModel.findOne({ userId });
        const instName = institutionProfile?.institutionName || institutionProfile?.name;
        if (!instName) {
            return res.status(200).json({ success: true, broadcasts: [] });
        }

        const broadcasts = await notificationModel.aggregate([
            {
                $match: {
                    "metadata.senderRole": "institution",
                    "metadata.senderId": String(userId),
                },
            },
            {
                $group: {
                    _id: {
                        title: "$title",
                        message: "$message",
                        targetAudience: "$metadata.targetAudience",
                    },
                    createdAt: { $first: "$createdAt" },
                    recipientCount: { $sum: 1 },
                },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
        ]);

        return res.status(200).json({
            success: true,
            broadcasts: broadcasts.map((b) => ({
                title: b._id.title.replace(/^\[Campus Notice\]\s*/, ""),
                message: b._id.message,
                targetAudience: b._id.targetAudience || "all",
                createdAt: b.createdAt,
                recipientCount: b.recipientCount,
            })),
        });
    } catch (error) {
        console.error("[getBroadcastHistory]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch broadcast history.", error });
    }
}

