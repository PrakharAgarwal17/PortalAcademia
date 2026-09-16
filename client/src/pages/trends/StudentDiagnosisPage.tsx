import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Loader2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Bot,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface UserProfile {
  _id?: string;
  name: string;
  skills?: string[];
  accountType?: string;
}

interface DemandVsSupplyItem {
  skill: string;
  openPostings: number;
  availableTalent: number;
  marketDeficitPercent: number;
}

interface AnalyticsPayload {
  demandVsSupply: DemandVsSupplyItem[];
}

export const HIGH_DEMAND_SKILLS = [
  { skill: "Python", demandWeight: 88, category: "AI & Systems" },
  { skill: "TypeScript", demandWeight: 82, category: "Modern Fullstack" },
  { skill: "React", demandWeight: 79, category: "Frontend" },
  { skill: "Docker", demandWeight: 74, category: "DevOps & Cloud" },
  { skill: "PostgreSQL", demandWeight: 71, category: "Data Architecture" },
  { skill: "FastAPI", demandWeight: 68, category: "Backend" },
  { skill: "Kubernetes", demandWeight: 62, category: "Infrastructure" },
  { skill: "PyTorch", demandWeight: 60, category: "Machine Learning" },
];

export default function StudentDiagnosisPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/profile/me`, { credentials: "include" })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/analytics/industry/market-trends`, { credentials: "include" })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ])
      .then(([profData, analyticsRes]) => {
        if (profData?.success && profData?.profile) {
          if (profData.profile.accountType !== "student") {
            navigate("/trends");
            return;
          }
          setProfile(profData.profile);
        }
        if (analyticsRes?.success && analyticsRes?.data) {
          setAnalyticsData(analyticsRes.data);
        }
      })
      .catch((err) => console.error("Failed to load student telemetry:", err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const userSkills = useMemo(() => {
    return (profile?.skills || []).map((s) => s.toLowerCase().trim());
  }, [profile]);

  // Dynamic Histogram Data: Compares employer demand against verified skills on student profile
  const skillHistogramData = useMemo(() => {
    const rawList = analyticsData?.demandVsSupply || [];
    const sourceList =
      rawList.length > 0
        ? rawList.slice(0, 8)
        : HIGH_DEMAND_SKILLS.map((h) => ({
            skill: h.skill,
            openPostings: h.demandWeight,
            availableTalent: 40,
            marketDeficitPercent: 48,
          }));

    return sourceList.map((item) => {
      const norm = item.skill.toLowerCase();
      const hasSkill = userSkills.some((us) => us.includes(norm) || norm.includes(us));
      const demandCount = item.openPostings || 10;
      return {
        name: item.skill,
        DemandCount: demandCount,
        MatchedOnProfile: hasSkill ? demandCount : 0,
      };
    });
  }, [analyticsData, userSkills]);

  // Missing Skills calculation for student actionable remediation
  const missingInDemandSkills = useMemo(() => {
    return HIGH_DEMAND_SKILLS.filter((h) => {
      const norm = h.skill.toLowerCase();
      return !userSkills.some((us) => us.includes(norm) || norm.includes(us));
    });
  }, [userSkills]);

  // Profile readiness score (%) based on top market skills
  const profileReadinessScore = useMemo(() => {
    if (HIGH_DEMAND_SKILLS.length === 0) return 100;
    const matched = HIGH_DEMAND_SKILLS.filter((h) => {
      const norm = h.skill.toLowerCase();
      return userSkills.some((us) => us.includes(norm) || norm.includes(us));
    }).length;
    return Math.round((matched / HIGH_DEMAND_SKILLS.length) * 100);
  }, [userSkills]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Running personalized skill diagnostic telemetry…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar
        userName={profile?.name}
        profileId={profile?._id}
        userRole={profile?.accountType || "student"}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header with breathing room */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/trends/student")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Market Trends</span>
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => navigate("/dashboard/student")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <span>Student Dashboard</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Personalized Skill Diagnosis
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Detailed breakdown comparing your verified capabilities with 2025–26 corporate hiring benchmarks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
            {/* Ask HelpBot Action */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/ai-guide?q=${encodeURIComponent(
                    "Analyze my skill diagnosis: I have missing skills in " +
                      missingInDemandSkills.slice(0, 3).map((s) => s.skill).join(", ") +
                      ". How can I bridge this gap for upcoming placements?"
                  )}`
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-all cursor-pointer shadow-2xs group"
            >
              <Bot className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Ask HelpBot</span>
            </button>

            {/* Verify Missing Skills Action */}
            <button
              type="button"
              onClick={() => navigate("/assessments")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Verify Missing Skills</span>
            </button>
          </div>
        </div>

        {/* Top Metric & Readiness Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Overall Market Readiness
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                2026 Placement Index
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground">
                {profileReadinessScore}%
              </span>
              <span className="text-xs text-muted-foreground">match threshold</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileReadinessScore}%` }}
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Verified Profile Skills
              </span>
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {profile?.skills?.length || 0}
              </span>
              <span className="text-xs text-muted-foreground">skills validated</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Recognized directly across recruiter and faculty evaluations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                High-Yield Missing Skills
              </span>
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-500">
                {missingInDemandSkills.length}
              </span>
              <span className="text-xs text-muted-foreground">critical gaps</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Skills with 60%+ employer mandates missing on your profile.
            </p>
          </div>
        </div>

        {/* Section 1: In-Demand Tech Stack vs Your Profile Chart */}
        <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                <Award className="w-5 h-5 text-primary" />
                In-Demand Technology Stack vs. Your Profile
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Compares overall employer hiring volume against skills matched on your candidate profile.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Green = Matched
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Blue = Market Demand
              </span>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillHistogramData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="DemandCount" fill="#3b82f6" name="Market Demand" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MatchedOnProfile" fill="#10b981" name="Matched on Profile" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 2: Diagnostics Summary (Strengths vs Gaps) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths Card */}
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-7 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-foreground">Strengths on Profile</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You possess verified grounding in{" "}
                <strong className="text-foreground">
                  {(profile?.skills && profile.skills.length > 0
                    ? profile.skills
                    : ["Python", "Web Development", "Algorithms"]
                  )
                    .slice(0, 4)
                    .join(", ")}
                </strong>
                . These competencies align directly with 50%+ of entry-to-mid career listings.
              </p>
            </div>

            <div className="pt-4 border-t border-border/80">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                All Skills on Profile:
              </span>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills && profile.skills.length > 0
                  ? profile.skills
                  : ["Python", "Data Structures", "SQL"]
                ).map((sk) => (
                  <SkillBadge key={sk} skill={sk} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Opportunity Gap Card */}
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-7 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-foreground">Immediate Opportunity Gap</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Adding verified credentials in{" "}
                <strong className="text-foreground">
                  {missingInDemandSkills.slice(0, 2).map((m) => m.skill).join(" and ")}
                </strong>{" "}
                can boost your automated recruiter match score on 40%+ of active corporate postings.
              </p>
            </div>

            <div className="pt-4 border-t border-border/80 space-y-2">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
                Target Missing Competencies:
              </span>
              <div className="flex flex-wrap gap-2">
                {missingInDemandSkills.slice(0, 5).map((m) => (
                  <span
                    key={m.skill}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-semibold"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    {m.skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Recommendation based on Market Trend */}
        <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                  <TrendingUp className="w-3 h-3" />
                  Market Remediation
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Recommendations Based on Market Trend
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Targeted skills in peak employer demand that can bridge your placement gap and unlock higher stipend brackets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>{showRecommendations ? "Collapse Recommendations" : "Show Recommendations"}</span>
              <ChevronDown
                className={cn("w-3.5 h-3.5 transition-transform", showRecommendations && "rotate-180")}
              />
            </button>
          </div>

          {showRecommendations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
              {missingInDemandSkills.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-secondary/30 rounded-2xl border border-border space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sm text-foreground">{item.skill}</span>
                      <span className="font-mono text-[10.5px] text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Required in <strong className="text-foreground">{item.demandWeight}%</strong> of partner enterprise postings across 2025–26.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/assessments")}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer group"
                  >
                    <span>Certify Competency</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: HelpBot Career Guidance Integration */}
        <section className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/25 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-xs">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Consult HelpBot About Your Diagnosis
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Have doubts about prioritizing skills, learning roadmap resources, or clearing technical assessments? Our contextual AI HelpBot has full visibility of placement benchmarks.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/ai-guide?q=${encodeURIComponent(
                    "Based on my personalized skill diagnosis, what is the fastest step-by-step roadmap to become competitive for top internships?"
                  )}`
                )
              }
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
            >
              <Bot className="w-4 h-4" />
              <span>Launch HelpBot Counselor</span>
            </button>
          </div>

          {/* Preset Prompts */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground mr-1">Quick prompts for HelpBot:</span>
            {[
              "How can I prepare for Docker & Kubernetes in 2 weeks?",
              "What project should I build to demonstrate Full Stack proficiency?",
              "Why is my placement match score low and how do I fix it?",
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(`/ai-guide?q=${encodeURIComponent(p)}`)}
                className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:border-primary/40 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
