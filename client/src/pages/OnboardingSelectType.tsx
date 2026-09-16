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
  HelpCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

import studentBg from "@/assets/role-student.png";
import facultyBg from "@/assets/role-faculty.png";
import institutionBg from "@/assets/role-institution.png";
import industryBg from "@/assets/role-industry.png";

type MainCategory = "individual" | "organization";
type SubRole = "student" | "faculty" | "institution" | "industry";

interface RoleOption {
  id: SubRole;
  category: MainCategory;
  title: string;
  shortDesc: string;
  features: string[];
  icon: typeof GraduationCap;
  targetUrl: string;
  bgImage: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    category: "individual",
    title: "Student / Learner",
    shortDesc: "Objective skill assessment, verified digital portfolio, tailored resume builder, and vetted industry internships.",
    features: [
      "AI & Industry skill gap quantification",
      "Dynamic career roadmap & training paths",
      "Tamper-evident digital portfolio",
      "Direct internship & hackathon desk",
    ],
    icon: GraduationCap,
    targetUrl: "/onboarding/individual?role=student",
    bgImage: studentBg,
  },
  {
    id: "faculty",
    category: "individual",
    title: "Faculty / Academician",
    shortDesc: "Domain-specific faculty internships, FDP certifications, corporate sabbaticals, and joint research contracts.",
    features: [
      "Short-term industrial sabbaticals",
      "Verified FDP & workshop registry",
      "Industry consultancy matchmaking",
      "Classroom syllabus co-development",
    ],
    icon: BookOpenCheck,
    targetUrl: "/onboarding/individual?role=faculty",
    bgImage: facultyBg,
  },
  {
    id: "institution",
    category: "organization",
    title: "Higher Education Institution",
    shortDesc: "AISHE-verified college/university administration, student cohort skill telemetry, and placement funnel analytics.",
    features: [
      "Cohort competency distribution telemetry",
      "Predictive market demand analytics",
      "Placement & internship conversion funnel",
      "Batch-verified institutional credentials",
    ],
    icon: Building2,
    targetUrl: "/onboarding/organization?type=institution",
    bgImage: institutionBg,
  },
  {
    id: "industry",
    category: "organization",
    title: "Industry & Corporate Partner",
    shortDesc: "Post internships, search verified student competency vectors, publish problem statements, and train candidates.",
    features: [
      "Direct opportunity publishing desk",
      "Skill-weighted algorithmic candidate shortlisting",
      "Corporate-sponsored training & bootcamps",
      "University consultancy & R&D collaborations",
    ],
    icon: Briefcase,
    targetUrl: "/onboarding/organization?type=industry",
    bgImage: industryBg,
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
                  "group cursor-pointer text-left rounded-md border p-5 transition-all relative flex flex-col justify-between overflow-hidden",
                  isSelected
                    ? "border-foreground bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-foreground"
                    : "border-border bg-card hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-muted/30"
                )}
              >
                {/* Background Illustration Watermark (Adaptive Light/Dark Theme) */}
                <div
                  className={cn(
                    "absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 w-32 h-32 sm:w-40 sm:h-40 pointer-events-none select-none transition-all duration-300 ease-out",
                    isSelected
                      ? "opacity-100 dark:opacity-60 scale-105"
                      : "opacity-45 dark:opacity-20 group-hover:opacity-70 dark:group-hover:opacity-40 group-hover:scale-105"
                  )}
                >
                  <img
                    src={role.bgImage}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                      "w-full h-full object-contain transition-all duration-300",
                      isSelected
                        ? "brightness-[0.68] contrast-[1.25] saturate-[1.25] drop-shadow-md dark:brightness-[0.80]"
                        : "brightness-105 contrast-100 drop-shadow-sm"
                    )}
                  />
                </div>

                {/* Active Indicator Pin */}
                {isSelected && (
                  <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    Selected
                  </span>
                )}

                <div className="relative z-10">
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
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        {role.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-[85%] sm:max-w-[82%]">
                    {role.shortDesc}
                  </p>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block font-mono">
                      Core Workspace Modules:
                    </span>
                    {role.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-muted-foreground max-w-[85%] sm:max-w-[80%]"
                      >
                        <span className="text-foreground font-mono mt-0.5">&bull;</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            id="continue-onboarding-btn"
            onClick={handleContinue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
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
