import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Sparkles,
  Users,
  Code2,
  Mail,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  Zap,
  BookOpen,
  Building2,
  GitMerge,
  Bell,
  TrendingUp,
  Shield,
  GraduationCap,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

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
  name: string;
  profileImage?: string;
  accountType: string;
  graduationYear?: number;
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

// ─── Plan Upgrade Modal ────────────────────────────────────────────────────────

interface PlanCardProps {
  planType: "monthly" | "annual";
  price: number;
  period: string;
  badge?: string;
  features: string[];
  onSelect: (plan: "monthly" | "annual") => void;
  isLoading: boolean;
}

function PlanCard({ planType, price, period, badge, features, onSelect, isLoading }: PlanCardProps) {
  const isAnnual = planType === "annual";
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-6 flex flex-col gap-4 transition-all",
        isAnnual
          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
          : "border-border bg-card"
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      )}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          {planType === "monthly" ? "Monthly" : "Annual"}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">₹{price}</span>
          <span className="text-sm text-muted-foreground">/{period}</span>
        </div>
        {isAnnual && (
          <p className="text-xs text-amber-600 font-semibold mt-1">Save ₹1,989 vs monthly</p>
        )}
      </div>
      <ul className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(planType)}
        disabled={isLoading}
        className={cn(
          "w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all",
          isAnnual
            ? "bg-amber-400 hover:bg-amber-500 text-amber-950"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Get {planType === "monthly" ? "Monthly" : "Annual"} Plan
      </button>
    </div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  locked?: boolean;
  iconColor?: string;
  bgColor?: string;
}

function FeatureCard({ icon: Icon, title, description, badge, onClick, locked, iconColor = "text-primary", bgColor = "bg-primary/8" }: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        "group relative w-full text-left rounded-lg border border-border bg-card p-5 flex flex-col gap-3 transition-all",
        locked
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-primary/40 hover:shadow-sm cursor-pointer"
      )}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      )}
      <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", bgColor)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {!locked && (
        <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
          Explore <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </button>
  );
}

// ─── Mentor Card ──────────────────────────────────────────────────────────────

interface MentorCardProps {
  name: string;
  niches: string[];
  rating: number;
  sessions: number;
  avatarInitial: string;
  avatarColor: string;
}

function MentorCard({ name, niches, rating, sessions, avatarInitial, avatarColor }: MentorCardProps) {
  return (
    <div className="flex-shrink-0 w-60 rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm", avatarColor)}>
          {avatarInitial}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">· {sessions} sessions</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {niches.map((n) => (
          <span key={n} className="text-[10px] font-medium bg-secondary text-foreground/70 px-2 py-0.5 rounded-full border border-border">
            {n}
          </span>
        ))}
      </div>
      <button className="w-full py-1.5 rounded-md bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold transition-colors mt-auto">
        Request Session
      </button>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────

interface PaymentModalProps {
  onClose: () => void;
  hasUsedTrial: boolean;
}

const PREMIUM_FEATURES = [
  "Personalized 1-on-1 mentorship sessions",
  "Access to company open source projects",
  "Join exclusive company communities",
  "Priority email digest for new postings",
  "Earn contribution certificates",
  "Mentor rating & achievement badges",
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
      const data = await res.json() as { success: boolean; isTrial: boolean; message?: string };
      if (data.success) {
        window.location.reload();
      } else {
        setError(data.message ?? "Could not start trial. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
      const data = await res.json() as {
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
        description: "Premium Membership — ₹199/month",
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json() as { success: boolean };
          if (verifyData.success) {
            window.location.reload();
          } else {
            setError("Payment verification failed. Contact support.");
          }
        },
        theme: { color: "#111827" },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5">
          <div className="flex items-center gap-3">
            <Crown className="w-7 h-7 text-amber-950" />
            <div>
              <h2 className="text-xl font-bold text-amber-950">Get Premium Access</h2>
              <p className="text-amber-800 text-sm">Unlock mentorship, communities & more</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* What you get */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">What's included</p>
            <div className="grid grid-cols-2 gap-2">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Trial card — only if not yet used */}
          {!hasUsedTrial && (
            <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">7-Day Free Trial</p>
                <p className="text-xs text-muted-foreground mt-0.5">Full access, no card required. One-time offer.</p>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Start Free Trial
              </button>
            </div>
          )}

          {/* Paid plan card */}
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">₹199</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Full premium access · 30 days · All features</p>
            </div>
            <button
              onClick={handleBuyPremium}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold px-4 py-2 rounded-md transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
              Buy Now
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Locked Feature Overlay ───────────────────────────────────────────────────

function PremiumLockedBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/10 p-8 flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Crown className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Premium Feature</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Upgrade to Premium to access mentorship, company communities, open source projects, and more.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
      >
        <Crown className="w-4 h-4" />
        Upgrade to Premium
      </button>
    </div>
  );
}

// ─── Mock mentor data (to be replaced with real API) ─────────────────────────

const MOCK_MENTORS = [
  { name: "Arjun Sharma", niches: ["React", "Node.js", "TypeScript"], rating: 4.9, sessions: 42, avatarInitial: "A", avatarColor: "bg-violet-500" },
  { name: "Priya Mehta", niches: ["Python", "ML", "Data Science"], rating: 4.8, sessions: 38, avatarInitial: "P", avatarColor: "bg-rose-500" },
  { name: "Rahul Gupta", niches: ["Java", "Spring Boot", "AWS"], rating: 4.7, sessions: 55, avatarInitial: "R", avatarColor: "bg-sky-500" },
  { name: "Sneha Joshi", niches: ["UI/UX", "Figma", "Flutter"], rating: 4.9, sessions: 29, avatarInitial: "S", avatarColor: "bg-emerald-500" },
  { name: "Dev Kapoor", niches: ["DevOps", "Docker", "Kubernetes"], rating: 4.6, sessions: 61, avatarInitial: "D", avatarColor: "bg-orange-500" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "overview" | "mentors" | "communities" | "opensource" | "digest";

export default function PremiumDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isPremium = membership?.isPremium === true;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, membershipRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/me`, { credentials: "include" }),
        fetch(`${API_BASE}/api/payment/status`, { credentials: "include" }),
      ]);
      const profileData = await profileRes.json() as { success: boolean; profile: UserProfile };
      const membershipData = await membershipRes.json() as MembershipStatus;
      if (profileData.success) setProfile(profileData.profile);
      setMembership(membershipData);
    } catch (err) {
      console.error("PremiumDashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Razorpay script loader
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const sidebarItems: Array<{ id: ActiveTab; label: string; icon: React.ElementType; premiumOnly: boolean }> = [
    { id: "overview",     label: "Overview",          icon: Sparkles,   premiumOnly: false },
    { id: "mentors",      label: "Find a Mentor",     icon: GraduationCap, premiumOnly: true },
    { id: "communities",  label: "Communities",        icon: Building2,  premiumOnly: true },
    { id: "opensource",   label: "Open Source",        icon: GitMerge,   premiumOnly: true },
    { id: "digest",       label: "Email Digest",       icon: Mail,       premiumOnly: true },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar userName={profile?.name} userRole="student" profileId={profile?._id} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
          {/* Premium Brand */}
          <div className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-950" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">Premium</p>
                <p className="text-[10px] text-muted-foreground">PortalAcademia</p>
              </div>
            </div>
          </div>

          {/* Nav */}
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
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium w-full text-left transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isLocked
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {isLocked && (
                    <Crown className="w-2.5 h-2.5 ml-auto text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: plan status */}
          <div className="p-3 border-t border-border">
            {isPremium && membership?.membership ? (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                </div>
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 capitalize">
                  {membership.membership.planType} Plan
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {daysUntil(membership.membership.expiresAt)} days left
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 text-[11px] font-bold px-3 py-2 rounded-md transition-colors"
              >
                <Crown className="w-3 h-3" />
                Upgrade Now
              </button>
            )}
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Premium Hero Banner */}
          {isPremium && (
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-6 lg:px-8 py-4">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-950" />
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Welcome back, {profile?.name?.split(" ")[0] ?? "Student"}! ✨
                    </p>
                    <p className="text-xs text-amber-800">
                      Your Premium is active · expires {formatDate(membership!.membership!.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  {daysUntil(membership!.membership!.expiresAt)} days remaining
                </div>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-8">

            {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
            {activeTab === "overview" && (
              <>
                {/* Non-premium: CTA */}
                {!isPremium && (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-6 py-8 flex flex-col items-center text-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-amber-950/20 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-amber-950" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-amber-950 mb-1">PortalAcademia Premium</h1>
                        <p className="text-amber-800 text-sm max-w-md mx-auto">
                          Get personalized mentorship, access to company communities, open source project contributions, and priority job alerts.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-2 bg-amber-950 hover:bg-amber-900 text-amber-50 font-bold px-6 py-3 rounded-md transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade from ₹199/month
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                {isPremium && membership?.membership && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Active Plan",
                        value: membership.membership.planType === "monthly" ? "Monthly" : "Annual",
                        sub: `₹${membership.membership.amount} • ${formatDate(membership.membership.expiresAt)}`,
                        icon: Crown,
                        color: "text-amber-500",
                        bg: "bg-amber-50 dark:bg-amber-950/20",
                      },
                      {
                        label: "Mentor Sessions",
                        value: "0",
                        sub: "No sessions yet",
                        icon: GraduationCap,
                        color: "text-violet-500",
                        bg: "bg-violet-50 dark:bg-violet-950/20",
                      },
                      {
                        label: "Communities",
                        value: "0",
                        sub: "Companies joined",
                        icon: Building2,
                        color: "text-sky-500",
                        bg: "bg-sky-50 dark:bg-sky-950/20",
                      },
                      {
                        label: "Contributions",
                        value: "0",
                        sub: "Open source PRs",
                        icon: GitMerge,
                        color: "text-emerald-500",
                        bg: "bg-emerald-50 dark:bg-emerald-950/20",
                      },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className={cn("rounded-lg border border-border p-4 flex flex-col gap-2", stat.bg)}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                            <Icon className={cn("w-4 h-4", stat.color)} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Features Grid */}
                <div>
                  <h2 className="text-sm font-bold text-foreground mb-3">Premium Features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FeatureCard
                      icon={GraduationCap}
                      title="Find a Mentor"
                      description="Get matched with a senior mentor by niche. Book a 1-on-1 session via cal.com."
                      badge="Popular"
                      onClick={() => setActiveTab("mentors")}
                      locked={!isPremium}
                      iconColor="text-violet-500"
                      bgColor="bg-violet-50 dark:bg-violet-950/20"
                    />
                    <FeatureCard
                      icon={Building2}
                      title="Communities"
                      description="Join company communities. React, comment, and stay updated on opportunities."
                      onClick={() => setActiveTab("communities")}
                      locked={!isPremium}
                      iconColor="text-sky-500"
                      bgColor="bg-sky-50 dark:bg-sky-950/20"
                    />
                    <FeatureCard
                      icon={GitMerge}
                      title="Open Source"
                      description="Contribute to company projects. Get a certificate when your PR is merged."
                      badge="Unique"
                      onClick={() => setActiveTab("opensource")}
                      locked={!isPremium}
                      iconColor="text-emerald-500"
                      bgColor="bg-emerald-50 dark:bg-emerald-950/20"
                    />
                    <FeatureCard
                      icon={Mail}
                      title="Email Digest"
                      description="New job postings delivered to your inbox. Daily or weekly, your choice."
                      onClick={() => setActiveTab("digest")}
                      locked={!isPremium}
                      iconColor="text-rose-500"
                      bgColor="bg-rose-50 dark:bg-rose-950/20"
                    />
                  </div>
                </div>

                {/* Mentor preview */}
                {isPremium && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-foreground">Featured Mentors</h2>
                      <button
                        onClick={() => setActiveTab("mentors")}
                        className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                      >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {MOCK_MENTORS.map((m) => (
                        <MentorCard key={m.name} {...m} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Become a mentor CTA */}
                <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Are you a 4th year student or above?</p>
                    <p className="text-xs text-muted-foreground">
                      Become a mentor for free — earn a platform certificate and help juniors in your niche.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/become-mentor")}
                    className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Apply <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* ── MENTORS TAB ──────────────────────────────────────── */}
            {activeTab === "mentors" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-lg font-bold text-foreground">Find a Mentor</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Request a 1-on-1 session with a verified senior mentor matched to your niche.
                  </p>
                </div>
                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <>
                    {/* Niche filter */}
                    <div className="flex flex-wrap gap-2">
                      {["All", "React", "Python", "Java", "ML", "DevOps", "UI/UX", "Flutter"].map((niche) => (
                        <button
                          key={niche}
                          className="text-xs font-medium border border-border bg-card hover:border-primary/40 hover:bg-secondary px-3 py-1.5 rounded-full transition-all"
                        >
                          {niche}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MOCK_MENTORS.map((m) => (
                        <div key={m.name} className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold", m.avatarColor)}>
                              {m.avatarInitial}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{m.name}</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-semibold">{m.rating}</span>
                                <span className="text-xs text-muted-foreground">· {m.sessions} sessions</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {m.niches.map((n) => (
                              <span key={n} className="text-[10px] font-medium bg-secondary px-2 py-0.5 rounded-full border border-border">
                                {n}
                              </span>
                            ))}
                          </div>
                          <button className="w-full py-2 rounded-md bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Request Session
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── COMMUNITIES TAB ──────────────────────────────────── */}
            {activeTab === "communities" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-lg font-bold text-foreground">Company Communities</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Join communities of companies you love and stay updated on their posts, opportunities, and announcements.
                  </p>
                </div>
                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-10 flex flex-col items-center gap-3 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm font-semibold text-foreground">Communities coming soon</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Companies are being onboarded. You'll be notified when communities go live.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── OPEN SOURCE TAB ──────────────────────────────────── */}
            {activeTab === "opensource" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-lg font-bold text-foreground">Open Source Projects</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contribute to real company projects. When your PR gets merged, the company can issue you a certificate.
                  </p>
                </div>
                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-10 flex flex-col items-center gap-3 text-center">
                    <GitMerge className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm font-semibold text-foreground">Projects coming soon</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Companies are setting up their open source repositories. Check back soon.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── DIGEST TAB ───────────────────────────────────────── */}
            {activeTab === "digest" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-lg font-bold text-foreground">Email Digest Settings</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose how often you receive new job posting alerts from PortalAcademia.
                  </p>
                </div>
                {!isPremium ? (
                  <PremiumLockedBanner onUpgrade={() => setShowPaymentModal(true)} />
                ) : (
                  <div className="flex flex-col gap-4 max-w-lg">
                    {[
                      { id: "instant", label: "Instant", desc: "Email sent as soon as a new posting is live." },
                      { id: "daily",   label: "Daily Digest", desc: "One summary email every day at 9:00 AM." },
                      { id: "weekly",  label: "Weekly Digest", desc: "One summary email every Monday morning." },
                      { id: "none",    label: "Off", desc: "No email alerts. Browse manually on the dashboard." },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-primary/40 transition-all"
                      >
                        <input type="radio" name="digest" value={opt.id} className="mt-0.5 accent-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                    <button className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                      Save Preferences
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} hasUsedTrial={membership?.hasUsedTrial ?? false} />}
    </div>
  );
}
