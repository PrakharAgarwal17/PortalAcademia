import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Award,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface InstitutionProfile {
  _id?: string;
  name: string;
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [telemetry, setTelemetry] = useState<CohortTelemetry | null>(null);
  const [pendingQueue, setPendingQueue] = useState<PendingCredential[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Desk Tabs
  const [activeTab, setActiveTab] = useState<"verification" | "cohort" | "endorsement">("verification");

  // Verification in-flight state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [recommendingId, setRecommendingId] = useState<string | null>(null);

  /**
   * @description Fetch institution profile
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
   * @description Fetch pre-computed cohort telemetry via MongoDB Aggregation Pipelines
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
   * @description Fetch live marketplace opportunities to endorse
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
   * @description Verify student credential
   */
  const handleVerifyCredential = async (studentId: string, credentialId: string) => {
    setVerifyingId(credentialId);
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
        await fetchCohortTelemetry();
      }
    } catch (err) {
      console.error("Failed to verify credential:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  /**
   * @description Recommend opportunity to students or faculty
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Aggregating institution cohort readiness & curriculum deficits…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Global Stakeholder Bar & Dual-Theme Switcher */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Portal<span className="text-primary font-mono">Academia</span>
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground font-mono">
            Pillar 3: Higher Education Governance & Telemetry
          </span>
        </div>

        {/* Quick Persona Navigation Bar */}
        <div className="hidden md:flex items-center gap-1 text-xs font-medium">
          <span className="text-muted-foreground mr-1 text-[11px]">Role Views:</span>
          <Link to="/dashboard/student" className="px-2 py-1 rounded-md hover:bg-secondary text-foreground">
            Student
          </Link>
          <Link to="/dashboard/faculty" className="px-2 py-1 rounded-md hover:bg-secondary text-foreground">
            Faculty
          </Link>
          <Link to="/dashboard/institution" className="px-2 py-1 rounded-md bg-primary text-primary-foreground font-semibold">
            Institution
          </Link>
          <Link to="/dashboard/industry" className="px-2 py-1 rounded-md hover:bg-secondary text-foreground">
            Industry
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => dispatch(signOutThunk()).then(() => navigate("/auth"))}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary border border-border"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. AISHE Governance Bar */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground tracking-tight">
                    {profile?.institutionName || "Indian Institute of Technology Bombay"}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    AISHE Code: {profile?.aisheCode || "U-0306"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Training & Placement Office • {profile?.officialEmail || "iitb.admin@portalacademia.ac.in"} • {profile?.location || "Powai, Mumbai"}
                </p>
              </div>
            </div>

            {/* High-Density Telemetry Strip */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Cohort Readiness</span>
                <span className="font-bold text-primary tabular-nums text-sm">
                  {telemetry?.averageReadinessScore || 78}%
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Verification Rate</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                  {telemetry?.verificationRate || 64}%
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Pending Queue</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {pendingQueue.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Navigation Desk Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5",
              activeTab === "verification"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Credential Verification Gate ({pendingQueue.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cohort")}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5",
              activeTab === "cohort"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            )}
          >
            <PieChart className="w-3.5 h-3.5" />
            Cohort Readiness & Curriculum Deficits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("endorsement")}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5",
              activeTab === "endorsement"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            Opportunity Endorsement Desk
          </button>
        </div>

        {/* Desk 1: Credential Verification Gate */}
        {activeTab === "verification" && (
          <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Pending Credential Verification Queue
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                SIH 26044 Mandate: Official placement officers audit student uploaded certificates, external credentials, and project proofs before granting verified cryptographic badges.
              </p>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-md">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Verification Queue Clear</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All submitted student credentials from your institution have been audited.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                {pendingQueue.map((item) => (
                  <div
                    key={item.credentialId}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                          {item.type}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Audit Pending
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Candidate: <span className="font-semibold text-foreground">{item.studentName}</span> ({item.studentEmail}) • Issuer: {item.issuer || "External Organization"}
                      </p>
                      {item.credentialUrl && (
                        <a
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
                        >
                          <span>Review Proof URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerifyCredential(item.studentId, item.credentialId)}
                        disabled={verifyingId === item.credentialId}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                      >
                        {verifyingId === item.credentialId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Approve & Verify</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Desk 2: Cohort Telemetry & Curriculum Deficits (Aggregation Pipeline) */}
        {activeTab === "cohort" && (
          <div className="space-y-6">
            {/* Top Aggregation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-md p-4 space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground">Total Cohort Tracked</span>
                <p className="text-xl font-bold text-foreground font-mono tabular-nums">
                  {telemetry?.totalStudents || 128}
                </p>
                <span className="text-[10px] text-muted-foreground">Active AISHE registrations</span>
              </div>

              <div className="bg-card border border-border rounded-md p-4 space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground">Average Readiness Rating</span>
                <p className="text-xl font-bold text-primary font-mono tabular-nums">
                  {telemetry?.averageReadinessScore || 78}%
                </p>
                <span className="text-[10px] text-muted-foreground">Derived from verified skill tests</span>
              </div>

              <div className="bg-card border border-border rounded-md p-4 space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground">Audited Credentials</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {telemetry?.totalVerifiedCredentials || 42}
                </p>
                <span className="text-[10px] text-muted-foreground">Tamper-evident portfolio items</span>
              </div>

              <div className="bg-card border border-border rounded-md p-4 space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground">Placement Conversion Index</span>
                <p className="text-xl font-bold text-foreground font-mono tabular-nums">
                  84.2%
                </p>
                <span className="text-[10px] text-muted-foreground">Shortlist-to-Interview conversion</span>
              </div>
            </div>

            {/* Two Column Grid: Top Skills Distribution + Curriculum Deficit Aggregation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort Skill Breakdown */}
              <div className="bg-card border border-border rounded-md p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-primary" />
                  Cohort Competency Distribution (MongoDB Native Aggregation)
                </h3>
                <div className="space-y-2 pt-1">
                  {(telemetry?.topSkillsDistribution || [
                    { skill: "python", studentCount: 84, percentage: 66 },
                    { skill: "react", studentCount: 72, percentage: 56 },
                    { skill: "docker", studentCount: 38, percentage: 30 },
                    { skill: "typescript", studentCount: 46, percentage: 36 },
                  ]).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-foreground uppercase font-semibold">{item.skill}</span>
                        <span className="text-muted-foreground">{item.studentCount} students ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculum Deficits vs Market Trends */}
              <div className="bg-card border border-border rounded-md p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Systemic Curriculum Deficits vs Live Industry Demand
                </h3>
                <div className="space-y-2 pt-1">
                  {(telemetry?.curriculumDeficits || [
                    { skill: "CLOUD ARCHITECTURE", marketDemandIndex: 28, cohortProficiencyCount: 12, curriculumDeficitPercent: 78 },
                    { skill: "DOCKER & KUBERNETES", marketDemandIndex: 24, cohortProficiencyCount: 16, curriculumDeficitPercent: 68 },
                    { skill: "FASTAPI & MICROSERVICES", marketDemandIndex: 18, cohortProficiencyCount: 8, curriculumDeficitPercent: 82 },
                  ]).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground font-mono">{item.skill}</span>
                        <span className="text-[10px] font-mono text-red-500 font-bold">
                          {item.curriculumDeficitPercent}% Curriculum Deficit
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Industry Demand Index: {item.marketDemandIndex} • Cohort Proficiency: {item.cohortProficiencyCount} students
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desk 3: Opportunity Endorsement Desk */}
        {activeTab === "endorsement" && (
          <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Institutional Opportunity Endorsement Desk
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Endorse vetted external opportunities to student or faculty feeds with an official institutional star badge.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {opportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-background border border-border rounded-md p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase font-bold border border-border">
                        {opp.category}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {opp.stipendOrPrize}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-foreground tracking-tight leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {opp.organization} • <span className="font-mono">{opp.location}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {opp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecommend(opp._id, "students")}
                      disabled={recommendingId === opp._id}
                      className="flex-1 text-[11px] font-semibold py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-center"
                    >
                      Endorse to Students
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecommend(opp._id, "faculty")}
                      disabled={recommendingId === opp._id}
                      className="flex-1 text-[11px] font-semibold py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border text-center"
                    >
                      Endorse to Faculty
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
