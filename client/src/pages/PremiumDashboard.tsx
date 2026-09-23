import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Crown,
  Sparkles,
  Mail,
  Star,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  Zap,
  Building2,
  GitMerge,
  Shield,
  GraduationCap,
  AlertCircle,
  ExternalLink,
  Search,
  Award,
  X,
  Printer,
  Check,
  Video,
  PhoneCall,
  AlertTriangle,
  Users,
  TrendingUp,
  GitPullRequest,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";
import Navbar from "@/components/Navbar";
import MentorshipVideoCallModal, { forceStopAllHardwareMedia } from "@/components/MentorshipVideoCallModal";
import MentorshipRatingModal from "@/components/MentorshipRatingModal";
import MentorApplicationModal from "@/components/MentorApplicationModal";
import MentorshipBookingModal from "@/components/MentorshipBookingModal";
import CommunityChatView from "@/components/CommunityChatView";
import { API_BASE } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MembershipStatus {
  isPremium: boolean;
  hasUsedTrial: boolean;
  membership: {
    planType: "trial" | "premium";
    amount: number;
    expiresAt: string;
    status: string;
  } | null;
}

interface UserProfile {
  _id?: string;
  userId?: string;
  name: string;
  profileImage?: string;
  accountType: string;
  academicYear?: string;
  graduationYear?: number;
  bio?: string;
  skills?: string[];
  isMentor?: boolean;
  isMentorVerified?: boolean;
  mentorBio?: string;
  mentorTopics?: string[];
  atsBoostPoints?: number;
}

interface MentorProfile {
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
  atsBoostPoints?: number;
  rating: number;
  reviewCount: number;
}

interface MentorshipPairing {
  _id: string;
  mentorId: string;
  menteeId: string;
  status: "pending" | "active" | "completed" | "cancelled" | "declined";
  startDate: string;
  targetEndDate: string;
  completedAt?: string;
  notes?: string;
  topics: string[];
  callSessions: Array<{
    callRoomId: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes: number;
  }>;
  totalCallDurationMinutes: number;
  menteeRating?: number | null;
  menteeFeedback?: string;
  ratedAt?: string | null;
  certificateIssued: boolean;
  certificateId?: string | null;
  mentor?: {
    userId: string;
    name: string;
    headline?: string;
    profileImage?: string;
    institution?: string;
  };
  mentee?: {
    userId: string;
    name: string;
    headline?: string;
    profileImage?: string;
    institution?: string;
  };
  isUserMentor: boolean;
  requiresReview: boolean;
}

interface CommunitySpace {
  _id: string;
  name: string;
  description: string;
  industry: string;
  focus?: string;
  memberCount: number;
  isJoined?: boolean;
}

interface OpenSourceProject {
  _id: string;
  companyName: string;
  title: string;
  description: string;
  repoUrl: string;
  repoFullName: string;
  techStack: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  openIssuesCount?: number;
  createdAt: string;
}

interface StudentContribution {
  _id: string;
  projectId: {
    _id: string;
    title: string;
    companyName: string;
    repoUrl: string;
    techStack?: string[];
  } | null;
  prUrl: string;
  prTitle: string;
  prNumber: number;
  mergedAt: string;
  certificateIssued: boolean;
  certificateIssuedAt?: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Feature Card (Anti-Slop Enterprise) ───────────────────────────────────────

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  locked?: boolean;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  onClick,
  locked,
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        "group relative w-full text-left rounded-md border border-border bg-card p-4 flex flex-col gap-2.5 transition-colors",
        locked
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-primary/40 hover:bg-secondary/40 cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-foreground border border-border">
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground tracking-tight mb-1">
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {!locked && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-foreground mt-auto pt-1">
          <span>Open module</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </button>
  );
}

// ─── Payment Modal (Swiss Anti-Slop) ───────────────────────────────────────────

interface PaymentModalProps {
  onClose: () => void;
  hasUsedTrial: boolean;
}

const PREMIUM_FEATURES = [
  "1-on-1 industry mentorship and resume critiques",
  "Access to verified company open-source repositories",
  "Automated webhook verification for merged GitHub PRs",
  "Platform-certified credential issuance upon PR merge",
  "Join exclusive enterprise and recruiter community channels",
  "Priority placement notification alerts and digests",
];

function PaymentModal({ onClose, hasUsedTrial }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartTrial() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "trial" }),
      });
      const data = (await res.json()) as {
        success: boolean;
        isTrial: boolean;
        message?: string;
      };
      if (data.success) {
        window.location.reload();
      } else {
        setError(data.message ?? "Could not start trial. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBuyPremium() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "premium" }),
      });
      const data = (await res.json()) as {
        success: boolean;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        message?: string;
      };

      if (!data.success || !data.orderId) {
        setError(data.message ?? "Could not create order. Please try again.");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "PortalAcademia",
        description: "Premium Membership — ₹200 / 30 days",
        order_id: data.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = (await verifyRes.json()) as { success: boolean };
          if (verifyData.success) {
            window.location.reload();
          } else {
            setError("Payment signature verification failed. Please contact support.");
          }
        },
        theme: { color: "#111827" },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setError("Network error while connecting to payment provider.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in-50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              PortalAcademia Premium Membership
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-sm border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Included Features Grid */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Subscription Entitlements
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PREMIUM_FEATURES.map((feat) => (
                <div key={feat} className="flex items-start gap-2 text-foreground/85">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Free Trial Card */}
            {!hasUsedTrial ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Complimentary
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">7 Days</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">7-Day Free Trial</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    One-time trial with full platform privileges. No card required.
                  </p>
                </div>
                <button
                  onClick={handleStartTrial}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 bg-foreground text-background text-xs font-semibold py-2 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Activate Trial</span>
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/20 p-3.5 flex flex-col justify-center gap-1 text-center">
                <span className="text-xs font-semibold text-muted-foreground">Free Trial Expended</span>
                <span className="text-[10px] text-muted-foreground">One-time trial used</span>
              </div>
            )}

            {/* Paid 30-Day Plan */}
            <div className="rounded-md border border-border bg-card p-3.5 flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                    Full Pass
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">30 Days</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-foreground">₹200</span>
                  <span className="text-[11px] text-muted-foreground">/ 30 days</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  Unrestricted access to open-source repos & certificates.
                </p>
              </div>
              <button
                onClick={handleBuyPremium}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                <span>Subscribe · ₹200</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Locked Feature Banner ─────────────────────────────────────────────────────

function PremiumLockedBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-md border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
      <div className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center">
        <Crown className="w-4 h-4 text-amber-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">
          Premium Membership Required
        </p>
        <p className="text-[11px] text-muted-foreground max-w-sm mt-0.5 leading-relaxed">
          Access to company open-source repositories, automated pull request verification,
          and certified credentials requires an active membership.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors cursor-pointer"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span>Upgrade · ₹200 / 30 Days</span>
      </button>
    </div>
  );
}

// ─── Certificate Credential Modal ──────────────────────────────────────────────

interface CertificateModalProps {
  contribution: StudentContribution;
  studentName: string;
  onClose: () => void;
}

function CertificateModal({ contribution, studentName, onClose }: CertificateModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-foreground">Verified Credential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary text-xs flex items-center gap-1"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Card Content */}
        <div className="p-8 space-y-6 text-center bg-card border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-secondary border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>PortalAcademia Verified Open-Source Credential</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Certificate of Open Source Achievement
            </h2>
            <p className="text-xs text-muted-foreground">
              This credential certifies that
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-1 inline-block min-w-[240px]">
              {studentName}
            </h3>
          </div>

          <p className="text-xs text-foreground/80 max-w-md mx-auto leading-relaxed">
            has successfully contributed and merged verified code to the project{" "}
            <span className="font-semibold text-foreground">
              {contribution.projectId?.title || "Industry Repository"}
            </span>{" "}
            hosted by{" "}
            <span className="font-semibold text-foreground">
              {contribution.projectId?.companyName || "Industry Partner"}
            </span>{" "}
            via Pull Request #{contribution.prNumber}.
          </p>

          <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-left text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px] font-mono uppercase">
                Verification Date
              </span>
              <span className="font-mono text-foreground">
                {contribution.certificateIssuedAt
                  ? formatDate(contribution.certificateIssuedAt)
                  : formatDate(contribution.mergedAt)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-mono uppercase">
                GitHub Pull Request
              </span>
              <a
                href={contribution.prUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono inline-flex items-center gap-1"
              >
                PR #{contribution.prNumber} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>ID: {contribution._id.slice(-10).toUpperCase()}</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Cryptographically Verified
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mentorship Certificate Modal ─────────────────────────────────────────────

interface MentorshipCertificateModalProps {
  pairing: MentorshipPairing;
  recipientName: string;
  onClose: () => void;
}

function MentorshipCertificateModal({
  pairing,
  recipientName,
  onClose,
}: MentorshipCertificateModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const isMentor = pairing.isUserMentor;
  const otherPerson = isMentor ? pairing.mentee : pairing.mentor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-foreground">Verified Credential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary text-xs flex items-center gap-1 cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Card Content */}
        <div className="p-8 space-y-6 text-center bg-card border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-secondary border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>PortalAcademia Senior Scholar Credential</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
              {isMentor ? "Certificate of Mentorship Excellence" : "Certificate of Technical Mentorship Completion"}
            </h2>
            <p className="text-xs text-muted-foreground">
              This credential is awarded in recognition of academic and technical advising
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-1 inline-block min-w-[240px]">
              {recipientName}
            </h3>
          </div>

          <p className="text-xs text-foreground/80 max-w-md mx-auto leading-relaxed">
            {isMentor ? (
              <>
                for demonstrated technical leadership and advising provided to{" "}
                <span className="font-semibold text-foreground">{otherPerson?.name || "Junior Scholar"}</span> in{" "}
                <span className="font-semibold text-foreground">{(pairing.topics || ["Software Engineering"]).join(", ")}</span>{" "}
                logging <span className="font-semibold text-foreground">{pairing.totalCallDurationMinutes} minutes</span> of verified 1-on-1 collaboration.
              </>
            ) : (
              <>
                for successfully completing senior scholar technical advising with{" "}
                <span className="font-semibold text-foreground">{otherPerson?.name || "Senior Mentor"}</span> in{" "}
                <span className="font-semibold text-foreground">{(pairing.topics || ["Software Engineering"]).join(", ")}</span>{" "}
                logging <span className="font-semibold text-foreground">{pairing.totalCallDurationMinutes} minutes</span> of verified collaboration.
              </>
            )}
          </p>

          <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-left text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px] font-mono uppercase">
                Verification Date
              </span>
              <span className="font-mono text-foreground">
                {pairing.completedAt ? formatDate(pairing.completedAt) : formatDate(pairing.startDate)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-mono uppercase">
                Advising Session
              </span>
              <span className="font-mono text-foreground">
                {pairing.totalCallDurationMinutes} mins · {pairing.menteeRating ? `${pairing.menteeRating}★ Rating` : "Verified"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>ID: {(pairing.certificateId || pairing._id).slice(-12).toUpperCase()}</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Cryptographically Verified
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "overview" | "opensource" | "mentors" | "communities" | "digest";
type MentorSubTab = "directory" | "sessions" | "studio";

export default function PremiumDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab") as ActiveTab | null;
  const activeTab: ActiveTab =
    rawTab && ["overview", "opensource", "mentors", "communities", "digest"].includes(rawTab)
      ? rawTab
      : "overview";

  const rawSub = searchParams.get("sub") as MentorSubTab | null;
  const mentorSubTab: MentorSubTab =
    rawSub && ["directory", "sessions", "studio"].includes(rawSub) ? rawSub : "directory";

  const setActiveTab = (tab: ActiveTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      if (tab !== "mentors") {
        next.delete("sub");
      }
      return next;
    });
  };

  const setMentorSubTab = (sub: MentorSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "mentors");
      next.set("sub", sub);
      return next;
    });
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Open source state
  const [ossProjects, setOssProjects] = useState<OpenSourceProject[]>([]);
  const [myContributions, setMyContributions] = useState<StudentContribution[]>([]);
  const [isLoadingOss, setIsLoadingOss] = useState(false);
  const [ossDifficultyFilter, setOssDifficultyFilter] = useState<string>("all");
  const [ossSearchQuery, setOssSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState<StudentContribution | null>(null);

  // Redux & GitHub PR Verification State
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyProjectId, setVerifyProjectId] = useState("");
  const [verifyPrUrl, setVerifyPrUrl] = useState("");
  const [isVerifyingPr, setIsVerifyingPr] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [isUnlinkingGithub, setIsUnlinkingGithub] = useState(false);
  const [githubNotice, setGithubNotice] = useState<string | null>(null);

  // Mentorship state
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [myPairings, setMyPairings] = useState<MentorshipPairing[]>([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [mentorSearchQuery, setMentorSearchQuery] = useState("");
  const [mentorTopicFilter, setMentorTopicFilter] = useState("all");
  const [sessionRoleFilter, setSessionRoleFilter] = useState<"all" | "mentee" | "mentor">("all");
  const [bookingMentor, setBookingMentor] = useState<MentorProfile | null>(null);
  const [selectedMentorshipCert, setSelectedMentorshipCert] = useState<MentorshipPairing | null>(null);
  const [activeCallPairing, setActiveCallPairing] = useState<MentorshipPairing | null>(null);
  const [activeRatingPairing, setActiveRatingPairing] = useState<MentorshipPairing | null>(null);
  const [showMentorApplyModal, setShowMentorApplyModal] = useState(false);
  const [mentorshipAlert, setMentorshipAlert] = useState<string | null>(null);

  // Community state
  const [communitySpaces, setCommunitySpaces] = useState<CommunitySpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [activeChatSpace, setActiveChatSpace] = useState<CommunitySpace | null>(null);
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [selectedCommunityIndustry, setSelectedCommunityIndustry] = useState<string>("all");

  const isPremium = membership?.isPremium === true;

  // Derived mentor stats (computed from myPairings — no extra fetch)
  const mentorSessions = myPairings.filter((p) => p.isUserMentor);
  const menteeSessions = myPairings.filter((p) => !p.isUserMentor);
  const satisfiedMentees = mentorSessions.filter((p) => p.menteeRating && p.menteeRating >= 4).length;
  const mentorCertsEarned = mentorSessions.filter((p) => p.certificateIssued).length;
  const activeMenteeSessions = mentorSessions.filter((p) => p.status === "active").length;
  const totalMinutesAdvised = mentorSessions.reduce((acc, p) => acc + (p.totalCallDurationMinutes || 0), 0);

  // Hardware safety: terminate any lingering camera/microphone streams on unmount
  useEffect(() => {
    return () => {
      forceStopAllHardwareMedia();
    };
  }, []);

  // Listen for GitHub OAuth return query parameters
  useEffect(() => {
    const ghStatus = searchParams.get("github");
    const ghError = searchParams.get("error");
    if (ghStatus === "connected") {
      setGithubNotice("GitHub account linked successfully! Your commits and merged PRs are now verified.");
      dispatch(checkAuthThunk());
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("github");
        next.delete("username");
        return next;
      });
    } else if (ghError === "github_link_failed") {
      setGithubNotice("Failed to link GitHub account. It may already be linked to another profile.");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("error");
        return next;
      });
    }
  }, [searchParams, dispatch, setSearchParams]);

  const handleVerifyPr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyProjectId || !verifyPrUrl.trim()) {
      setVerifyError("Please select a partner repository and provide the Pull Request URL.");
      return;
    }
    setIsVerifyingPr(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/opensource/verify-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId: verifyProjectId,
          prUrl: verifyPrUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.message || "Failed to verify pull request.");
      } else {
        setVerifySuccess(data.message || "Pull request verified and recorded successfully!");
        setVerifyPrUrl("");
        await fetchOpenSourceData();
        setTimeout(() => {
          setIsVerifyModalOpen(false);
          setVerifySuccess(null);
        }, 2200);
      }
    } catch {
      setVerifyError("Network error while verifying pull request. Please try again.");
    } finally {
      setIsVerifyingPr(false);
    }
  };

  const handleUnlinkGithub = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect your GitHub account? Pull requests will no longer be attributed until you reconnect."
      )
    ) {
      return;
    }
    setIsUnlinkingGithub(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/unlink`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        dispatch(checkAuthThunk());
        setGithubNotice("GitHub account disconnected.");
      } else {
        const data = await res.json().catch(() => ({}));
        setGithubNotice(data.message || "Failed to unlink GitHub account.");
      }
    } catch {
      setGithubNotice("Failed to unlink GitHub account.");
    } finally {
      setIsUnlinkingGithub(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, membershipRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/me`, { credentials: "include" }),
        fetch(`${API_BASE}/api/payment/status`, { credentials: "include" }),
      ]);
      const profileData = (await profileRes.json()) as { success: boolean; profile: UserProfile };
      const membershipData = (await membershipRes.json()) as MembershipStatus;
      if (profileData.success) setProfile(profileData.profile);
      setMembership(membershipData);
    } catch (err) {
      console.error("PremiumDashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMentorshipData = useCallback(async () => {
    setIsLoadingMentors(true);
    try {
      const [mentorsRes, pairingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/mentorship/mentors`, { credentials: "include" }),
        fetch(`${API_BASE}/api/mentorship/my-pairings`, { credentials: "include" }),
      ]);
      const mentorsData = await mentorsRes.json();
      const pairingsData = await pairingsRes.json();
      if (mentorsData.success) setMentors(mentorsData.mentors || []);
      if (pairingsData.success) setMyPairings(pairingsData.pairings || []);
    } catch (err) {
      console.error("fetchMentorshipData error:", err);
    } finally {
      setIsLoadingMentors(false);
    }
  }, []);

  const fetchCommunitySpaces = useCallback(async () => {
    setIsLoadingSpaces(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/spaces`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCommunitySpaces(data.spaces || []);
    } catch (err) {
      console.error("fetchCommunitySpaces error:", err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    void fetchMentorshipData();
    void fetchCommunitySpaces();
  }, [fetchData, fetchMentorshipData, fetchCommunitySpaces]);

  // Fetch Open Source data if premium
  const fetchOpenSourceData = useCallback(async () => {
    if (!isPremium) return;
    setIsLoadingOss(true);
    try {
      const [projRes, contribRes] = await Promise.all([
        fetch(`${API_BASE}/api/opensource/projects`, { credentials: "include" }),
        fetch(`${API_BASE}/api/opensource/contributions/me`, { credentials: "include" }),
      ]);
      const projData = await projRes.json();
      const contribData = await contribRes.json();
      if (projData.success) setOssProjects(projData.projects || []);
      if (contribData.success) setMyContributions(contribData.contributions || []);
    } catch (err) {
      console.error("Open source fetch error:", err);
    } finally {
      setIsLoadingOss(false);
    }
  }, [isPremium]);

  useEffect(() => {
    if (activeTab === "opensource" && isPremium) {
      void fetchOpenSourceData();
    }
    if (activeTab === "mentors") {
      void fetchMentorshipData();
    }
    if (activeTab === "communities") {
      void fetchCommunitySpaces();
    }
  }, [activeTab, isPremium, fetchOpenSourceData, fetchMentorshipData, fetchCommunitySpaces]);

  // Razorpay script loader
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const sidebarItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    premiumOnly: boolean;
  }> = [
    { id: "overview", label: "Overview", icon: Sparkles, premiumOnly: false },
    { id: "opensource", label: "Open Source Projects", icon: GitMerge, premiumOnly: true },
    { id: "mentors", label: "Find a Mentor", icon: GraduationCap, premiumOnly: true },
    { id: "communities", label: "Enterprise Spaces", icon: Building2, premiumOnly: true },
    { id: "digest", label: "Email Digest", icon: Mail, premiumOnly: true },
  ];

  const filteredOssProjects = ossProjects.filter((p) => {
    const matchesDifficulty =
      ossDifficultyFilter === "all" || p.difficulty === ossDifficultyFilter;
    const matchesSearch =
      !ossSearchQuery ||
      p.title.toLowerCase().includes(ossSearchQuery.toLowerCase()) ||
      p.companyName.toLowerCase().includes(ossSearchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(ossSearchQuery.toLowerCase()));
    return matchesDifficulty && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar userName={profile?.name} userRole="student" profileId={profile?._id} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar userName={profile?.name} userRole="student" profileId={profile?._id} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-card shrink-0">
          <div className="px-4 py-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground tracking-tight leading-none truncate">
                  Premium Suite
                </p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1 leading-none truncate">
                  Enterprise Tier
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 p-2 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.premiumOnly && !isPremium;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium w-full text-left transition-colors cursor-pointer",
                    isActive
                      ? "bg-secondary text-foreground font-semibold border-l-2 border-primary"
                      : isLocked
                      ? "text-muted-foreground/60 hover:bg-secondary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isLocked && (
                    <Crown className="w-2.5 h-2.5 ml-auto text-amber-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Status Card */}
          <div className="p-3 border-t border-border">
            {isPremium && membership?.membership ? (
              <div className="rounded-sm bg-secondary/50 border border-border p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {daysUntil(membership.membership.expiresAt)}d left
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground capitalize">
                  {membership.membership.planType} Plan
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Exp: {formatDate(membership.membership.expiresAt)}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Upgrade · ₹200</span>
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Viewport ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Active Status Header Strip */}
          {isPremium && membership?.membership && (
            <div className="border-b border-border bg-card px-4 lg:px-8 py-2.5">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Premium Active
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    Expires {formatDate(membership.membership.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>{daysUntil(membership.membership.expiresAt)} days remaining</span>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
            {/* Pending Review Alert — shown to mentees who completed a call and haven't rated yet */}
            {myPairings.some((p) => p.requiresReview) && (
              <div className="p-3.5 rounded-md bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in-50">
                <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Pending Session Review:</strong> You completed a 1-on-1 mentorship call. Please submit your evaluation to help your mentor earn their session certificate.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const unreviewed = myPairings.find((p) => p.requiresReview);
                    if (unreviewed) setActiveRatingPairing(unreviewed);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 text-zinc-950 font-semibold text-xs rounded-sm hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
                >
                  Rate Session Now
                </button>
              </div>
            )}

            {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
            {activeTab === "overview" && (
              <>
                {/* Non-premium Callout */}
                {!isPremium && (
                  <div className="rounded-md border border-border bg-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-secondary border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span>Enterprise Candidate Tier</span>
                      </div>
                      <h1 className="text-base font-bold tracking-tight text-foreground">
                        PortalAcademia Premium Membership
                      </h1>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Access verified open-source repositories from partner companies, get automatic PR verification via GitHub webhooks, earn platform credentials, and connect with senior industry mentors.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-sm hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Activate Membership · ₹200</span>
                    </button>
                  </div>
                )}

                {/* Metrics Bento Row */}
                {isPremium && membership?.membership && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-md border border-border bg-card p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] font-medium uppercase tracking-wide">Active Plan</span>
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <p className="text-lg font-bold font-mono text-foreground capitalize">
                        {membership.membership.planType}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        ₹{membership.membership.amount} · {formatDate(membership.membership.expiresAt)}
                      </p>
                    </div>

                    <div className="rounded-md border border-border bg-card p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] font-medium uppercase tracking-wide">OSS PRs Merged</span>
                        <GitMerge className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <p className="text-lg font-bold font-mono text-foreground tabular-nums">
                        {myContributions.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Tracked via GitHub</p>
                    </div>

                    <div className="rounded-md border border-border bg-card p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] font-medium uppercase tracking-wide">Certificates</span>
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <p className="text-lg font-bold font-mono text-foreground tabular-nums">
                        {myContributions.filter((c) => c.certificateIssued).length}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Company issued</p>
                    </div>

                    <div className="rounded-md border border-border bg-card p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] font-medium uppercase tracking-wide">Mentorship</span>
                        <GraduationCap className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {profile?.isMentor
                          ? satisfiedMentees > 0
                            ? `${satisfiedMentees} Satisfied`
                            : activeMenteeSessions > 0
                            ? `${activeMenteeSessions} Active`
                            : "Mentor"
                          : myPairings.length > 0
                          ? `${myPairings.length} Session${myPairings.length !== 1 ? "s" : ""}`
                          : "Available"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {profile?.isMentor ? "Mentee ratings ≥4★" : "Senior 1-on-1 slots"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Modules Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Included Modules
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {isPremium ? "Full Access" : "Upgrade Required"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <FeatureCard
                      icon={GitMerge}
                      title="Open Source Engine"
                      description="Contribute to real company repositories and earn verified completion credentials."
                      badge="Active"
                      onClick={() => setActiveTab("opensource")}
                      locked={!isPremium}
                    />
                    <FeatureCard
                      icon={GraduationCap}
                      title="Senior Mentorship"
                      description="Book 1-on-1 advising sessions with verified senior scholars and industry engineers."
                      onClick={() => setActiveTab("mentors")}
                      locked={!isPremium}
                    />
                    <FeatureCard
                      icon={Building2}
                      title="Enterprise Spaces"
                      description="Participate in direct discussion groups hosted by hiring engineering teams."
                      onClick={() => setActiveTab("communities")}
                      locked={!isPremium}
                    />
                    <FeatureCard
                      icon={Mail}
                      title="Dispatch Digest"
                      description="Receive filtered new opportunity dispatches directly to your registered inbox."
                      onClick={() => setActiveTab("digest")}
                      locked={!isPremium}
                    />
                  </div>
                </div>

                {/* Mentor Status / Application Callout */}
                <div className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {profile?.isMentor ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-2 flex-wrap">
                            <span>Verified Senior Peer Mentor</span>
                            {satisfiedMentees > 0 && (
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/20">
                                {satisfiedMentees} satisfied mentee{satisfiedMentees !== 1 ? "s" : ""}
                              </span>
                            )}
                            {mentorCertsEarned > 0 && (
                              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-xs border border-sky-500/20">
                                {mentorCertsEarned} cert{mentorCertsEarned !== 1 ? "s" : ""} earned
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {activeMenteeSessions > 0
                              ? `${activeMenteeSessions} active session${activeMenteeSessions !== 1 ? "s" : ""} · Your profile is published in the scholar directory.`
                              : "Your mentor profile is published in the scholar directory. Update your coaching topics or advising bio anytime."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMentorApplyModal(true)}
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                      >
                        Update Mentor Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Senior Scholar or Alumni Mentor Application
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Are you a 4th-year student or alumni? Apply to mentor junior peers and earn verification credits.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMentorApplyModal(true)}
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                      >
                        View Mentor Requirements &amp; Apply
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── OPEN SOURCE TAB (Live Connected) ─────────────────── */}
            {activeTab === "opensource" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    Company Open-Source Repositories
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contribute code to production company repositories. When your PR merges, the GitHub webhook automatically tracks it and the company can issue you a platform credential.
                  </p>
                </div>

                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <>
                    {/* GitHub Verification Notice banner */}
                    {githubNotice && (
                      <div
                        role="alert"
                        className="p-3 rounded-md border border-primary/30 bg-primary/10 text-xs font-medium text-foreground flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>{githubNotice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGithubNotice(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground font-mono"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Developer GitHub Identity & Verification Card */}
                    <div className="p-4 rounded-lg border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {authUser?.githubUsername ? (
                        <div className="flex items-center gap-3">
                          {authUser.githubAvatarUrl ? (
                            <img
                              src={authUser.githubAvatarUrl}
                              alt={authUser.githubUsername || "GitHub"}
                              className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-border text-foreground font-mono font-bold text-xs">
                              GH
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xs font-semibold text-foreground">Verified Developer</h2>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                @{authUser.githubUsername}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              Pull requests authored by <strong>@{authUser.githubUsername}</strong> on partner company repositories are automatically eligible for verification and credential issuance.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-secondary/80 flex items-center justify-center shrink-0 border border-border text-foreground">
                            <GitPullRequest className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xs font-semibold text-foreground">GitHub Developer Verification</h2>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border font-medium">
                                Not Connected
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
                              Connect your GitHub account to verify merged pull requests against partner company repositories. We verify that the author of merged pull requests matches your GitHub identity before awarding platform credentials.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        {authUser?.githubUsername ? (
                          <>
                            <button
                              type="button"
                              id="open-verify-pr-btn"
                              onClick={() => {
                                setIsVerifyModalOpen(true);
                                setVerifyError(null);
                                setVerifySuccess(null);
                              }}
                              className="text-xs font-semibold px-3.5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <GitPullRequest className="w-3.5 h-3.5" />
                              <span>Verify Pull Request</span>
                            </button>
                            <button
                              type="button"
                              id="unlink-github-btn"
                              onClick={handleUnlinkGithub}
                              disabled={isUnlinkingGithub}
                              className="text-xs font-medium px-2.5 py-2 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Disconnect GitHub account"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Disconnect</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            id="connect-github-btn"
                            onClick={() => {
                              window.location.href = `${API_BASE}/api/auth/github?returnTo=/premium?tab=opensource`;
                            }}
                            className="text-xs font-semibold px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-current" aria-hidden>
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              />
                            </svg>
                            <span>Connect GitHub</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* My Tracked Contributions Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          My Tracked Contributions ({myContributions.length})
                        </span>
                        <button
                          onClick={fetchOpenSourceData}
                          className="text-[10px] font-mono text-primary hover:underline cursor-pointer"
                        >
                          Refresh Telemetry
                        </button>
                      </div>

                      {isLoadingOss ? (
                        <div className="py-8 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                        </div>
                      ) : myContributions.length === 0 ? (
                        <div className="p-4 rounded-md border border-dashed border-border bg-card text-center space-y-1">
                          <p className="text-xs font-semibold text-foreground">No merged contributions yet</p>
                          <p className="text-[11px] text-muted-foreground">
                            Fork a repository below, open a pull request, and ensure your platform GitHub username matches your commits.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border rounded-md border border-border bg-card overflow-hidden">
                          {myContributions.map((c) => (
                            <div
                              key={c._id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">
                                    {c.projectId?.title || "Project Contribution"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    · {c.projectId?.companyName || "Partner"}
                                  </span>
                                </div>
                                <a
                                  href={c.prUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-primary hover:underline font-mono flex items-center gap-1"
                                >
                                  PR #{c.prNumber}: {c.prTitle} <ExternalLink className="w-3 h-3" />
                                </a>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  Merged: {formatDate(c.mergedAt)}
                                </span>
                              </div>

                              <div>
                                {c.certificateIssued ? (
                                  <button
                                    onClick={() =>
                                      setSelectedCert({
                                        ...c,
                                        projectId: c.projectId,
                                      })
                                    }
                                    className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>View Certificate</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded-sm border border-border">
                                    Pending Company Review
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Repositories */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Available Partner Repositories ({filteredOssProjects.length})
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Filter by tech or title..."
                              value={ossSearchQuery}
                              onChange={(e) => setOssSearchQuery(e.target.value)}
                              className="text-xs pl-8 pr-3 py-1.5 rounded-sm bg-background border border-border text-foreground focus:outline-none w-44"
                            />
                          </div>

                          <select
                            value={ossDifficultyFilter}
                            onChange={(e) => setOssDifficultyFilter(e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-sm bg-background border border-border text-foreground focus:outline-none"
                          >
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      </div>

                      {filteredOssProjects.length === 0 ? (
                        <div className="p-8 rounded-md border border-dashed border-border text-center space-y-1">
                          <p className="text-xs font-semibold text-foreground">No repositories found</p>
                          <p className="text-[11px] text-muted-foreground">
                            Try adjusting your search criteria or check back as more industry partners post repositories.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredOssProjects.map((proj) => (
                            <div
                              key={proj._id}
                              className="p-4 rounded-md border border-border bg-card space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                                      {proj.companyName}
                                    </span>
                                    <h3 className="text-xs font-bold text-foreground tracking-tight">
                                      {proj.title}
                                    </h3>
                                  </div>
                                  <span
                                    className={cn(
                                      "text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-sm border",
                                      proj.difficulty === "beginner"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : proj.difficulty === "intermediate"
                                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                    )}
                                  >
                                    {proj.difficulty}
                                  </span>
                                </div>

                                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                                  {proj.description}
                                </p>

                                <div className="flex flex-wrap gap-1">
                                  {proj.techStack.map((tech) => (
                                    <span
                                      key={tech}
                                      className="text-[9px] font-mono bg-secondary text-foreground px-1.5 py-0.5 rounded-sm border border-border"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-border flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Tracked Repository
                                </span>
                                <a
                                  href={proj.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                                >
                                  <span>Contribute on GitHub</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verify Pull Request Modal */}
                    {isVerifyModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                        <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-mono">
                                <GitPullRequest className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-foreground">Verify Merged Pull Request</h3>
                                <p className="text-[10px] text-muted-foreground">Confirm your contribution to claim platform credentials</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsVerifyModalOpen(false);
                                setVerifyError(null);
                                setVerifySuccess(null);
                              }}
                              className="text-muted-foreground hover:text-foreground text-xs p-1"
                            >
                              ✕
                            </button>
                          </div>

                          {verifyError && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{verifyError}</span>
                            </div>
                          )}

                          {verifySuccess && (
                            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{verifySuccess}</span>
                            </div>
                          )}

                          <form onSubmit={handleVerifyPr} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-foreground mb-1">
                                Target Partner Repository *
                              </label>
                              <select
                                value={verifyProjectId}
                                onChange={(e) => setVerifyProjectId(e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                              >
                                <option value="">Select registered partner project...</option>
                                {ossProjects.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.title} ({p.companyName} — {p.repoFullName})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-foreground mb-1">
                                GitHub Pull Request URL *
                              </label>
                              <input
                                type="url"
                                placeholder="https://github.com/organization/repository/pull/12"
                                value={verifyPrUrl}
                                onChange={(e) => setVerifyPrUrl(e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                required
                              />
                              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                The PR must already be merged into the repository. The commit/PR author must match your verified handle: <strong className="text-foreground">@{authUser?.githubUsername}</strong>.
                              </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsVerifyModalOpen(false);
                                  setVerifyError(null);
                                  setVerifySuccess(null);
                                }}
                                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isVerifyingPr || !verifyProjectId || !verifyPrUrl.trim()}
                                className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                {isVerifyingPr ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Verifying with GitHub…</span>
                                  </>
                                ) : (
                                  "Verify & Record Contribution"
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── MENTORS TAB (SUB-PAGES: DIRECTORY, SESSIONS, STUDIO) ─── */}
            {activeTab === "mentors" && (
              <div className="space-y-6">
                {/* Header with Title & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h1 className="text-sm font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>Senior Scholar &amp; Industry Advising</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct WebRTC 1-on-1 audio/video calling, architecture critiques, and interview readiness.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.isMentor ? (
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Mentor Active (+20 ATS)</span>
                        </div>
                        <button
                          onClick={() => setShowMentorApplyModal(true)}
                          className="px-2.5 py-1 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Edit Profile</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowMentorApplyModal(true)}
                        className="px-3 py-1.5 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                        <span>Apply as Senior Mentor (Free)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-border text-xs">
                  <button
                    onClick={() => setMentorSubTab("directory")}
                    className={cn(
                      "px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      mentorSubTab === "directory"
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Mentor Directory</span>
                  </button>
                  <button
                    onClick={() => setMentorSubTab("sessions")}
                    className={cn(
                      "px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      mentorSubTab === "sessions"
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>My Sessions</span>
                    {myPairings.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-secondary border border-border text-foreground">
                        {myPairings.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setMentorSubTab("studio")}
                    className={cn(
                      "px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      mentorSubTab === "studio"
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mentor Studio</span>
                    {profile?.isMentor && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        +20 ATS
                      </span>
                    )}
                  </button>
                </div>

                {mentorshipAlert && (
                  <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <span className="font-semibold">{mentorshipAlert}</span>
                    <button
                      onClick={() => setMentorshipAlert(null)}
                      className="text-[10px] underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* ── SUB-PAGE 1: DIRECTORY ─────────────────────────── */}
                {mentorSubTab === "directory" && (
                  <div className="space-y-4">
                    {/* Filter bar: Search & Topic Chips */}
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                      {/* Topic Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: "all", label: "All Specializations" },
                          { id: "Distributed Systems", label: "Distributed Systems" },
                          { id: "React", label: "React & Full-Stack" },
                          { id: "Machine Learning", label: "AI & Transformers" },
                          { id: "Cloud", label: "Cloud & DevOps" },
                          { id: "Rust", label: "Compilers & Systems" },
                        ].map((chip) => {
                          const isSelected = mentorTopicFilter === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => setMentorTopicFilter(chip.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-sm text-xs font-mono transition-colors cursor-pointer border",
                                isSelected
                                  ? "bg-secondary text-foreground font-semibold border-primary/40 shadow-xs"
                                  : "bg-background text-muted-foreground border-border hover:bg-secondary/60 hover:text-foreground"
                              )}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full md:w-64 shrink-0">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Filter mentors by name, topic..."
                          value={mentorSearchQuery}
                          onChange={(e) => setMentorSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-foreground/40"
                        />
                      </div>
                    </div>

                    {isLoadingMentors ? (
                      <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (() => {
                      const currentUserId = (profile?.userId || profile?._id)?.toString();
                      const availableMentors = mentors
                        .filter((m) => !currentUserId || m.userId?.toString() !== currentUserId)
                        .filter((m) => {
                          if (mentorTopicFilter === "all") return true;
                          const filterLower = mentorTopicFilter.toLowerCase();
                          const matchesTopics = m.mentorTopics?.some((t) =>
                            t.toLowerCase().includes(filterLower)
                          );
                          const matchesSkills = m.skills?.some((s) =>
                            s.toLowerCase().includes(filterLower)
                          );
                          return matchesTopics || matchesSkills;
                        })
                        .filter(
                          (m) =>
                            !mentorSearchQuery ||
                            m.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) ||
                            (m.institution &&
                              m.institution.toLowerCase().includes(mentorSearchQuery.toLowerCase())) ||
                            (m.mentorTopics &&
                              m.mentorTopics.some((t) =>
                                t.toLowerCase().includes(mentorSearchQuery.toLowerCase())
                              )) ||
                            (m.skills &&
                              m.skills.some((s) =>
                                s.toLowerCase().includes(mentorSearchQuery.toLowerCase())
                              ))
                        );

                      if (availableMentors.length === 0) {
                        return (
                          <div className="p-8 rounded-md border border-dashed border-border text-center space-y-2">
                            <p className="text-xs font-semibold text-foreground">
                              No verified mentors matching your filter
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Try clearing your search query or selecting "All Specializations".
                            </p>
                            <button
                              onClick={() => {
                                setMentorSearchQuery("");
                                setMentorTopicFilter("all");
                              }}
                              className="px-3 py-1 text-xs font-semibold rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5 mt-2"
                            >
                              Reset Filters
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {availableMentors.map((m) => {
                            // Check if student user already has an active session with this mentor
                            const activePairingWithMentor = myPairings.find(
                              (p) =>
                                p.status === "active" &&
                                !p.isUserMentor &&
                                (p.mentor?.userId?.toString() === m.userId?.toString() ||
                                  p.mentorId?.toString() === m.userId?.toString())
                            );

                            return (
                              <div
                                key={m.userId}
                                className="p-4 rounded-md border border-border bg-card flex flex-col justify-between gap-3 shadow-xs"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-secondary border border-border text-[10px] font-mono uppercase text-muted-foreground">
                                      <Shield className="w-3 h-3 text-emerald-500" />
                                      <span>Verified Mentor</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500">
                                      <Star className="w-3 h-3 fill-amber-500" />
                                      <span>{m.rating || 5.0}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        ({m.reviewCount || 0})
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-xs font-bold text-foreground">{m.name}</h3>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                                      {m.headline || m.institution || "PortalAcademia Scholar"}
                                    </p>
                                    {m.mentorBio && (
                                      <p className="text-[11px] text-muted-foreground/90 mt-1 line-clamp-2 leading-relaxed">
                                        {m.mentorBio}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {(m.mentorTopics || m.skills || []).slice(0, 4).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[9px] font-mono bg-secondary px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-border space-y-2">
                                  {activePairingWithMentor ? (
                                    <>
                                      <div className="p-1.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Active Advising Session</span>
                                        </span>
                                        <span className="font-mono text-[9px]">
                                          {activePairingWithMentor.totalCallDurationMinutes}m logged
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => setActiveCallPairing(activePairingWithMentor)}
                                        className="w-full text-xs font-semibold py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>Join Video Call</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (!isPremium) {
                                          setShowPaymentModal(true);
                                          return;
                                        }
                                        setBookingMentor(m);
                                      }}
                                      className="w-full text-xs font-semibold py-2 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:border-foreground/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                      <PhoneCall className="w-3.5 h-3.5 text-primary" />
                                      <span>Request 1-on-1 Advising</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── SUB-PAGE 2: MY SESSIONS ───────────────────────── */}
                {mentorSubTab === "sessions" && (
                  <div className="space-y-4">
                    {/* Segmented Filter: All vs Received vs Given */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-sm border border-border text-xs">
                        <button
                          onClick={() => setSessionRoleFilter("all")}
                          className={cn(
                            "px-3 py-1 rounded-xs font-medium transition-colors cursor-pointer",
                            sessionRoleFilter === "all"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          All Sessions ({myPairings.length})
                        </button>
                        <button
                          onClick={() => setSessionRoleFilter("mentee")}
                          className={cn(
                            "px-3 py-1 rounded-xs font-medium transition-colors cursor-pointer",
                            sessionRoleFilter === "mentee"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Advising Received ({menteeSessions.length})
                        </button>
                        <button
                          onClick={() => setSessionRoleFilter("mentor")}
                          className={cn(
                            "px-3 py-1 rounded-xs font-medium transition-colors cursor-pointer",
                            sessionRoleFilter === "mentor"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Advising Given ({mentorSessions.length})
                        </button>
                      </div>

                      <button
                        onClick={() => setMentorSubTab("directory")}
                        className="px-3 py-1 text-xs font-semibold rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Find New Mentor</span>
                      </button>
                    </div>

                    {/* Filtered Sessions Grid */}
                    {(() => {
                      const displayedSessions = myPairings.filter((p) => {
                        if (sessionRoleFilter === "mentee") return !p.isUserMentor;
                        if (sessionRoleFilter === "mentor") return p.isUserMentor;
                        return true;
                      });

                      if (displayedSessions.length === 0) {
                        return (
                          <div className="p-12 rounded-md border border-dashed border-border text-center space-y-3">
                            <Video className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-foreground">
                                No sessions recorded in this view
                              </p>
                              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                                {sessionRoleFilter === "mentor"
                                  ? "You have not conducted advising sessions as a mentor yet. Check your Mentor Studio to view mentee requests."
                                  : "You haven't requested 1-on-1 advising yet. Browse verified senior scholars to schedule a session."}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                sessionRoleFilter === "mentor"
                                  ? setMentorSubTab("studio")
                                  : setMentorSubTab("directory")
                              }
                              className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1.5 mt-2"
                            >
                              <span>
                                {sessionRoleFilter === "mentor"
                                  ? "Open Mentor Studio"
                                  : "Browse Mentor Directory"}
                              </span>
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedSessions.map((pairing) => {
                            const otherPerson = pairing.isUserMentor ? pairing.mentee : pairing.mentor;
                            const roleLabel = pairing.isUserMentor ? "Your Mentee" : "Your Mentor";
                            return (
                              <div
                                key={pairing._id}
                                className="p-4 rounded-md border border-border bg-card space-y-3 flex flex-col justify-between shadow-xs"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                        {roleLabel}
                                      </span>
                                      <h3 className="text-xs font-bold text-foreground">
                                        {otherPerson?.name || "PortalAcademia Scholar"}
                                      </h3>
                                      <p className="text-[11px] text-muted-foreground">
                                        {otherPerson?.headline || otherPerson?.institution || "Verified Scholar"}
                                      </p>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-sm border",
                                        pairing.status === "active"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                          : pairing.status === "completed"
                                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                          : "bg-muted text-muted-foreground border-border"
                                      )}
                                    >
                                      {pairing.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono pt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-primary" />
                                      <span>{pairing.totalCallDurationMinutes} mins logged</span>
                                    </span>
                                    {pairing.menteeRating && (
                                      <span className="flex items-center gap-1 text-amber-500">
                                        <Star className="w-3 h-3 fill-amber-500" />
                                        <span>{pairing.menteeRating}★ rated</span>
                                      </span>
                                    )}
                                  </div>

                                  {pairing.notes && (
                                    <div className="p-2 rounded-sm bg-secondary/40 border border-border text-[11px] text-muted-foreground leading-relaxed italic">
                                      "{pairing.notes}"
                                    </div>
                                  )}

                                  {pairing.topics && pairing.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                      {pairing.topics.map((t) => (
                                        <span
                                          key={t}
                                          className="text-[9px] font-mono bg-secondary px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground"
                                        >
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                                  {pairing.status === "active" && (
                                    <button
                                      onClick={() => setActiveCallPairing(pairing)}
                                      className="flex-1 text-xs font-semibold py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>Start Video Call</span>
                                    </button>
                                  )}

                                  {!pairing.isUserMentor && !pairing.menteeRating && (
                                    <button
                                      onClick={() => setActiveRatingPairing(pairing)}
                                      className="px-3 py-2 text-xs font-semibold rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                                    >
                                      Rate Advising
                                    </button>
                                  )}

                                  {pairing.certificateIssued && (
                                    <button
                                      onClick={() => setSelectedMentorshipCert(pairing)}
                                      className="px-3 py-2 text-xs font-semibold rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                      <span>View Certificate</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── SUB-PAGE 3: MENTOR STUDIO ─────────────────────── */}
                {mentorSubTab === "studio" && (
                  <div className="space-y-6">
                    {/* Studio Header Card with 4 KPI Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-md border border-border bg-card space-y-1">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          Mentees Guided
                        </span>
                        <div className="text-xl font-bold font-mono text-foreground">
                          {satisfiedMentees}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Satisfied scholars (4-5★)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-md border border-border bg-card space-y-1">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          Total Advised Time
                        </span>
                        <div className="text-xl font-bold font-mono text-foreground flex items-baseline gap-1">
                          <span>{totalMinutesAdvised}</span>
                          <span className="text-xs text-muted-foreground font-sans">mins</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Across {mentorSessions.length} total session{mentorSessions.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-md border border-border bg-card space-y-1">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          Average Rating
                        </span>
                        <div className="text-xl font-bold font-mono text-amber-500 flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500" />
                          <span>5.0</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Verified mentee feedback
                        </p>
                      </div>

                      <div className="p-3.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
                          ATS Score Boost
                        </span>
                        <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>+20 PTS</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500">
                          {profile?.isMentor ? "Active on recruiter profile" : "Available upon registration"}
                        </p>
                      </div>
                    </div>

                    {!profile?.isMentor ? (
                      /* Mentor Registration Callout */
                      <div className="p-6 rounded-md border border-border bg-card space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-sm font-bold text-foreground">
                              Become a PortalAcademia Senior Scholar Mentor
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                              Senior scholars in their 3rd or 4th year can provide 1-on-1 technical advising, code reviews, and mock interviews to junior students. In return, your profile receives a permanent verified badge and <span className="font-semibold text-emerald-600 dark:text-emerald-400">+20 ATS boost points</span> on employer search results.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => setShowMentorApplyModal(true)}
                            className="px-4 py-2 text-xs font-semibold rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Register as Senior Mentor (Free)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Registered Mentor Studio Console */
                      <div className="space-y-6">
                        {/* Profile Summary Card */}
                        <div className="p-4 rounded-md border border-border bg-card space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                                Active Mentor Profile
                              </span>
                              <h2 className="text-xs font-bold text-foreground">{profile?.name}</h2>
                              <p className="text-[11px] text-muted-foreground">
                                {profile?.mentorBio || profile?.bio || "Senior Scholar Fellow"}
                              </p>
                            </div>
                            <button
                              onClick={() => setShowMentorApplyModal(true)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              Update Bio &amp; Topics
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground">
                              Advising Topics Offered
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(profile?.mentorTopics || profile?.skills || [
                                "System Design",
                                "React 19",
                                "Resume Review",
                              ]).map((topic) => (
                                <span
                                  key={topic}
                                  className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded-sm border border-border text-foreground"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Active Mentees Queue */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            Active Mentee Queue ({activeMenteeSessions})
                          </h3>

                          {mentorSessions.filter((p) => p.status === "active").length === 0 ? (
                            <div className="p-6 rounded-md border border-dashed border-border text-center space-y-1 text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground">No active mentees currently in session</p>
                              <p className="text-[11px]">
                                Your profile is published in the Mentor Directory. New booking requests will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mentorSessions
                                .filter((p) => p.status === "active")
                                .map((pairing) => (
                                  <div
                                    key={pairing._id}
                                    className="p-4 rounded-md border border-border bg-card space-y-3 flex flex-col justify-between"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                            Assigned Mentee
                                          </span>
                                          <h4 className="text-xs font-bold text-foreground">
                                            {pairing.mentee?.name || "Student Scholar"}
                                          </h4>
                                          <p className="text-[11px] text-muted-foreground">
                                            {pairing.mentee?.institution || "PortalAcademia Student"}
                                          </p>
                                        </div>
                                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Active
                                        </span>
                                      </div>

                                      {pairing.notes && (
                                        <p className="text-[11px] text-muted-foreground bg-secondary/30 p-2 rounded-sm border border-border italic">
                                          "{pairing.notes}"
                                        </p>
                                      )}

                                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground pt-1">
                                        <Video className="w-3 h-3 text-primary" />
                                        <span>{pairing.totalCallDurationMinutes} mins completed</span>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-border">
                                      <button
                                        onClick={() => setActiveCallPairing(pairing)}
                                        className="w-full text-xs font-semibold py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>Launch 1-on-1 Call</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Completed Advising & Reviews */}
                        {mentorSessions.filter((p) => p.status === "completed").length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                              Completed Mentorships &amp; Credentials ({mentorCertsEarned})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mentorSessions
                                .filter((p) => p.status === "completed")
                                .map((pairing) => (
                                  <div
                                    key={pairing._id}
                                    className="p-4 rounded-md border border-border bg-card space-y-2.5 flex flex-col justify-between"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="text-xs font-bold text-foreground">
                                            {pairing.mentee?.name || "Student Scholar"}
                                          </h4>
                                          <p className="text-[11px] text-muted-foreground">
                                            {pairing.mentee?.institution || "Student"}
                                          </p>
                                        </div>
                                        {pairing.menteeRating && (
                                          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-bold">
                                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                                            <span>{pairing.menteeRating}.0</span>
                                          </div>
                                        )}
                                      </div>

                                      {pairing.menteeFeedback && (
                                        <p className="text-[11px] text-foreground/80 bg-secondary/30 p-2 rounded-sm border border-border italic">
                                          "{pairing.menteeFeedback}"
                                        </p>
                                      )}
                                    </div>

                                    {pairing.certificateIssued && (
                                      <div className="pt-2 border-t border-border flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Verified Credential Issued</span>
                                        </span>
                                        <button
                                          onClick={() => setSelectedMentorshipCert(pairing)}
                                          className="px-2.5 py-1 text-xs font-medium rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                          <Award className="w-3 h-3 text-emerald-500" />
                                          <span>View Certificate</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── COMMUNITIES TAB ──────────────────────────────────── */}
            {activeTab === "communities" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">
                      Enterprise Technical Spaces
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Join verified company and institutional engineering communities for technical AMAs, design reviews, and hiring discussions.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search spaces, focus, industry..."
                      value={communitySearchQuery}
                      onChange={(e) => setCommunitySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-foreground/40"
                    />
                  </div>
                </div>

                {!isPremium && profile?.accountType === "student" ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <div className="space-y-4">
                    {/* Industry Domain Filter Chips */}
                    {(() => {
                      const industries = Array.from(
                        new Set(communitySpaces.map((s) => s.industry).filter(Boolean))
                      );
                      if (industries.length === 0) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCommunityIndustry("all")}
                            className={cn(
                              "text-[10px] font-mono uppercase px-2.5 py-1 rounded-sm border transition-colors cursor-pointer",
                              selectedCommunityIndustry === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:text-foreground"
                            )}
                          >
                            All Spaces ({communitySpaces.length})
                          </button>
                          {industries.map((ind) => {
                            const count = communitySpaces.filter((s) => s.industry === ind).length;
                            return (
                              <button
                                key={ind}
                                type="button"
                                onClick={() => setSelectedCommunityIndustry(ind)}
                                className={cn(
                                  "text-[10px] font-mono uppercase px-2.5 py-1 rounded-sm border transition-colors cursor-pointer",
                                  selectedCommunityIndustry === ind
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                                )}
                              >
                                {ind} ({count})
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {isLoadingSpaces ? (
                      <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (() => {
                      const filteredSpaces = communitySpaces.filter((space) => {
                        const matchesIndustry =
                          selectedCommunityIndustry === "all" ||
                          space.industry?.toLowerCase() === selectedCommunityIndustry.toLowerCase();
                        if (!matchesIndustry) return false;
                        if (!communitySearchQuery.trim()) return true;
                        const q = communitySearchQuery.toLowerCase();
                        return (
                          space.name.toLowerCase().includes(q) ||
                          space.description.toLowerCase().includes(q) ||
                          (space.industry && space.industry.toLowerCase().includes(q)) ||
                          (space.focus && space.focus.toLowerCase().includes(q))
                        );
                      });

                      if (filteredSpaces.length === 0) {
                        return (
                          <div className="p-8 rounded-md border border-dashed border-border text-center space-y-2">
                            <p className="text-xs font-semibold text-foreground">
                              {communitySearchQuery || selectedCommunityIndustry !== "all"
                                ? "No matching technical spaces found"
                                : "No enterprise spaces found"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {communitySearchQuery || selectedCommunityIndustry !== "all"
                                ? "Try broadening your search terms or selecting another industry domain."
                                : "Technical discussion forums will appear here as industry partners initiate channels."}
                            </p>
                            {(communitySearchQuery || selectedCommunityIndustry !== "all") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCommunitySearchQuery("");
                                  setSelectedCommunityIndustry("all");
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5 mt-1"
                              >
                                <span>Reset Filters</span>
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredSpaces.map((space) => (
                            <div
                              key={space._id}
                              className="p-4 rounded-md border border-border bg-card flex flex-col justify-between gap-3 shadow-xs hover:border-foreground/30 transition-colors"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm border border-border">
                                    {space.industry}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <Users className="w-3 h-3" />
                                    <span>{space.memberCount || 0} scholars</span>
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-xs font-bold text-foreground">{space.name}</h3>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                                    {space.description}
                                  </p>
                                </div>
                                {space.focus && (
                                  <span className="inline-block text-[10px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded-sm border border-primary/20">
                                    #{space.focus}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={async () => {
                                  setJoiningSpaceId(space._id);
                                  try {
                                    const res = await fetch(
                                      `${API_BASE}/api/community/spaces/${space._id}/join`,
                                      {
                                        method: "POST",
                                        credentials: "include",
                                      }
                                    );
                                    const data = await res.json();
                                    if (data.success) {
                                      setActiveChatSpace(space);
                                      void fetchCommunitySpaces();
                                    } else {
                                      alert(data.message || "Failed to join space.");
                                    }
                                  } catch {
                                    alert("Network error while connecting to space.");
                                  } finally {
                                    setJoiningSpaceId(null);
                                  }
                                }}
                                disabled={joiningSpaceId === space._id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors self-start cursor-pointer flex items-center gap-1.5 disabled:opacity-50 mt-1"
                              >
                                {joiningSpaceId === space._id && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                <span>Open Discussion Channel →</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── EMAIL DIGEST TAB ─────────────────────────────────── */}
            {activeTab === "digest" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    Opportunity Dispatch Configuration
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set notification frequency for relevant institutional internship and research postings.
                  </p>
                </div>

                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <div className="rounded-md border border-border bg-card p-5 max-w-lg space-y-4">
                    <div className="space-y-2">
                      {[
                        {
                          id: "instant",
                          label: "Instantaneous Telemetry",
                          desc: "Receive immediate dispatches as opportunities pass verification.",
                        },
                        {
                          id: "daily",
                          label: "Daily Morning Digest",
                          desc: "Single daily briefing at 09:00 IST.",
                        },
                        {
                          id: "weekly",
                          label: "Weekly Monday Summary",
                          desc: "Aggregated high-match positions every Monday.",
                        },
                        {
                          id: "off",
                          label: "Paused",
                          desc: "No automated dispatches to registered email.",
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-sm border border-border bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name="digest"
                            defaultChecked={item.id === "daily"}
                            className="mt-0.5 accent-foreground"
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground block">
                              {item.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.desc}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Dispatch preferences updated.")}
                      className="text-xs font-semibold px-4 py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      Save Dispatch Rules
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          hasUsedTrial={membership?.hasUsedTrial ?? false}
        />
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          contribution={selectedCert}
          studentName={profile?.name || "Student Scholar"}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* WebRTC 1-on-1 Video Call Modal */}
      {activeCallPairing && (
        <MentorshipVideoCallModal
          pairingId={activeCallPairing._id}
          mentorName={activeCallPairing.mentor?.name || "Mentor"}
          menteeName={activeCallPairing.mentee?.name || "Mentee"}
          currentUserId={profile?.userId || profile?._id}
          onClose={() => {
            setActiveCallPairing(null);
            forceStopAllHardwareMedia();
          }}
          onCallEnded={(_durationMins) => {
            forceStopAllHardwareMedia();
            void fetchMentorshipData();
            if (!activeCallPairing.isUserMentor) {
              setActiveRatingPairing(activeCallPairing);
            }
          }}
        />
      )}

      {/* Dedicated Mentorship Booking Modal */}
      <MentorshipBookingModal
        mentor={bookingMentor}
        isOpen={Boolean(bookingMentor)}
        onClose={() => setBookingMentor(null)}
        onSuccess={(_pairing, msg) => {
          setMentorshipAlert(msg);
          void fetchMentorshipData();
          setMentorSubTab("sessions");
        }}
      />

      {/* Mentorship Certificate Modal */}
      {selectedMentorshipCert && (
        <MentorshipCertificateModal
          pairing={selectedMentorshipCert}
          recipientName={profile?.name || "PortalAcademia Scholar"}
          onClose={() => setSelectedMentorshipCert(null)}
        />
      )}

      {/* Mentorship Session Rating Modal */}
      {activeRatingPairing && (
        <MentorshipRatingModal
          pairingId={activeRatingPairing._id}
          mentorName={activeRatingPairing.mentor?.name || "Mentor"}
          onClose={() => setActiveRatingPairing(null)}
          onRatingSubmitted={() => {
            void fetchMentorshipData();
          }}
        />
      )}

      {/* Senior Mentor Registration Modal */}
      {showMentorApplyModal && (
        <MentorApplicationModal
          defaultBio={profile?.mentorBio || profile?.bio || ""}
          defaultTopics={profile?.mentorTopics || profile?.skills || []}
          isAlreadyMentor={Boolean(profile?.isMentor)}
          academicYear={profile?.academicYear}
          onClose={() => setShowMentorApplyModal(false)}
          onApplicationSuccess={() => {
            void fetchData();
            void fetchMentorshipData();
          }}
        />
      )}

      {/* Community Real-Time Chat Modal */}
      {activeChatSpace && (
        <CommunityChatView
          spaceId={activeChatSpace._id}
          spaceName={activeChatSpace.name}
          focus={activeChatSpace.focus}
          currentUserId={profile?.userId || profile?._id}
          onClose={() => setActiveChatSpace(null)}
        />
      )}
    </div>
  );
}
