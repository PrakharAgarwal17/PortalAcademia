import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector } from "@/context/store";
import {
  GraduationCap,
  Brain,
  Building2,
  Building,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Award,
  Briefcase,
  LineChart,
  Network,
  Sun,
  Moon,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import { useTheme } from "@/context/theme";

// ============================================================
// ============================================================
// Twinkling Stars Constellation Component (Full Page Background)
// ============================================================

function TwinklingStars() {
  const stars = [
    // Top Zone (0% - 20%)
    { top: "4%", left: "12%", size: 3, delay: "0.2s", duration: "3.5s" },
    { top: "8%", left: "84%", size: 3.5, delay: "1.7s", duration: "4.0s" },
    { top: "16%", left: "48%", size: 2.5, delay: "0.9s", duration: "3.2s" },

    // Upper-Middle Zone (20% - 40%)
    { top: "25%", left: "8%", size: 3, delay: "1.4s", duration: "3.8s" },
    { top: "28%", left: "91%", size: 3.5, delay: "2.1s", duration: "4.2s" },
    { top: "36%", left: "32%", size: 2.5, delay: "0.6s", duration: "3.0s" },

    // Middle Zone (40% - 60%)
    { top: "45%", left: "6%", size: 3.5, delay: "2.2s", duration: "3.4s" },
    { top: "49%", left: "88%", size: 2.5, delay: "0.5s", duration: "3.6s" },
    { top: "55%", left: "65%", size: 3, delay: "1.6s", duration: "4.1s" },

    // Lower-Middle Zone (60% - 80%)
    { top: "65%", left: "10%", size: 3, delay: "1.9s", duration: "3.7s" },
    { top: "69%", left: "92%", size: 3.5, delay: "0.3s", duration: "3.3s" },
    { top: "76%", left: "42%", size: 2.5, delay: "2.5s", duration: "4.0s" },

    // Bottom Zone (80% - 98%)
    { top: "84%", left: "7%", size: 3.5, delay: "2.3s", duration: "3.5s" },
    { top: "87%", left: "86%", size: 2.5, delay: "0.8s", duration: "3.8s" },
    { top: "93%", left: "22%", size: 3, delay: "1.1s", duration: "3.4s" },
    { top: "96%", left: "74%", size: 3.5, delay: "2.7s", duration: "4.2s" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {stars.map((star, i) => (
        <div
          key={`twinkle-${i}`}
          className="twinkle-star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
}


// ============================================================
// Data Models & Clean Content
// ============================================================

const roles = [
  {
    icon: <Brain className="w-5 h-5 text-foreground" />,
    title: "Students",
    roleKey: "student",
    subtitle: "Verified Skills & Career Readiness",
    badge: "Direct Hiring",
    features: [
      "Standardized assessments benchmarked to industry standards",
      "Cryptographic digital portfolio with verified proof-of-work",
      "Direct applications bypassing keyword-filtering ATS bots",
    ],
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-foreground" />,
    title: "Faculty",
    roleKey: "faculty",
    subtitle: "Industrial Training & Research Grants",
    badge: "Industry Immersion",
    features: [
      "Real-time curriculum gap discovery matched with live hiring trends",
      "Corporate sabbaticals and accredited Faculty Development Programs",
      "Direct corporate R&D problem statements and research funding",
    ],
  },
  {
    icon: <Building className="w-5 h-5 text-foreground" />,
    title: "Institutions",
    roleKey: "institution",
    subtitle: "Governance & Accreditation Telemetry",
    badge: "NEP 2020 Aligned",
    features: [
      "Departmental cohort skill readiness telemetry & benchmarking",
      "Instant 1-click audit reports for NAAC, NBA, and NIRF criteria",
      "Centralized batch placement tracking and verified alumni metrics",
    ],
  },
  {
    icon: <Building2 className="w-5 h-5 text-foreground" />,
    title: "Industry",
    roleKey: "industry",
    subtitle: "Targeted Competency-Based Talent Search",
    badge: "Zero Keyword Spam",
    features: [
      "Screen candidates strictly on functional code benchmarks",
      "Deploy custom bounties and pre-skilling talent bootcamps",
      "Fund academic research partnerships and faculty fellowships",
    ],
  },
];

const capabilities = [
  {
    icon: <Brain className="w-5 h-5 text-foreground" />,
    title: "Automated Skill Diagnostics",
    desc: "Rigorous evaluations benchmarked against Bloom's Taxonomy, measuring conceptual depth and real coding agility.",
  },
  {
    icon: <LineChart className="w-5 h-5 text-foreground" />,
    title: "Curriculum Gap Telemetry",
    desc: "Algorithmic syllabus benchmarking continuously evaluated against live requisitions to flag outdated topics.",
  },
  {
    icon: <Award className="w-5 h-5 text-foreground" />,
    title: "Verified Digital Portfolios",
    desc: "Tamper-proof digital credentials capturing code commits, percentiles, and supervisor-approved capstones.",
  },
  {
    icon: <Briefcase className="w-5 h-5 text-foreground" />,
    title: "Pre-Skilling Bootcamps",
    desc: "Industry-sponsored micro-curricula that train students on enterprise stacks with interview shortlists.",
  },
  {
    icon: <Network className="w-5 h-5 text-foreground" />,
    title: "Campus R&D Exchange",
    desc: "A collaborative portal where corporations post engineering bottlenecks with grant funding for faculty teams.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-foreground" />,
    title: "Accreditation Telemetry",
    desc: "Out-of-the-box exports aligned with NAAC, NBA, and NEP 2020 metrics, quantifying skill acquisition.",
  },
];

const comparisonRows = [
  {
    dimension: "Skill Assessment",
    traditional: "Self-declared keywords on static PDF resumes",
    portal: "Calibrated evaluations & verified coding benchmarks",
  },
  {
    dimension: "Curriculum Alignment",
    traditional: "Static 4-year syllabi revised once every decade",
    portal: "Live industry demand telemetry & gap discovery",
  },
  {
    dimension: "Recruitment Screening",
    traditional: "Arbitrary GPA cutoffs and random ATS rejections",
    portal: "Objective competency ranking & direct code challenge hiring",
  },
  {
    dimension: "Faculty Enablement",
    traditional: "Isolated theoretical pedagogy without corporate exposure",
    portal: "Corporate sabbaticals, sponsored FDPs & funded grants",
  },
  {
    dimension: "Institutional Governance",
    traditional: "Manual placement spreadsheets and anecdotal logs",
    portal: "Centralized cohort analytics & audit-ready accreditation",
  },
];

const landingFaqs = [
  {
    id: "faq-1",
    q: "How does PortalAcademia verify student skills and credentials?",
    a: "PortalAcademia uses standardized technical assessments, code evaluations, and faculty-verified project submissions to benchmark competencies directly against active industry job taxonomies.",
  },
  {
    id: "faq-2",
    q: "How do universities track student placement readiness?",
    a: "University administrators and faculty gain access to an institutional telemetry dashboard showing aggregate cohort skill benchmarks, curriculum-to-industry gaps, and placement outcomes.",
  },
  {
    id: "faq-3",
    q: "Can corporate recruiters hire directly through the platform?",
    a: "Yes. Industry partners post verified internships, full-time requisitions, and live challenges, and filter applicants by objective skill scores rather than self-reported resume claims.",
  },
  {
    id: "faq-4",
    q: "Is institutional onboarding required for students to join?",
    a: "Any student can sign up individually. However, using an authorized institutional email automatically connects the student's profile to their university's cohort analytics and campus placement drives.",
  },
  {
    id: "faq-5",
    q: "How does the platform align with National Education Policy (NEP 2020)?",
    a: "PortalAcademia directly operationalizes NEP 2020 mandates by enabling vocational micro-credentials, multi-disciplinary skill credit accumulation, and verifiable industry internships with audit logs.",
  },
  {
    id: "faq-6",
    q: "What data security measures protect student and institutional records?",
    a: "All authentication tokens use encrypted HttpOnly cookies, passwords enforce cryptographic salted bcrypt hashing, and candidate profiles are never exposed to recruiters without explicit student application consent.",
  },
];

// ============================================================
// Page Sections
// ============================================================

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          type="button"
          id="nav-logo-btn"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-85 transition-opacity group"
          aria-label="PortalAcademia — Return to top"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            PA
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">
            PortalAcademia
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
          <a href="#roles" className="hover:text-foreground transition-colors">
            Stakeholders
          </a>
          <a href="#comparison" className="hover:text-foreground transition-colors">
            Why PortalAcademia
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Capabilities
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            )}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              id="nav-console-btn"
              onClick={() => navigate(user?.isOnboarded ? "/dashboard" : "/onboarding/select-type")}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm"
            >
              Console
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : (
            <>
              <button
                type="button"
                id="nav-signin-btn"
                onClick={() => navigate("/auth")}
                className="h-9 px-3.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                id="nav-getstarted-btn"
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm"
              >
                Get Started
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);

  const previewTabs = [
    {
      id: "students",
      label: "Students",
      icon: Users,
      badge: "Skill Verified",
      title: "Objective Benchmarking & Direct Job Matching",
      stat1: { label: "Verified Index", value: "94.2%" },
      stat2: { label: "ATS Bypass", value: "100%" },
      stat3: { label: "Avg Placement", value: "9 Days" },
    },
    {
      id: "faculty",
      label: "Faculty",
      icon: GraduationCap,
      badge: "Industry Immersion",
      title: "Curriculum Gap Telemetry & Sponsored Grants",
      stat1: { label: "Live Demand Index", value: "50K+ Reqs" },
      stat2: { label: "FDP Credits", value: "100% OBE" },
      stat3: { label: "R&D Grants", value: "Active Exchange" },
    },
    {
      id: "institutions",
      label: "Institutions",
      icon: Building,
      badge: "Accreditation Ready",
      title: "Real-Time Cohort Telemetry & NEP Compliance",
      stat1: { label: "NIRF / NAAC", value: "1-Click Export" },
      stat2: { label: "ABC Credit Bank", value: "Automated" },
      stat3: { label: "Cohort Tracking", value: "Real-Time" },
    },
    {
      id: "industry",
      label: "Recruiters",
      icon: Briefcase,
      badge: "Zero Keyword Spam",
      title: "Merit-First Hiring via Live Engineering Challenges",
      stat1: { label: "Candidate Pass Rate", value: "14.8%" },
      stat2: { label: "Filter Metric", value: "Code Quality" },
      stat3: { label: "Time-to-Offer", value: "< 10 Days" },
    },
  ];

  const currentTab = previewTabs[activeTab];

  return (
    <section className="relative border-b border-border bg-transparent py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Blue Accent Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 backdrop-blur-sm text-xs font-medium text-blue-900 dark:text-blue-200 shadow-sm mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Next-Generation Academia-Industry Ecosystem</span>
        </div>

        {/* High-impact headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.14]">
          Where Higher Education Meets Live Industry Demand
        </h1>

        {/* Clean, concise subtitle */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed mt-5">
          A unified collaboration platform connecting students, faculty, universities, and enterprise recruiters through verified skill assessments, curriculum gap telemetry, and direct placements.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
          <button
            type="button"
            id="hero-primary-cta"
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 text-xs sm:text-sm font-semibold rounded-md bg-[#111827] text-white hover:bg-[#1f2937] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all shadow-sm cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <button
            type="button"
            id="hero-secondary-cta"
            onClick={() => {
              document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center h-10 px-5 text-xs sm:text-sm font-medium rounded-md border border-border bg-card/80 hover:bg-muted text-foreground transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
          >
            Explore Ecosystem
          </button>
        </div>

        {/* Spacious, De-cluttered Interactive Platform Showcase */}
        <div className="mt-14 w-full max-w-4xl">
          <div className="rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-lg overflow-hidden text-left">
            {/* Tab navigation headers */}
            <div className="flex border-b border-border bg-muted/40 overflow-x-auto scrollbar-none">
              {previewTabs.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`flex-1 min-w-[130px] px-4 py-3.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors relative cursor-pointer ${
                      isActive
                        ? "bg-card text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Showcase details container */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{currentTab.badge}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mt-1">
                    {currentTab.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline shrink-0 cursor-pointer"
                >
                  <span>Explore Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-lg border border-border bg-background/70">
                  <p className="text-xs font-mono text-muted-foreground">{currentTab.stat1.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">{currentTab.stat1.value}</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-background/70">
                  <p className="text-xs font-mono text-muted-foreground">{currentTab.stat2.label}</p>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {currentTab.stat2.value}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-background/70">
                  <p className="text-xs font-mono text-muted-foreground">{currentTab.stat3.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">{currentTab.stat3.value}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const navigate = useNavigate();

  return (
    <section id="roles" className="py-20 px-4 sm:px-6 border-b border-border bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
            Stakeholder Ecosystem
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Built for Every Higher Ed Participant
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Eliminating guesswork with tailored workspaces built specifically for students, faculty, institutions, and corporate recruiters.
          </p>
        </div>

        {/* 4 Spacious, De-cluttered Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {roles.map((r) => (
            <div
              key={r.title}
              className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50/70 dark:bg-zinc-900 border border-blue-100/80 dark:border-border flex items-center justify-center shrink-0 text-[#111827] dark:text-foreground">
                      {r.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground tracking-tight">{r.title}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{r.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50 shrink-0">
                    {r.badge}
                  </span>
                </div>

                {/* Concise bullet points with ample spacing */}
                <ul className="space-y-3 my-6">
                  {r.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Slot ready for future images/mockups */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">
                  Workspace Ready
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1"
                >
                  Join as {r.title}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 border-b border-border bg-transparent">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
            Systemic Transformation
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bridging the Academia-Industry Disconnect
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            How PortalAcademia replaces outdated legacy processes with objective, verifiable infrastructure.
          </p>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border bg-muted/40 text-xs font-mono font-semibold text-muted-foreground p-4">
            <div>DIMENSION</div>
            <div className="hidden sm:block text-destructive/80">LEGACY CAMPUS MODEL</div>
            <div className="hidden sm:block text-foreground">PORTALACADEMIA BRIDGE</div>
          </div>
          <div className="divide-y divide-border text-xs sm:text-sm">
            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:px-5 gap-2 sm:gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="font-medium text-foreground sm:col-span-1 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">0{idx + 1}.</span>
                  <span>{row.dimension}</span>
                </div>
                <div className="text-muted-foreground flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="leading-snug">{row.traditional}</span>
                </div>
                <div className="text-foreground flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{row.portal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 border-b border-border bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
            Platform Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Core Capabilities Powering Industry Alignment
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Integrated capabilities driving objective talent assessment, curriculum optimization, and direct placement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50/70 dark:bg-zinc-900 border border-blue-100/80 dark:border-border flex items-center justify-center mb-4 text-[#111827] dark:text-foreground">
                  {c.icon}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight mb-2">
                  {c.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </div>
              <div className="mt-6 pt-3.5 border-t border-border/60 text-[10px] font-mono text-muted-foreground uppercase">
                Enterprise Calibrated
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 border-b border-border bg-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Knowledge Base</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <Link
            to="/faq"
            className="text-xs font-medium text-foreground hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View all questions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="w-full space-y-3">
          {landingFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-border rounded-lg bg-card overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 sm:px-6 border-b border-border bg-transparent">
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 p-8 sm:p-14 shadow-lg">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Ready to bridge the higher education gap?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-4 leading-relaxed">
            Create an institutional or student account today to diagnose competencies, unlock verified portfolios, and accelerate corporate placement.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              id="cta-enter-btn"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center justify-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 h-10 px-6 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer shadow-sm"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-transparent py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-xs">
          {/* Col 1: Brand */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-semibold text-base tracking-tight text-foreground">
                PortalAcademia
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Unified academia-industry collaboration platform. Skill diagnostics, verified portfolios, and direct career placements.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
              <span>SIH 2026</span>
              <span className="text-zinc-400">•</span>
              <span>PS 26044</span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground tracking-tight text-xs uppercase font-mono">Platform</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <a href="#roles" className="hover:text-foreground transition-colors">
                  Stakeholders
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-foreground transition-colors">
                  Why PortalAcademia
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Capabilities
                </a>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground tracking-tight text-xs uppercase font-mono">Resources</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Knowledge Base
                </a>
              </li>
              <li>
                <span className="text-muted-foreground/70">Institutional Docs (2026)</span>
              </li>
              <li>
                <span className="text-muted-foreground/70">API Reference</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Governance */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground tracking-tight text-xs uppercase font-mono">Governance</h4>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="font-mono text-[11px] text-muted-foreground">DPDP Standards</span>
              </li>
              <li>
                <span className="font-mono text-[11px] text-muted-foreground">NEP 2020 Aligned</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
          <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Landing Page Root
// ============================================================

export default function LandingPage() {
  return (
    <>
      <title>PortalAcademia — Academia-Industry Collaboration Platform</title>
      <meta
        name="description"
        content="Connect students, faculty, universities, and industry on a unified collaboration platform with skill assessments, verified portfolios, and direct placements."
      />
      <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Full-Page Fixed Twinkling Stars Constellation Background */}
        <TwinklingStars />
        <Navbar />
        <main className="flex-1 relative z-10">
          <Hero />
          <RolesSection />
          <ComparisonSection />
          <CapabilitiesSection />
          <FAQSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}


