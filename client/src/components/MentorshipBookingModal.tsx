import { useState } from "react";
import {
  GraduationCap,
  X,
  Star,
  Shield,
  Loader2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export interface MentorProfileForBooking {
  userId: string;
  name: string;
  headline?: string;
  bio?: string;
  profileImage?: string;
  image?: string;
  institution?: string;
  graduationYear?: number;
  skills?: string[];
  mentorBio?: string;
  mentorTopics?: string[];
  rating: number;
  reviewCount: number;
}

interface MentorshipBookingModalProps {
  mentor: MentorProfileForBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pairing: any, message: string) => void;
}

export default function MentorshipBookingModal({
  mentor,
  isOpen,
  onClose,
  onSuccess,
}: MentorshipBookingModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !mentor) return null;

  const topics = mentor.mentorTopics && mentor.mentorTopics.length > 0
    ? mentor.mentorTopics
    : ["System Design & Architecture", "Technical Interview Prep", "Resume & Portfolio Review", "Career Advising"];

  const effectiveTopic = customTopic.trim() || selectedTopic || topics[0];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTopic) {
      setErrorMessage("Please select or specify a focus topic for your session.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/mentorship/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorUserId: mentor.userId,
          focusArea: effectiveTopic,
          notes: sessionNotes.trim(),
          topics: [effectiveTopic],
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(
          data.mentorship,
          `Advising session confirmed with ${mentor.name}! Your direct WebRTC call room is now active.`
        );
        onClose();
      } else {
        setErrorMessage(data.message || "Failed to schedule session. Please try again.");
      }
    } catch {
      setErrorMessage("Network error while connecting to the mentorship service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 animate-in fade-in-50 duration-200">
      <div className="bg-card rounded-md border border-border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-foreground tracking-tight">
                Request 1-on-1 Advising Session
              </h2>
              <p className="text-[10.5px] text-muted-foreground font-mono">
                Direct WebRTC Mentorship Room
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleBooking} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mentor Snapshot Card */}
          <div className="p-3 rounded-md bg-secondary/30 border border-border/80 flex items-start gap-3">
            <div className="w-11 h-11 rounded-sm bg-muted border border-border flex items-center justify-center font-mono font-bold text-foreground shrink-0 overflow-hidden">
              {mentor.profileImage || mentor.image ? (
                <img
                  src={mentor.profileImage || mentor.image}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {mentor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-foreground text-xs truncate">{mentor.name}</h3>
                <div className="flex items-center gap-1 font-mono text-[11px] text-amber-500 shrink-0">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{mentor.rating || 5.0}</span>
                  <span className="text-[10px] text-muted-foreground">({mentor.reviewCount || 0})</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {mentor.headline || mentor.institution || "Verified Senior Scholar"}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-2.5 h-2.5" /> Verified Mentor
                </span>
                {mentor.institution && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    • {mentor.institution}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Focus Area Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Select Primary Focus Area</span>
              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                Choose or specify
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {topics.map((t) => {
                const isSelected = selectedTopic === t && !customTopic;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(t);
                      setCustomTopic("");
                    }}
                    className={cn(
                      "p-2 rounded-sm border text-left font-mono text-[11px] transition-all flex items-center justify-between",
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground font-semibold"
                        : "bg-secondary/20 border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{t}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                type="text"
                placeholder="Or type custom topic (e.g. Mock Interview, Thesis Critique)..."
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  if (e.target.value) setSelectedTopic("");
                }}
                className="w-full px-3 py-1.5 rounded-sm bg-background border border-border text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Goals and Preparation Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                Preparation Notes & Goals
              </span>
              <span className="text-[10px] font-mono text-muted-foreground font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Share your goals, specific questions, or links to your code repository for the mentor to review..."
              className="w-full p-2.5 rounded-sm bg-background border border-border text-foreground text-xs leading-relaxed focus:outline-none focus:border-primary placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* What to Expect Callout */}
          <div className="p-3 rounded-sm bg-muted/40 border border-border/80 space-y-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11.5px]">
              <Video className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant WebRTC Signaling</span>
            </div>
            <p className="leading-relaxed">
              Upon booking, your 30-day advising room will be created immediately. You and {mentor.name} can launch secure 1-on-1 audio/video calls and chat directly through PortalAcademia.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-sm border border-border text-foreground hover:bg-secondary transition-colors font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming Session…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirm Advising Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
