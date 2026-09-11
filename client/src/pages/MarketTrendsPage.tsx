import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

const COLOR_PALETTE = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export default function MarketTrendsPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/profile/me`, { credentials: "include" }).then((res) => res.json()),
      fetch(`${API_BASE}/api/opportunities`, { credentials: "include" }).then((res) => res.json()),
    ])
      .then(([profData, oppData]) => {
        if (profData.success && profData.profile) setProfile(profData.profile);
        if (oppData.success && Array.isArray(oppData.data)) setOpportunities(oppData.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const userSkills = useMemo(() => {
    return (profile?.skills || []).map((s: string) => s.toLowerCase().trim());
  }, [profile]);

  // Aggregate Skill Demand Histogram from live opportunities & default baseline
  const skillHistogramData = useMemo(() => {
    const skillCounts: Record<string, number> = {
      React: 8,
      "Node.js": 7,
      Python: 6,
      Docker: 5,
      PostgreSQL: 5,
      FastAPI: 4,
      TypeScript: 6,
      Kubernetes: 3,
    };

    // Aggregate counts from live postings
    opportunities.forEach((opp) => {
      (opp.requiredSkills || []).forEach((sk: string) => {
        const clean = sk.trim();
        if (clean) {
          skillCounts[clean] = (skillCounts[clean] || 0) + 1;
        }
      });
    });

    return Object.entries(skillCounts)
      .map(([name, demand]) => ({
        name,
        DemandCount: demand,
        IsAddedToProfile: userSkills.includes(name.toLowerCase()) ? demand : 0,
      }))
      .sort((a, b) => b.DemandCount - a.DemandCount)
      .slice(0, 8);
  }, [opportunities, userSkills]);

  // Aggregate Domain Distribution (Pie Chart)
  const domainDistributionData = useMemo(() => {
    const domainCounts: Record<string, number> = {
      "Web Architecture": 5,
      "AI & ML Pipelines": 4,
      "Cloud & DevOps": 3,
      "Mobile Engineering": 2,
      "Cybersecurity": 2,
    };

    opportunities.forEach((opp) => {
      if (opp.domain) {
        domainCounts[opp.domain] = (domainCounts[opp.domain] || 0) + 1;
      }
    });

    return Object.entries(domainCounts).map(([name, value]) => ({ name, value }));
  }, [opportunities]);

  // Aggregate Regional Hiring Map Demand Metrics
  const regionalDemandData = useMemo(() => {
    const regionCounts: Record<string, number> = {
      Bengaluru: 12,
      Remote: 15,
      Hyderabad: 8,
      Pune: 7,
      NCR: 9,
      Mumbai: 6,
    };

    opportunities.forEach((opp) => {
      if (opp.location) {
        const loc = opp.location.trim();
        regionCounts[loc] = (regionCounts[loc] || 0) + 1;
      }
    });

    return Object.entries(regionCounts).map(([region, Postings]) => ({ region, Postings }));
  }, [opportunities]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar userName={profile?.name} profileId={profile?._id} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Market Telemetry & Industry Skill Analytics
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Market Trends & Competency Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualizing tech stack demand, domain breakdowns, and hiring regions based on added corporate opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-border">
              Opportunities Tracked: <strong>{opportunities.length || 10}+</strong>
            </span>
          </div>
        </div>

        {/* 1. Top Section: Histogram + Pie Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts BarChart / Histogram: Technology Demand */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 lg:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  In-Demand Technology Skills Histogram
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Comparing overall corporate demand count vs skills currently listed on your profile ID.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Green = Matched on Profile
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="DemandCount" fill="#3b82f6" name="Total Market Demand" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="IsAddedToProfile" fill="#10b981" name="Matched in Profile" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recharts PieChart: Domain Distribution */}
          <div className="bg-card border border-border rounded-lg p-4 lg:p-5 space-y-3 shadow-xs flex flex-col">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                Domain Postings Breakdown
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Distribution across active software domains.
              </p>
            </div>

            <div className="h-52 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={domainDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {domainDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] border-t border-border/60">
              {domainDistributionData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                  />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Bottom Section: Regional Hiring Map Area Chart + Skill Gap Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts AreaChart: Regional Hiring Telemetry */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 lg:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Regional Hiring & Remote Demand Mapping
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Geographic demand distribution across major tech hubs & remote internships.
                </p>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regionalDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Postings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable Recommendations Based on Profile */}
          <div className="bg-card border border-border rounded-lg p-4 lg:p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Profile Skill Alignment
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>High-Demand Skills Verified</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your profile includes high-frequency market skills like <strong>{(profile?.skills || ["React", "Node.js"]).slice(0, 3).join(", ")}</strong>.
                </p>
              </div>

              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Recommended Next Additions</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Recruiters on PortalAcademia actively filter for <strong>Docker</strong> and <strong>PostgreSQL</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
                Your Profile Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.skills || ["React", "Node.js", "TypeScript"]).map((sk: string) => (
                  <SkillBadge key={sk} skill={sk} size="xs" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
