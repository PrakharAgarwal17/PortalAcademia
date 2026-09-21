import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  AlertTriangle,
  MonitorUp,
  X,
  Send,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MentorshipVideoCallModalProps {
  pairingId: string;
  mentorName: string;
  menteeName: string;
  currentUserId?: string;
  onClose: () => void;
  onCallEnded: (durationMinutes: number) => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // TURN relay fallback for campus/symmetric NAT firewalls
  {
    urls: (import.meta.env.VITE_TURN_URL as string) || "turn:openrelay.metered.ca:80",
    username: (import.meta.env.VITE_TURN_USERNAME as string) || "openrelay",
    credential: (import.meta.env.VITE_TURN_CREDENTIAL as string) || "openrelay",
  },
];

export default function MentorshipVideoCallModal({
  pairingId,
  mentorName,
  menteeName,
  currentUserId,
  onClose,
  onCallEnded,
}: MentorshipVideoCallModalProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0); // in seconds
  const [showChat, setShowChat] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [callStatus, setCallStatus] = useState<string>("Connecting to secure signaling room...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Report state
  const [reportReason, setReportReason] = useState("Unprofessional behavior");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  // Clean shutdown
  const cleanupMediaAndClose = useCallback(
    (durationMins?: number) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socket) {
        socket.emit("end_call", {
          pairingId,
          durationMinutes: durationMins || Math.max(1, Math.round(callDuration / 60)),
        });
        socket.disconnect();
      }
      const finalMins = durationMins || Math.max(1, Math.round(callDuration / 60));
      onCallEnded(finalMins);
      onClose();
    },
    [callDuration, onCallEnded, onClose, pairingId, socket]
  );

  // Initialize WebRTC and Socket.IO
  useEffect(() => {
    const s = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    setSocket(s);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
        setCallStatus("Direct WebRTC peer connection established.");
      }
    };

    // ICE candidates to signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        s.emit("webrtc_ice_candidate", {
          pairingId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setPeerConnected(true);
        setCallStatus("Connected · 1-on-1 Encrypted WebRTC Session");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setPeerConnected(false);
        setCallStatus("Peer disconnected or network changed.");
      }
    };

    // Request local audio & video
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Join room once local stream is ready
        s.emit("join_call_room", { pairingId });
      })
      .catch((err) => {
        console.error("Camera/Mic access error:", err);
        setErrorMessage("Camera or microphone permission was denied. Please grant media access.");
      });

    // Socket signaling listeners
    s.on("call_room_joined", (data: { role: string; peerCount: number }) => {
      if (data.peerCount > 1) {
        setCallStatus("Peer present in room. Negotiating connection...");
      } else {
        setCallStatus("Waiting for peer to connect...");
      }
    });

    s.on("peer_joined", async () => {
      setCallStatus("Peer connected. Creating WebRTC offer...");
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit("webrtc_offer", { pairingId, sdp: offer });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    });

    s.on("webrtc_offer", async (data: { sdp: RTCSessionDescriptionInit }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("webrtc_answer", { pairingId, sdp: answer });
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    });

    s.on("webrtc_answer", async (data: { sdp: RTCSessionDescriptionInit }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error("Error handling WebRTC answer:", err);
      }
    });

    s.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    s.on("call_message", (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    s.on("call_ended", (data: { durationMinutes: number }) => {
      cleanupMediaAndClose(data.durationMinutes);
    });

    s.on("call_error", (data: { message: string }) => {
      setErrorMessage(data.message);
    });

    return () => {
      s.disconnect();
      pc.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [API_BASE, cleanupMediaAndClose, pairingId]);

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (localStreamRef.current && peerConnectionRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender && camTrack) {
        await sender.replaceTrack(camTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  // Send In-Call Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !socket) return;
    socket.emit("call_message", {
      pairingId,
      text: messageInput.trim(),
    });
    setMessageInput("");
  };

  // Submit Misconduct Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason || !reportDetails.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await fetch(`${API_BASE}/api/mentorship/${pairingId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSubmitted(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSubmitted(false);
          setReportDetails("");
        }, 1500);
      } else {
        alert(data.message || "Failed to submit report.");
      }
    } catch {
      alert("Network error while submitting report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-2 sm:p-4 animate-in fade-in-50">
      <div className="relative w-full max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-800 rounded-md flex flex-col overflow-hidden shadow-2xl">
        {/* Top Telemetry Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    peerConnected ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    peerConnected ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </span>
              <span className="text-xs font-semibold text-zinc-100 font-mono tracking-tight">
                {formatDuration(callDuration)}
              </span>
            </div>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-300">
              Advising Session: <strong className="text-zinc-100">{mentorName}</strong> &amp;{" "}
              <strong className="text-zinc-100">{menteeName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-sm border border-red-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Misconduct</span>
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "text-xs p-1.5 rounded-sm border transition-colors cursor-pointer flex items-center gap-1.5",
                showChat
                  ? "bg-zinc-700 border-zinc-600 text-zinc-100"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              )}
              title="Toggle Live Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">In-Call Notes</span>
              {chatMessages.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full font-mono font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Video Stage */}
        <div className="relative flex-1 flex overflow-hidden bg-zinc-950">
          {/* Video Grid */}
          <div className="flex-1 relative flex items-center justify-center p-3 gap-3">
            {/* Remote Peer Video */}
            <div className="relative w-full h-full rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={cn("w-full h-full object-cover", !peerConnected && "hidden")}
              />
              {!peerConnected && (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">{callStatus}</p>
                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Signaling server active. Direct peer-to-peer WebRTC streaming will activate
                      automatically as soon as the counterpart arrives.
                    </p>
                  </div>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500 mt-2" />
                </div>
              )}

              {/* Status Badge Over Remote Video */}
              <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs border border-zinc-700 px-2.5 py-1 rounded-sm text-[10px] font-mono text-zinc-300">
                {peerConnected ? "Remote Peer (Live)" : "Standby"}
              </div>
            </div>

            {/* Local Pip Video */}
            <div className="absolute bottom-6 right-6 w-48 sm:w-60 h-32 sm:h-40 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover -scale-x-100",
                  isVideoOff && "opacity-0"
                )}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs font-mono">
                  Camera Off
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 bg-zinc-950/80 px-1.5 py-0.5 rounded-xs text-[9px] font-mono text-zinc-300">
                You {isMuted && "(Muted)"}
              </div>
            </div>
          </div>

          {/* In-Call Chat Drawer */}
          {showChat && (
            <div className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-150">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
                <span className="text-xs font-semibold text-zinc-200">Session Notes &amp; Code</span>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 rounded-sm hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages list */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-zinc-400 text-[11px] pt-12">
                    Share links, code snippets, or interview questions during the call.
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-2.5 rounded-sm text-xs max-w-[90%]",
                          isMe
                            ? "bg-zinc-800 text-zinc-100 ml-auto border border-zinc-700"
                            : "bg-zinc-950 text-zinc-200 mr-auto border border-zinc-800"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono font-semibold text-zinc-300">
                            {isMe ? "You" : msg.senderName}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono break-all whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-zinc-800 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type notes or paste links..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-hidden focus:border-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-3 py-1.5 rounded-sm bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold disabled:opacity-40 transition-opacity cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Dock */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-center gap-3 shrink-0">
          <button
            onClick={toggleMute}
            className={cn(
              "p-3 rounded-full border transition-all cursor-pointer",
              isMuted
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            )}
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={cn(
              "p-3 rounded-full border transition-all cursor-pointer",
              isVideoOff
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            )}
            title={isVideoOff ? "Start Video" : "Stop Video"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={cn(
              "p-3 rounded-full border transition-all cursor-pointer",
              isScreenSharing
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            )}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <button
            onClick={() => cleanupMediaAndClose()}
            className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-900/20"
            title="Leave & End Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Session</span>
          </button>
        </div>

        {/* Misconduct Report Sub-Modal */}
        {showReportModal && (
          <div className="absolute inset-0 z-50 bg-zinc-950/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-md w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold">Report Session Misconduct</span>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="py-6 text-center text-xs text-emerald-400 font-semibold space-y-1">
                  <p>Misconduct report logged with Trust &amp; Safety team.</p>
                  <p className="text-[11px] text-zinc-400">Institutional review in progress.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300 block">
                      Violation Category
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-sm text-xs px-2.5 py-1.5 focus:outline-hidden"
                    >
                      <option value="Unprofessional behavior">Unprofessional behavior</option>
                      <option value="Harassment or abuse">Harassment or abusive language</option>
                      <option value="Academic dishonesty">Academic dishonesty or cheating</option>
                      <option value="Off-platform solicitation">Commercial or off-platform payment demand</option>
                      <option value="No show or ghosted">Participant no-show</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300 block">
                      Incident Summary
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Detail the occurrence for administrative review..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-sm text-xs p-2.5 focus:outline-hidden resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport || !reportDetails.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingReport && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Submit Misconduct Report</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
