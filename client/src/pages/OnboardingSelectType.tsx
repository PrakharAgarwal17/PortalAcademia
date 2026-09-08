import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpenCheck,
  Building2,
  Briefcase,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

type MainCategory = "individual" | "organization";
type SubRole = "student" | "faculty" | "institution" | "industry";

interface RoleOption {
  id: SubRole;
  category: MainCategory;
  title: string;
  pillarBadge: string;
  shortDesc: string;
  features: string[];
  icon: typeof GraduationCap;
  targetUrl: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    category: "individual",
    title: "Student / Learner",
    pillarBadge: "PILLAR 1 // TALENT",
    shortDesc: "Objective skill assessment, verified digital portfolio, tailored resume builder, and vetted industry internships.",
    features: [
      "AI & Industry skill gap quantification",
      "Dynamic career roadmap & training paths",
      "Tamper-evident digital portfolio",
      "Direct internship & hackathon desk",
    ],
    icon: GraduationCap,
    targetUrl: "/onboarding/individual?role=student",
  },
  {
    id: "faculty",
    category: "individual",
    title: "Faculty / Academician",
    pillarBadge: "PILLAR 2 // RESEARCH",
    shortDesc: "Domain-specific faculty internships, FDP certifications, corporate sabbaticals, and joint research contracts.",
    features: [
      "Short-term industrial sabbaticals",
      "Verified FDP & workshop registry",
      "Industry consultancy matchmaking",
      "Classroom syllabus co-development",
    ],
    icon: BookOpenCheck,
    targetUrl: "/onboarding/individual?role=faculty",
  },
  {
    id: "institution",
    category: "organization",
    title: "Higher Education Institution",
    pillarBadge: "PILLAR 3 // GOVERNANCE",
    shortDesc: "AISHE-verified college/university administration, student cohort skill telemetry, and placement funnel analytics.",
    features: [
      "Cohort competency distribution telemetry",
      "Predictive market demand analytics",
      "Placement & internship conversion funnel",
      "Batch-verified institutional credentials",
    ],
    icon: Building2,
    targetUrl: "/onboarding/organization?type=institution",
  },
  {
    id: "industry",
    category: "organization",
    title: "Industry & Corporate Partner",
    pillarBadge: "PILLAR 4 // ENTERPRISE",
    shortDesc: "Post internships, search verified student competency vectors, publish problem statements, and train candidates.",
    features: [
      "Direct opportunity publishing desk",
      "Skill-weighted algorithmic candidate shortlisting",
      "Corporate-sponsored training & bootcamps",
      "University consultancy & R&D collaborations",
    ],
    icon: Briefcase,
    targetUrl: "/onboarding/organization?type=industry",
  },
];

export default function OnboardingSelectType() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [selectedCategory, setSelectedCategory] = useState<MainCategory>("individual");
  const [selectedRole, setSelectedRole] = useState<SubRole>("student");

  const filteredRoles = ROLE_OPTIONS.filter(
    (role) => role.category === selectedCategory
  );

  const activeOption = ROLE_OPTIONS.find((role) => role.id === selectedRole);

  const handleSignOut = async () => {
    await dispatch(signOutThunk());
    navigate("/auth", { replace: true });
  };

  const handleContinue = () => {
    if (activeOption) {
      navigate(activeOption.targetUrl);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors">
      {/* Structural Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-white/95 dark:bg-zinc-900/95 backdrop-blur-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
              aria-label="PortalAcademia — Return to top"
            >
              <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">
                PortalAcademia
              </span>
            </Link>
            <span className="hidden sm:inline-block text-border font-light">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] tabular-nums rounded-sm bg-muted text-muted-foreground border border-border">
              PHASE 2 // STAKEHOLDER ONBOARDING
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.email && (
              <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {user.email}
              </span>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-foreground" />
              )}
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Onboarded Banner if already onboarded */}
        {user?.isOnboarded && (
          <div className="mb-6 p-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Your account is already onboarded! You can update your profile parameters or proceed directly to your console.
              </span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4 hover:opacity-80"
            >
              Go to Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-muted text-muted-foreground border border-border font-mono text-[11px] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
            <span>ROLE-BASED ACCESS CONTROL // STEP 1 OF 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Select Your Account Stakeholder Type
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            PortalAcademia configures your specialized telemetry console, verification workflows, and opportunity matchmaking based on your institutional domain classification.
          </p>
        </div>

        {/* Primary Classification Switcher (Individual vs Organization) */}
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="p-1 rounded-md bg-muted border border-border grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("individual");
                setSelectedRole("student");
              }}
              className={cn(
                "py-2 px-3 text-xs font-medium rounded-sm transition-all text-center flex items-center justify-center gap-2 cursor-pointer",
                selectedCategory === "individual"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm border border-border/80 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Individual Domain</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("organization");
                setSelectedRole("institution");
              }}
              className={cn(
                "py-2 px-3 text-xs font-medium rounded-sm transition-all text-center flex items-center justify-center gap-2 cursor-pointer",
                selectedCategory === "organization"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm border border-border/80 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>Organization Domain</span>
            </button>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "cursor-pointer text-left rounded-md border p-5 transition-all relative flex flex-col justify-between",
                  isSelected
                    ? "border-foreground bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-foreground"
                    : "border-border bg-card hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-muted/30"
                )}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    Selected
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-sm flex items-center justify-center border transition-colors",
                        isSelected
                          ? "bg-foreground text-background border-foreground"
                          : "bg-muted text-foreground border-border"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase block">
                        {role.pillarBadge}
                      </span>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        {role.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {role.shortDesc}
                  </p>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block font-mono">
                      Core Workspace Modules:
                    </span>
                    {role.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span className="text-foreground font-mono mt-0.5">&bull;</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">
                    Target Route: {role.targetUrl}
                  </span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 bg-background rounded-full" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Action Footer */}
        <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Initializing setup for:{" "}
                <span className="underline decoration-muted-foreground font-mono">
                  {activeOption?.title}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                You will be guided through identity verification, domain records, and optional career data.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="continue-onboarding-btn"
            onClick={handleContinue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <span>Proceed to Workspace Setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer info note */}
        <div className="mt-8 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>
            Need institutional domain support or AISHE federation assistance? Contact the{" "}
            <Link to="/faq" className="underline hover:text-foreground">
              Support Desk
            </Link>
            .
          </span>
        </div>
      </main>
    </div>
  );
}
