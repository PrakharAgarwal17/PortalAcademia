import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Users, X, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityChatViewProps {
  spaceId: string;
  spaceName: string;
  focus?: string;
  currentUserId?: string;
  onClose: () => void;
}

interface MessageItem {
  _id: string;
  spaceId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export default function CommunityChatView({
  spaceId,
  spaceName,
  focus,
  currentUserId,
  onClose,
}: CommunityChatViewProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch past messages
  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/community/spaces/${spaceId}/messages`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && isMounted) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("fetchHistory error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [API_BASE, spaceId]);

  // Socket setup
  useEffect(() => {
    const s = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    setSocket(s);

    s.emit("join_community_space", { spaceId });

    s.on("community_space_joined", (data: { memberCount: number }) => {
      setMemberCount(data.memberCount);
    });

    s.on("new_community_message", (msg: MessageItem) => {
      setMessages((prev) => [...prev, msg]);
    });

    s.on("community_error", (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      s.emit("leave_community_space", { spaceId });
      s.disconnect();
    };
  }, [API_BASE, spaceId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit("send_community_message", {
      spaceId,
      content: inputText.trim(),
    });
    setInputText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-3 sm:p-6 animate-in fade-in-50">
      <div className="bg-card border border-border w-full max-w-3xl h-[85vh] rounded-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-foreground tracking-tight">{spaceName}</h2>
              {memberCount !== null && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm border border-border">
                  <Users className="w-3 h-3" />
                  <span>{memberCount} members</span>
                </span>
              )}
            </div>
            {focus && <p className="text-[11px] text-muted-foreground font-mono">{focus}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Welcome to {spaceName}</p>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                No discussion entries yet. Start the conversation with institutional and industry peers.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              return (
                <div
                  key={m._id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-md p-3 text-xs border space-y-1",
                    isMe
                      ? "ml-auto bg-primary text-primary-foreground border-primary/20"
                      : "mr-auto bg-secondary/50 text-foreground border-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px]">{isMe ? "You" : m.senderName}</span>
                      <span
                        className={cn(
                          "text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-xs border",
                          isMe
                            ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                            : m.senderRole === "industry"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : m.senderRole === "faculty"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {m.senderRole}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-mono",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                    {m.content}
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share technical questions, architecture observations, or hiring insights..."
            className="flex-1 bg-background border border-border text-foreground rounded-sm text-xs px-3 py-2 focus:outline-none focus:border-foreground/40"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Post</span>
          </button>
        </form>
      </div>
    </div>
  );
}
