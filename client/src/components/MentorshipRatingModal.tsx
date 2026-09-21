import { useState } from "react";
import { Star, Award, Loader2, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface MentorshipRatingModalProps {
  pairingId: string;
  mentorName: string;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

export default function MentorshipRatingModal({
  pairingId,
  mentorName,
  onClose,
  onRatingSubmitted,
}: MentorshipRatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/mentorship/${pairingId}/rate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedMessage(
          data.certificateIssued
            ? "Rating registered! Certificate of Appreciation & +20 ATS boost awarded to mentor."
            : "Thank you! Your feedback has been recorded."
        );
        setTimeout(() => {
          onRatingSubmitted();
          onClose();
        }, 1800);
      } else {
        setError(data.message || "Failed to submit review.");
      }
    } catch {
      setError("Network error while submitting rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Rate Mentorship Session
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {submittedMessage ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-xs font-bold text-foreground">{submittedMessage}</p>
              <p className="text-[11px] text-muted-foreground">Updating scholar credentials...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-foreground">
                  How was your session with {mentorName}?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ratings provide transparent feedback and qualify senior scholars for verified certificates.
                </p>
              </div>

              {/* Star Rating Selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const active = (hoverRating !== null ? hoverRating : rating) >= val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(val)}
                      className="p-1.5 rounded-sm hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors",
                          active
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground/30 fill-transparent"
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Certificate Alert */}
              <div className="p-3 rounded-sm bg-secondary/50 border border-border flex items-start gap-2.5 text-[11px]">
                <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">
                  Evaluations of <strong className="text-foreground">4.0 or higher</strong> on completed terms award the mentor an official <strong className="text-foreground">Certificate of Appreciation</strong> and a <strong className="text-foreground">+20 ATS Score</strong> profile boost.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {error}
                </div>
              )}

              {/* Feedback Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Detailed Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share specific insights, recommendations, or architecture notes discussed..."
                  className="w-full bg-background border border-border text-foreground rounded-sm text-xs p-2.5 focus:outline-none focus:border-foreground/40 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Later
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Evaluation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
