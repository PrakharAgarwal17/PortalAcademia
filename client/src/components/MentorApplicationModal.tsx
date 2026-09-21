import { useState } from "react";
import { GraduationCap, ShieldCheck, Loader2, X, Check } from "lucide-react";

interface MentorApplicationModalProps {
  onClose: () => void;
  onApplicationSuccess: () => void;
  defaultBio?: string;
  defaultTopics?: string[];
}

export default function MentorApplicationModal({
  onClose,
  onApplicationSuccess,
  defaultBio = "",
  defaultTopics = [],
}: MentorApplicationModalProps) {
  const [bio, setBio] = useState(defaultBio);
  const [topicsInput, setTopicsInput] = useState(defaultTopics.join(", "));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must accept the Mentor Terms & Conditions and Honor Code to proceed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const topicsArray = topicsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/api/mentorship/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorBio: bio.trim(),
          mentorTopics: topicsArray,
          mentorTermsAccepted: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onApplicationSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to register mentor privileges.");
      }
    } catch {
      setError("Network error while submitting application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Register as a Senior Peer Mentor
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-1 text-xs">
            <p className="font-semibold text-foreground">
              Senior Scholars &amp; Final-Year Mentorship (Free Registration)
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              4th-year scholars and verified skill holders apply for free without requiring a Premium
              subscription. Guide junior peers in architecture reviews, research direction, and interview prep.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground block">
              Advising Bio &amp; Technical Focus
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. 4th Year CS at IIT Delhi · Specializing in High-Throughput Distributed Systems and Rust. Happy to review system architectures and conduct mock technical rounds."
              className="w-full bg-background border border-border text-foreground rounded-sm text-xs p-2.5 focus:outline-none focus:border-foreground/40 resize-none"
              required
            />
          </div>

          {/* Topics */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground block">
              Advisory Topics (comma-separated)
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="Distributed Systems, Go, React 19, LeetCode / DSA, Resume Review"
              className="w-full bg-background border border-border text-foreground rounded-sm text-xs px-2.5 py-2 focus:outline-none focus:border-foreground/40"
              required
            />
          </div>

          {/* Mentor Terms & Conditions / Honor Code */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Mentor Code of Conduct &amp; Platform Terms</span>
            </div>

            <div className="rounded-sm border border-border bg-background p-3 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed font-mono">
              <p>• <strong>Free Service:</strong> Mentors strictly cannot solicit off-platform fees or payments from mentees.</p>
              <p>• <strong>Integrity &amp; Safety:</strong> No academic dishonesty, assignment ghostwriting, or abusive communication.</p>
              <p>• <strong>Punctuality:</strong> Attend scheduled WebRTC sessions; repeated no-shows result in privilege revocation.</p>
              <p>• <strong>Credential Verification:</strong> Completed pairings with &ge;4.0 ratings grant verified Certificates of Appreciation.</p>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded-sm accent-primary cursor-pointer"
              />
              <span className="text-[11px] text-foreground leading-tight">
                I accept the PortalAcademia Mentor Terms &amp; Conditions and pledge to uphold the Peer Honor Code.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Complete Mentor Registration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
