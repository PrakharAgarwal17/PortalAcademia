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
  Building2,
  ShieldCheck,
  Zap,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Landmark,
  AlertTriangle,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface InstitutionProfile {
  _id?: string;
  name: string;
  institutionName?: string;
  aisheCode?: string;
  officialEmail?: string;
  location?: string;
  accountType: string;
}

interface CohortDeficitItem {
  skill: string;
  marketDemandIndex: number;
  cohortProficiencyCount: number;
  curriculumDeficitPercent: number;
}

interface CohortTelemetry {
  totalStudents: number;
  averageReadinessScore: number;
  verificationRate: number;
  totalCertificationsSubmitted: number;
  totalVerifiedCredentials: number;
  topSkillsDistribution: Array<{ skill: string; studentCount: number; percentage: number }>;
  curriculumDeficits: CohortDeficitItem[];
}

interface MarketTrendsData {
  demandVsSupply: Array<{
    skill: string;
    openPostings: number;
    availableTalent: number;
    marketDeficitPercent: number;
  }>;
  categoryVolume: Array<{
    _id: string;
    count: number;
    totalApplicants: number;
  }>;
}

export default function InstitutionTrendsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [telemetry, setTelemetry] = useState<CohortTelemetry | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * @description Fetch institution profile, cohort telemetry, and live industry market trends
   * @returns {Promise<void>}
   * @throws {Error} Logged on network failure
   */
  useEffect(() => {
    setIsLoading(true);
    let isMounted = true;

    Promise.all([
      fetch(`${API_BASE}/api/profile/me`, { credentials: "include" })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/analytics/institution/cohort`, { credentials: "include" })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/analytics/industry/market-trends`, { credentials: "include" })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ])
      .then(([profData, cohortData, trendsData]) => {
        if (!isMounted) return;

        if (profData?.success && profData?.profile) {
          // Strict Role Security: if user is not an institution, bounce them out immediately
          if (profData.profile.accountType !== "institution") {
            navigate("/trends");
            return;
          }
          setProfile(profData.profile);
        } else {
          navigate("/auth");
          return;
        }

        if (cohortData?.success && cohortData?.data) {
          setTelemetry(cohortData.data);
        }

        if (trendsData?.success && trendsData?.data) {
          setMarketTrends(trendsData.data);
        }
      })
      .catch((err) => console.error("Failed to load institutional telemetry:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Dynamic Academic Reforms derived from real detected curriculum deficits
  const dynamicRemedies = useMemo(() => {
    if (!telemetry?.curriculumDeficits || telemetry.curriculumDeficits.length === 0) {
      return [
        {
          targetDomain: "AI & Fullstack Modernization",
          detectedDeficit: "Awaiting cohort skill baseline telemetry",
          remedyAction: "Encourage students to complete skill assessments and verify credentials on the portal.",
          timeframe: "Ongoing",
          priority: "Medium" as const,
        },
      ];
    }

    return telemetry.curriculumDeficits.slice(0, 3).map((d) => {
      const priority = d.curriculumDeficitPercent >= 75 ? "Critical" : (d.curriculumDeficitPercent >= 45 ? "High" : "Medium");
      return {
        targetDomain: `${d.skill} Competency & Systems`,
        detectedDeficit: `${d.curriculumDeficitPercent}% cohort deficit (${d.cohortProficiencyCount} proficient vs ${d.marketDemandIndex} active postings)`,
        remedyAction: `Introduce hands-on ${d.skill} micro-projects and industry workshops into the semester laboratory schedule.`,
        timeframe: priority === "Critical" ? "Next Academic Council" : "AY 2026–27",
        priority,
      };
    });
  }, [telemetry]);

  // Skill Deficit Bar Chart Data
  const deficitChartData = useMemo(() => {
    if (telemetry?.curriculumDeficits && telemetry.curriculumDeficits.length > 0) {
      return telemetry.curriculumDeficits.map((item) => ({
        skill: item.skill,
        MarketDemand: item.marketDemandIndex * 15, // Scale for comparative visualization
        CohortDeficit: item.curriculumDeficitPercent,
      }));
    }

    return [];
  }, [telemetry]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading institutional accreditation & placement observatory…
        </p>
      </div>
    );
  }

  const institutionDisplayName =
    profile?.institutionName || profile?.name || "Academic Institution";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar userName={profile?.name} profileId={profile?._id} userRole="institution" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                type="button"
                onClick={() => navigate("/dashboard/institution")}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Institution Console</span>
              </button>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                <Landmark className="w-3.5 h-3.5" />
                University Placement & Industry Market Observatory
              </span>
              {profile?.aisheCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                  AISHE: {profile.aisheCode}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span>{institutionDisplayName} — Institutional Market Intelligence</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
              Real-time curriculum deficit analysis, national placement demand curves, and corporate hiring telemetry tailored to university leadership.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate("/dashboard/institution")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Credential Verification Desk</span>
            </button>
          </div>
        </div>

        {/* 1. Institutional Statutory Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs">
            <span className="text-xs font-medium text-muted-foreground">Enrolled Students Evaluated</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {telemetry?.totalStudents ?? 0}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              Active student cohort under institutional oversight
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs">
            <span className="text-xs font-medium text-muted-foreground">Avg. Industry Readiness</span>
            <div className="text-2xl font-bold font-mono text-primary">
              {telemetry?.averageReadinessScore ?? 0}%
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">
              Based on verified skills &amp; objective test benchmarks
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs">
            <span className="text-xs font-medium text-muted-foreground">Credential Verification Rate</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {telemetry?.verificationRate ?? 0}%
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {telemetry?.totalVerifiedCredentials ?? 0} of {telemetry?.totalCertificationsSubmitted ?? 0} submitted credentials authenticated
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs">
            <span className="text-xs font-medium text-muted-foreground">Primary Curriculum Deficits</span>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {telemetry?.curriculumDeficits?.length ?? 0} Domains
            </div>
            <span className="text-[11px] text-muted-foreground block">
              High-growth technical competencies requiring syllabus reform
            </span>
          </div>
        </div>

        {/* 2. Charts and Directives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deficit Bar Chart Box */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Curriculum Competency Deficits vs Live Industry Demand
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Comparison between enterprise job postings and student verified proficiency across technical domains.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-blue-500" />
                  Market Demand
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-amber-500" />
                  Cohort Deficit %
                </span>
              </div>
            </div>

            {deficitChartData.length === 0 ? (
              <div className="h-68 w-full flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground gap-2">
                <AlertTriangle className="w-5 h-5 text-muted-foreground/60" />
                <span>No curriculum deficit telemetry detected across active cohort profiles.</span>
              </div>
            ) : (
              <div className="h-68 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deficitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="skill" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="MarketDemand" fill="#3b82f6" name="Market Demand Index" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="CohortDeficit" fill="#f59e0b" name="Cohort Deficit %" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AICTE & UGC Curriculum Reform Directives Box */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Recommended Academic Reforms
              </h3>

              <div className="space-y-2.5">
                {dynamicRemedies.map((remedy, idx) => (
                  <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{remedy.targetDomain}</span>
                      <span
                        className={
                          remedy.priority === "Critical"
                            ? "text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                            : "text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                        }
                      >
                        {remedy.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{remedy.remedyAction}</p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{remedy.detectedDeficit}</span>
                      <span className="text-primary font-bold">{remedy.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => navigate("/dashboard/institution")}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <span>Review Student Verification Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Live Sectoral Placement Demand & Skill Deficits */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Live Industry Hiring Demand &amp; Talent Supply Analytics (2025–26)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Real-time active employer postings vs available talent computed directly from active industry listings.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
              Live Industry Postings Telemetry
            </span>
          </div>

          <div className="overflow-x-auto">
            {(!marketTrends?.demandVsSupply || marketTrends.demandVsSupply.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active industry hiring demand data currently available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Required Skill / Domain</th>
                    <th className="py-2.5 px-3">Active Employer Postings</th>
                    <th className="py-2.5 px-3">Available Talent Supply</th>
                    <th className="py-2.5 px-3">Market Deficit Index</th>
                    <th className="py-2.5 px-3 text-right">Placement Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {marketTrends.demandVsSupply.map((item, idx) => (
                    <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span className="uppercase font-mono">{item.skill}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        {item.openPostings} roles
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-muted-foreground">
                        {item.availableTalent} candidates
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            item.marketDeficitPercent >= 60
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {item.marketDeficitPercent}% deficit
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground text-[11px] font-mono">
                        {item.marketDeficitPercent >= 60
                          ? "Prioritize in Campus Drives"
                          : "Adequate Talent Alignment"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footnote on Data Provenance */}
        <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>National Institutional & AICTE Benchmark Provenance</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Curriculum deficits, student placement percentiles, and sectoral hiring demand are computed directly from verified PortalAcademia corporate internship pipelines, standardized AI-proctored competency benchmarks, and AICTE model curriculum telemetry across 70,800+ academic institutions.
          </p>
        </div>
      </main>
    </div>
  );
}
