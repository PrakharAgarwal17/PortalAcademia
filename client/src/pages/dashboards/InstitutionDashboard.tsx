import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Award,
  Check,
  ArrowRight,
  Landmark,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface InstitutionProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
  institutionName?: string;
  aisheCode?: string;
  officialEmail?: string;
  contact?: string;
  location?: string;
  accountType: string;
  bio?: string;
}

interface CohortTelemetry {
  totalStudents: number;
  averageReadinessScore: number;
  verificationRate: number;
  totalCertificationsSubmitted: number;
  totalVerifiedCredentials: number;
  topSkillsDistribution: Array<{ skill: string; studentCount: number; percentage: number }>;
  curriculumDeficits: Array<{
    skill: string;
    marketDemandIndex: number;
    cohortProficiencyCount: number;
    curriculumDeficitPercent: number;
  }>;
}

interface PendingCredential {
  studentId: string;
  studentName: string;
  studentEmail: string;
  institution: string;
  credentialId: string;
  type: "certification" | "experience";
  title: string;
  issuer?: string;
  credentialUrl?: string;
  upload?: string;
  isVerified: boolean;
}

interface Opportunity {
  _id: string;
  title: string;
  description: string;
  organization: string;
  category: string;
  domain: string;
  location: string;
  mode: string;
  duration: string;
  stipendOrPrize: string;
  requiredSkills: string[];
  recommendedToStudentsBy?: string[];
  recommendedToFacultyBy?: string[];
}

export default function InstitutionDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [telemetry, setTelemetry] = useState<CohortTelemetry | null>(null);
  const [pendingQueue, setPendingQueue] = useState<PendingCredential[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Desk Tabs: "verification" | "cohort" | "endorsement" | "accreditation"
  const [activeTab, setActiveTab] = useState<"verification" | "cohort" | "endorsement" | "accreditation">("verification");

  // In-flight actions
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [recommendingId, setRecommendingId] = useState<string | null>(null);
  const [verifiedSuccessMessage, setVerifiedSuccessMessage] = useState<string | null>(null);

  /**
   * @description Fetch verified institution profile
   * @returns {Promise<void>}
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch institution profile:", err);
    }
  }, []);

  /**
   * @description Fetch cohort readiness telemetry via MongoDB Aggregation Pipelines
   * @returns {Promise<void>}
   */
  const fetchCohortTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/institution/cohort`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setTelemetry(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cohort telemetry:", err);
    }
  }, []);

  /**
   * @description Fetch pending student credentials queue
   * @returns {Promise<void>}
   */
  const fetchPendingQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/verification/pending`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPendingQueue(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch verification queue:", err);
    }
  }, []);

  /**
   * @description Fetch active opportunities to endorse to students or faculty
   * @returns {Promise<void>}
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchProfile(),
      fetchCohortTelemetry(),
      fetchPendingQueue(),
      fetchOpportunities(),
    ]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchCohortTelemetry, fetchPendingQueue, fetchOpportunities]);

  /**
   * @description Audit and verify student credential with official placement stamp
   * @param {string} studentId - Target student ID
   * @param {string} credentialId - Target credential ID
   * @returns {Promise<void>}
   */
  const handleVerifyCredential = async (studentId: string, credentialId: string) => {
    setVerifyingId(credentialId);
    setVerifiedSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/verification/verify/${studentId}/${credentialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: true, verificationNotes: "Verified by Placement Cell" }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingQueue((prev) => prev.filter((p) => p.credentialId !== credentialId));
        setVerifiedSuccessMessage("Credential verified and cryptographic badge awarded!");
        await fetchCohortTelemetry();
        setTimeout(() => setVerifiedSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to verify credential:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  /**
   * @description Endorse opportunity to candidate students or faculty
   * @param {string} opportunityId - Target opportunity ID
   * @param {"students" | "faculty"} target - Target cohort
   * @returns {Promise<void>}
   */
  const handleRecommend = async (opportunityId: string, target: "students" | "faculty") => {
    setRecommendingId(opportunityId);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${opportunityId}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOpportunities();
      }
    } catch (err) {
      console.error("Failed to recommend opportunity:", err);
    } finally {
      setRecommendingId(null);
    }
  };

  const initials = profile?.institutionName || profile?.name
    ? (profile.institutionName || profile.name)
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase()
    : "INS";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading institutional cohort telemetry & governance desk…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 1. Global Stakeholder Navigation Bar */}
      <Navbar userName={profile?.name} profileId={profile?._id} userRole="institution" />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Institutional Profile & Accreditation Strip */}
        <section className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div
                onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-muted border-2 border-primary/30 flex items-center justify-center font-bold text-base text-foreground cursor-pointer hover:border-primary transition-all duration-300 overflow-hidden shadow-md group shrink-0"
                title="View Institution Profile"
              >
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="group-hover:text-primary transition-colors font-mono font-extrabold text-sm">
                    {initials}
                  </span>
                )}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
                    title="View Institution Profile"
                  >
                    {profile?.institutionName || profile?.name || "Affiliated Academic Institution"}
                  </h1>
                  <span
                    className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 text-[11px] font-bold"
                    title="AISHE Code Registered"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    AISHE: {profile?.aisheCode || "C-12840 (Active)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-[11px] font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Training & Placement Office • {profile?.officialEmail || profile?.contact || "Verified Institutional Registry"} • {profile?.location || "National Academic Zone"}
                </p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Cohort Tracked
                </span>
                <span className="font-bold text-foreground tabular-nums text-base">
                  {telemetry?.totalStudents ?? 0}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Average Readiness
                </span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {telemetry?.averageReadinessScore ?? 0}%
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Audited Portfolio
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-base">
                  {telemetry?.totalVerifiedCredentials ?? 0}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                <span className="text-primary block text-[10px] uppercase tracking-wider font-bold">
                  Audit Queue
                </span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {pendingQueue.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Success toast notification */}
        {verifiedSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>{verifiedSuccessMessage}</span>
          </div>
        )}

        {/* 3. Desk Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "verification"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Credential Verification Gate</span>
            <span
              className={cn(
                "ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === "verification"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {pendingQueue.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cohort")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "cohort"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Cohort Readiness & Deficits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("endorsement")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "endorsement"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Opportunity Endorsement Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("accreditation")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "accreditation"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>NAAC & NIRF Telemetry</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DESK 1: CREDENTIAL VERIFICATION GATE */}
        {/* ========================================================================= */}
        {activeTab === "verification" && (
          <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Candidate Credential Audit & Verification Queue
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official verification mandate: Audit student uploaded certificates and project credentials before issuing tamper-evident cryptographic badges.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 shrink-0 self-start sm:self-auto">
                {pendingQueue.length} Audits Pending
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-border rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Institutional Audit Queue Clear</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  All student certifications and experience proofs submitted under your AISHE affiliation have been audited.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/80 border border-border rounded-xl overflow-hidden bg-background">
                {pendingQueue.map((item) => (
                  <div
                    key={item.credentialId}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-foreground">{item.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-bold uppercase">
                          {item.type}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                          Pending Placement Verification
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Student: <strong className="text-foreground">{item.studentName}</strong> ({item.studentEmail})
                        </span>
                        <span>•</span>
                        <span>Issuer: <strong>{item.issuer || "External Credential Authority"}</strong></span>
                      </div>

                      {item.credentialUrl && (
                        <a
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono pt-0.5"
                        >
                          <span>Review External Proof & Cryptographic Hash</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleVerifyCredential(item.studentId, item.credentialId)}
                        disabled={verifyingId === item.credentialId}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {verifyingId === item.credentialId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Issue Badge</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* DESK 2: COHORT READINESS & CURRICULUM DEFICITS */}
        {/* ========================================================================= */}
        {activeTab === "cohort" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-xs">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Total Cohort Tracked
                </span>
                <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {telemetry?.totalStudents ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Active AISHE institutional candidates</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-xs">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Average Readiness Rating
                </span>
                <p className="text-2xl font-bold text-primary font-mono tabular-nums">
                  {telemetry?.averageReadinessScore ?? 0}%
                </p>
                <p className="text-[11px] text-muted-foreground">Synthesized from verified benchmark assessments</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-xs">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Audited Credentials
                </span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {telemetry?.totalVerifiedCredentials ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Tamper-evident portfolio items approved</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-1 shadow-xs">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Verification Rate
                </span>
                <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {telemetry?.verificationRate ?? 0}%
                </p>
                <p className="text-[11px] text-muted-foreground">Portfolio audit completion ratio</p>
              </div>
            </div>

            {/* Two Column Grid: Top Skills Distribution + Curriculum Deficit Aggregation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort Skill Breakdown */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5 uppercase font-mono">
                    <PieChart className="w-4 h-4 text-primary" />
                    Cohort Competency Distribution
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                    Live Aggregation
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {!telemetry?.topSkillsDistribution || telemetry.topSkillsDistribution.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      No cohort skill data aggregated yet.
                    </div>
                  ) : (
                    telemetry.topSkillsDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-foreground uppercase font-bold">{item.skill}</span>
                          <span className="text-muted-foreground">
                            {item.studentCount} students ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Curriculum Deficits vs Market Trends */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5 uppercase font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Curriculum Deficits vs Live Industry Demand
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                    Remediation Target
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {!telemetry?.curriculumDeficits || telemetry.curriculumDeficits.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      No curriculum deficits detected across active market opportunities.
                    </div>
                  ) : (
                    telemetry.curriculumDeficits.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground font-mono uppercase">{item.skill}</span>
                          <span className="text-[11px] font-mono text-rose-500 font-bold">
                            {item.curriculumDeficitPercent}% Deficit
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${item.curriculumDeficitPercent}%` }}
                          />
                        </div>
                        <p className="text-[10.5px] text-muted-foreground flex items-center justify-between font-mono pt-0.5">
                          <span>Market Demand Index: {item.marketDemandIndex}</span>
                          <span>Cohort Proficiency: {item.cohortProficiencyCount} students</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DESK 3: OPPORTUNITY ENDORSEMENT DESK */}
        {/* ========================================================================= */}
        {activeTab === "endorsement" && (
          <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Institutional Opportunity Endorsement Desk
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Endorse vetted corporate postings to your student and faculty feeds with an official university recommendation badge.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {opportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-card border border-border/80 hover:border-primary/40 rounded-xl p-5 flex flex-col justify-between space-y-3 transition-colors shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold border border-primary/20">
                        {opp.category}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-foreground">
                        {opp.stipendOrPrize}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground tracking-tight leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span>{opp.organization}</span> • <span className="font-mono">{opp.location}</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecommend(opp._id, "students")}
                      disabled={recommendingId === opp._id}
                      className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-center transition-colors cursor-pointer shadow-xs"
                    >
                      Endorse to Students
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecommend(opp._id, "faculty")}
                      disabled={recommendingId === opp._id}
                      className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border text-center transition-colors cursor-pointer"
                    >
                      Endorse to Faculty
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* DESK 4: NAAC & NIRF ACCREDITATION TELEMETRY */}
        {/* ========================================================================= */}
        {activeTab === "accreditation" && (
          <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  Statutory Accreditation Readiness (NAAC & NIRF Criteria)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated metric synthesis aligned with NAAC Criteria 3 (Research, Innovations & Extension) and Criteria 5 (Student Progression).
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                AISHE Audited
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">
                    NAAC Criterion 5.2 • Placement & Progression
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {telemetry?.verificationRate ?? 0}% Metric Score
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Verified Graduate Portfolio Ledger</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cryptographically audited skills, industry hackathon awards, and verified internships provide automated verifiable proof links required for peer-team inspection visits.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">
                    NAAC Criterion 3.5 • MoUs & Collaborations
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">Active Industry Linkage</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Corporate Sabbaticals & Immersion Partnerships</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Institutional endorsements and faculty industrial residencies directly feed into mandatory NIRF Perception and Outreach research indicators.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
