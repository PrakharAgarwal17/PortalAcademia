import { LogOut, Sun, Moon, Construction, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";

export default function DashboardPlaceholder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  const handleSignOut = async () => {
    await dispatch(signOutThunk());
    navigate("/auth", { replace: true });
  };

  const upcomingFeatures = [
    {
      title: "Role-Specific Telemetry Dashboards",
      desc: "Tailored views for Students, Faculty, Institutions, and Industry Partners.",
    },
    {
      title: "Verified Skill Vectors",
      desc: "Tamper-evident competency tracking & digital portfolios.",
    },
    {
      title: "Opportunities Feed & Applications",
      desc: "Live applications for Internships, Hackathons, FDPs, and Sabbaticals.",
    },
    {
      title: "Accreditation & Cohort Telemetry",
      desc: "1-click exports for NAAC, NBA, and NEP 2020 compliance.",
    },
    {
      title: "AI HelpBOT & Skill Analysis",
      desc: "Conversational AI to guide you through skill gap quantification and career paths.",
    },
    {
      title: "Industry Talent Pipeline",
      desc: "Merit-based candidate shortlisting using objective benchmark scores.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors pb-16 flex flex-col">
      {/* Console Top Navigation */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-white/95 dark:bg-zinc-900/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
            >
              <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground hidden sm:inline">
                PortalAcademia
              </span>
            </Link>
            <span className="text-border font-light">|</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground uppercase hidden md:inline">
              Console // Telemetry Workspace
            </span>
          </div>

          {/* Utility Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          Workspace Under Construction
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mb-10 leading-relaxed">
          Welcome to the PortalAcademia console. We are currently integrating the core backend APIs to bring this dashboard to life.
        </p>

        {/* Upcoming Features Checklist */}
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-sm text-left overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold tracking-tight text-foreground font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Coming Soon
            </h2>
          </div>
          <div className="divide-y divide-border">
            {upcomingFeatures.map((feat, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex gap-3 hover:bg-muted/10 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
