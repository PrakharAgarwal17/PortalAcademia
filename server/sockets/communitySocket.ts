import type { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import communitySpaceModel from "../models/communitySpaceModel.js";
import communityMessageModel from "../models/communityMessageModel.js";
import profileModel from "../models/profileModel.js";

export function registerCommunitySocket(io: Server, socket: Socket) {
    /**
     * Join an Industry/Enterprise Community Space
     */
    socket.on("join_community_space", async (data: { spaceId: string; userId?: string }) => {
        try {
            const effectiveUserId =
                (socket.data?.userId as string | undefined) ||
                data?.userId ||
                (socket.handshake?.auth?.userId as string | undefined);

            if (!effectiveUserId) {
                return socket.emit("community_error", { message: "Unauthorized: Session credentials missing." });
            }

            const { spaceId } = data || {};
            if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) {
                return socket.emit("community_error", { message: "Invalid space ID specified." });
            }

            const space = await communitySpaceModel.findById(spaceId);
            if (!space) {
                return socket.emit("community_error", { message: "Community space not found." });
            }

            // Socket-level authorization: check role and premium entitlement
            const profile = await profileModel.findOne({ userId: effectiveUserId });
            if (!profile) {
                return socket.emit("community_error", { message: "User profile not found." });
            }

            const isStaffOrIndustry = ["faculty", "industry", "institution"].includes(profile.accountType);
            const isPremiumStudent = profile.accountType === "student" && profile.isPremium === true;

            if (!isStaffOrIndustry && !isPremiumStudent) {
                return socket.emit("community_error", {
                    message: "Forbidden: Accessing enterprise community channels requires Premium, Faculty, Industry, or Institution status.",
                });
            }

            // Bind authorized identity to socket instance
            socket.data.userId = effectiveUserId;

            // Ensure member of space
            const userObjId = new mongoose.Types.ObjectId(effectiveUserId);
            const isMember = space.members.some((m) => m.toString() === effectiveUserId);
            if (!isMember) {
                space.members.push(userObjId);
                space.memberCount = space.members.length;
                await space.save();
            }

            const roomName = `community_${spaceId}`;
            await socket.join(roomName);

            socket.emit("community_space_joined", {
                spaceId,
                spaceName: space.name,
                memberCount: space.memberCount,
            });
        } catch (error) {
            console.error("join_community_space error:", error);
            socket.emit("community_error", { message: "Internal space connection error." });
        }
    });

    /**
     * Send Real-Time Community Message
     */
    socket.on("send_community_message", async (data: { spaceId: string; content: string }) => {
        try {
            const uid = socket.data?.userId as string | undefined;
            if (!uid || !data?.spaceId || !data?.content?.trim()) return;

            const { spaceId, content } = data;
            if (!mongoose.Types.ObjectId.isValid(spaceId)) return;

            const profile = await profileModel.findOne({ userId: uid });
            if (!profile) return;

            const isStaffOrIndustry = ["faculty", "industry"].includes(profile.accountType);
            const isPremiumStudent = profile.accountType === "student" && profile.isPremium === true;

            if (!isStaffOrIndustry && !isPremiumStudent) {
                return socket.emit("community_error", {
                    message: "Forbidden: Premium membership or Faculty/Industry standing required to post.",
                });
            }

            const message = await communityMessageModel.create({
                spaceId: new mongoose.Types.ObjectId(spaceId),
                senderId: new mongoose.Types.ObjectId(uid),
                senderName: profile.name,
                senderAvatar: profile.profileImage || profile.image || "",
                senderRole: profile.accountType,
                content: content.trim(),
            });

            const roomName = `community_${spaceId}`;
            io.to(roomName).emit("new_community_message", {
                _id: message._id,
                spaceId: message.spaceId,
                senderId: message.senderId,
                senderName: message.senderName,
                senderAvatar: message.senderAvatar,
                senderRole: message.senderRole,
                content: message.content,
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error("send_community_message error:", error);
        }
    });

    /**
     * Leave Community Space
     */
    socket.on("leave_community_space", async (data: { spaceId: string }) => {
        if (!data?.spaceId) return;
        const roomName = `community_${data.spaceId}`;
        await socket.leave(roomName);
    });
}
