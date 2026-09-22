import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send,
  Users,
  X,
  Loader2,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [spaceId]);

  // Socket setup
  useEffect(() => {
    const s = io(API_BASE, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      auth: {
        userId: currentUserId,
      },
    });
    setSocket(s);

    s.emit("join_community_space", { spaceId, userId: currentUserId });

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
  }, [currentUserId, spaceId]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit("send_community_message", {
      spaceId,
      content: inputText.trim(),
    });
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getInitials = (name?: string) => {
    if (!name) return "PA";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-3 sm:p-6 animate-in fade-in-50">
      <div className="bg-card border border-border w-full max-w-4xl h-[88vh] rounded-md shadow-2xl flex flex-col overflow-hidden">
        {/* Structural Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold text-foreground tracking-tight">{spaceName}</h2>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Gateway</span>
                </span>

                {memberCount !== null && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm border border-border">
                    <Users className="w-3 h-3" />
                    <span>{memberCount} active scholars</span>
                  </span>
                )}
              </div>
            </div>

            {focus && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <span className="text-primary font-semibold">Track:</span>
                <span>{focus}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Close channel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Community Protocol Notice */}
        <div className="px-5 py-1.5 bg-secondary/30 border-b border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Chatham House Rule · Verified Institutional Network · Academic &amp; Engineering Discourse</span>
          </span>
          <span className="hidden sm:inline">Encrypted Signaling</span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs font-mono">
            {error}
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Welcome to {spaceName}</p>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                No discussion entries yet. Initiate the dialogue with fellow researchers, faculty advisors, and industry partners.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              return (
                <div
                  key={m._id}
                  className={cn(
                    "group flex gap-3 max-w-2xl",
                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Avatar Initials Badge */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-sm border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5",
                      isMe
                        ? "bg-primary text-primary-foreground border-primary"
                        : m.senderRole === "industry"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : m.senderRole === "faculty"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                        : "bg-secondary text-foreground border-border"
                    )}
                  >
                    {getInitials(m.senderName)}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={cn(
                      "flex flex-col rounded-md p-3 text-xs border space-y-1.5 shadow-xs relative",
                      isMe
                        ? "bg-primary/10 text-foreground border-primary/30"
                        : "bg-secondary/40 text-foreground border-border"
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px] tracking-tight">
                          {isMe ? "You" : m.senderName}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-xs border font-semibold",
                            m.senderRole === "industry"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : m.senderRole === "faculty"
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30"
                              : isMe
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-secondary text-muted-foreground border-border"
                          )}
                        >
                          {m.senderRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={() => copyMessage(m._id, m.content)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === m._id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-border bg-card flex flex-col gap-2 shrink-0"
        >
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              placeholder="Post a technical query, architecture review, or career opportunity inquiry… (Enter to submit, Shift+Enter for newline)"
              className="w-full bg-background border border-border text-foreground rounded-sm text-xs p-2.5 pr-20 focus:outline-none focus:border-foreground/40 resize-none font-sans"
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">
                {inputText.length}/1000
              </span>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
