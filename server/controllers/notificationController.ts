import type { Request, Response } from "express";
import notificationModel from "../models/notificationModel.js";

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
