import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, GraduationCap, Landmark, ArrowRight, ShieldCheck, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import StudentTrendsPage from "@/pages/trends/StudentTrendsPage";
import FacultyTrendsPage from "@/pages/trends/FacultyTrendsPage";
import InstitutionTrendsPage from "@/pages/trends/InstitutionTrendsPage";
import { API_BASE } from "@/lib/api";

interface UserProfile {
  _id?: string;
  name: string;
  accountType?: string;
}

export default function MarketTrendsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * @description Detect authenticated stakeholder account type to route to dedicated trends page
   * @returns {Promise<void>}
   */
  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/profile/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.profile) {
          setProfile(data.profile);
        }
      })
      .catch((err) => console.error("Profile resolution error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Resolving specialized observatory telemetry…
        </p>
      </div>
    );
  }

  // Automatic dedicated routing based on verified account type
  if (profile?.accountType === "faculty") {
    return <FacultyTrendsPage />;
  }

  if (profile?.accountType === "student") {
    return <StudentTrendsPage />;
  }

  if (profile?.accountType === "institution") {
    return <InstitutionTrendsPage />;
  }

  if (profile?.accountType === "industry") {
    navigate("/dashboard/industry", { replace: true });
    return null;
  }

  // Fallback Role Selector for unauthenticated or multi-role visitors
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar userName={profile?.name} profileId={profile?._id} userRole={profile?.accountType} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 lg:p-8 flex flex-col justify-center space-y-8 my-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Specialized Stakeholder Observatories
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Select Your Intelligence Observatory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Each academic stakeholder has distinct telemetry and analytical mandates. Access the verified intelligence hub tailored to your role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Portal Card */}
          <div
            onClick={() => navigate("/trends/student")}
            className="group relative bg-card border border-border/80 hover:border-primary/50 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg cursor-pointer space-y-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                  For Students & Interns
                </span>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Student Career & Tech Intelligence
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Analyze corporate hiring demand curves, verified stipend bands (₹65K–₹1.5L/mo), multi-stream trajectories, and personalized skill gap diagnostics.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Launch Student Observatory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Faculty Portal Card */}
          <div
            onClick={() => navigate("/trends/faculty")}
            className="group relative bg-card border border-border/80 hover:border-primary/50 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg cursor-pointer space-y-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                  For Faculty & Scholars
                </span>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Academic Research & R&D Grants
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Review statutory research grants (MeitY ₹760 Cr, DST-SERB ₹480 Cr), Scopus Q1 citation velocity, corporate sabbaticals, and UGC CAS promotion matrices.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Launch Faculty Observatory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Institution Portal Card */}
          <div
            onClick={() => navigate("/trends/institution")}
            className="group relative bg-card border border-border/80 hover:border-primary/50 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg cursor-pointer space-y-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                  For Colleges & Deans
                </span>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Institutional Accreditation & Deficits
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Audit curriculum skill deficits against live corporate postings, track NAAC Criterion 5 placement benchmarks, and review sectoral recruiter demand.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Launch Institution Observatory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
