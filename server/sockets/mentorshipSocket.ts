import type { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import mentorshipModel from "../models/mentorshipModel.js";
import profileModel from "../models/profileModel.js";

// In-memory tracker for active call sessions per pairing
const activeSessions = new Map<string, { startedAt: Date; participants: Set<string> }>();

export function registerMentorshipSocket(io: Server, socket: Socket) {
    const userId = socket.data?.userId as string | undefined;

    /**
     * Join WebRTC video call room for an authorized mentorship pairing
     */
    socket.on("join_call_room", async (data: { pairingId: string }) => {
        try {
            if (!userId) {
                return socket.emit("call_error", { message: "Unauthorized: Session credentials missing." });
            }

            const { pairingId } = data || {};
            if (!pairingId || !mongoose.Types.ObjectId.isValid(pairingId)) {
                return socket.emit("call_error", { message: "Invalid pairing ID specified." });
            }

            const mentorship = await mentorshipModel.findById(pairingId);
            if (!mentorship) {
                return socket.emit("call_error", { message: "Mentorship pairing not found." });
            }

            // Strict socket-level authorization: caller MUST be mentor or mentee
            const isMentor = mentorship.mentorId.toString() === userId;
            const isMentee = mentorship.menteeId.toString() === userId;

            if (!isMentor && !isMentee) {
                return socket.emit("call_error", {
                    message: "Forbidden: You are not an authorized participant in this mentorship session.",
                });
            }

            if (mentorship.status !== "active" && mentorship.status !== "completed") {
                return socket.emit("call_error", {
                    message: `Cannot initiate call. Mentorship pairing status is currently [${mentorship.status}].`,
                });
            }

            const roomName = `mentorship_${pairingId}`;
            await socket.join(roomName);

            // Track active session duration
            if (!activeSessions.has(pairingId)) {
                activeSessions.set(pairingId, {
                    startedAt: new Date(),
                    participants: new Set([userId]),
                });
            } else {
                activeSessions.get(pairingId)!.participants.add(userId);
            }

            const room = io.sockets.adapter.rooms.get(roomName);
            const numClients = room ? room.size : 1;

            // Notify user room joined successfully
            socket.emit("call_room_joined", {
                pairingId,
                role: isMentor ? "mentor" : "mentee",
                peerCount: numClients,
            });

            // If another participant is already present, trigger WebRTC offer exchange
            if (numClients > 1) {
                socket.to(roomName).emit("peer_joined", {
                    userId,
                    role: isMentor ? "mentor" : "mentee",
                });
            }
        } catch (error) {
            console.error("join_call_room socket error:", error);
            socket.emit("call_error", { message: "Internal signaling error." });
        }
    });

    /**
     * WebRTC SDP Offer relay
     */
    socket.on("webrtc_offer", (data: { pairingId: string; sdp: any }) => {
        if (!userId || !data?.pairingId) return;
        const roomName = `mentorship_${data.pairingId}`;
        socket.to(roomName).emit("webrtc_offer", {
            sdp: data.sdp,
            senderId: userId,
        });
    });

    /**
     * WebRTC SDP Answer relay
     */
    socket.on("webrtc_answer", (data: { pairingId: string; sdp: any }) => {
        if (!userId || !data?.pairingId) return;
        const roomName = `mentorship_${data.pairingId}`;
        socket.to(roomName).emit("webrtc_answer", {
            sdp: data.sdp,
            senderId: userId,
        });
    });

    /**
     * WebRTC ICE Candidate relay
     */
    socket.on("webrtc_ice_candidate", (data: { pairingId: string; candidate: any }) => {
        if (!userId || !data?.pairingId) return;
        const roomName = `mentorship_${data.pairingId}`;
        socket.to(roomName).emit("webrtc_ice_candidate", {
            candidate: data.candidate,
            senderId: userId,
        });
    });

    /**
     * In-Call Live Chat Message
     */
    socket.on("call_message", async (data: { pairingId: string; text: string }) => {
        try {
            if (!userId || !data?.pairingId || !data?.text?.trim()) return;

            const roomName = `mentorship_${data.pairingId}`;
            const profile = await profileModel.findOne({ userId });
            const senderName = profile?.name || "Participant";

            io.to(roomName).emit("call_message", {
                id: new mongoose.Types.ObjectId().toString(),
                senderId: userId,
                senderName,
                text: data.text.trim(),
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error("call_message socket error:", error);
        }
    });

    /**
     * Explicit End Call or Hang Up
     */
    socket.on("end_call", async (data: { pairingId: string; durationMinutes?: number }) => {
        try {
            if (!data?.pairingId || !mongoose.Types.ObjectId.isValid(data.pairingId)) return;

            const roomName = `mentorship_${data.pairingId}`;
            const session = activeSessions.get(data.pairingId);
            const duration = data.durationMinutes || (session ? Math.max(1, Math.round((Date.now() - session.startedAt.getTime()) / 60000)) : 1);

            // Persist call session duration in mentorship record
            await mentorshipModel.findByIdAndUpdate(data.pairingId, {
                $push: {
                    callSessions: {
                        callRoomId: data.pairingId,
                        startedAt: session?.startedAt || new Date(Date.now() - duration * 60000),
                        endedAt: new Date(),
                        durationMinutes: duration,
                    },
                },
                $inc: { totalCallDurationMinutes: duration },
            });

            activeSessions.delete(data.pairingId);

            io.to(roomName).emit("call_ended", {
                pairingId: data.pairingId,
                durationMinutes: duration,
            });
        } catch (error) {
            console.error("end_call socket error:", error);
        }
    });

    /**
     * Clean up upon socket disconnect
     */
    socket.on("disconnect", () => {
        // Rooms are automatically cleaned up by Socket.IO
    });
}
