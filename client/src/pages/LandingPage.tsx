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
  Users,
  Cpu,
} from "lucide-react";
import { useTheme } from "@/context/theme";

// ============================================================
// Data Models & Content
// ============================================================

const roles = [
  {
    icon: <Brain className="w-5 h-5 text-foreground" />,
    title: "Students",
    subtitle: "Career Readiness & Placement",
    features: [
      "Objective skill assessments & competency gap diagnostics",
      "Curated learning paths aligned with active industry demand",
      "Verified digital portfolio with cryptographically signed badges",
      "Direct internship & graduate hiring application pipeline",
    ],
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-foreground" />,
    title: "Faculty",
    subtitle: "Industrial Training & Research",
    features: [
      "Access to domain corporate internships & sabbatical programs",
      "Certified Faculty Development Programs (FDPs) and bootcamps",
      "Industry-sponsored research grants, consultancy & R&D projects",
      "Real-world enterprise case studies for classroom curricula",
    ],
  },
  {
    icon: <Building className="w-5 h-5 text-foreground" />,
    title: "Institutions",
    subtitle: "Governance & Telemetry",
    features: [
      "Real-time cohort skill readiness telemetry & benchmarking",
      "Dynamic curriculum alignment with live enterprise hiring data",
      "Automated placement audits & NEP 2020 accreditation reporting",
      "Comprehensive alumni tracking & institutional outcome metrics",
    ],
  },
  {
    icon: <Building2 className="w-5 h-5 text-foreground" />,
    title: "Industry",
    subtitle: "Targeted Talent Acquisition",
    features: [
      "Post verified internships, full-time jobs, and live challenges",
      "Filter candidates by objective skill scores rather than keywords",
      "Sponsor pre-skilling bootcamps for custom talent incubation",
      "Direct campus R&D partnerships and funded faculty fellowships",
    ],
  },
];

const capabilities = [
  {
    icon: <Brain className="w-4 h-4 text-foreground" />,
    title: "Automated Skill Diagnostics",
    desc: "Multi-dimensional evaluations benchmarked against Bloom's Taxonomy, measuring conceptual depth, practical coding agility, and system design logic.",
  },
  {
    icon: <LineChart className="w-4 h-4 text-foreground" />,
    title: "Curriculum Gap Telemetry",
    desc: "Algorithmic syllabus analysis continuously compared against thousands of active industry requisitions to flag outdated topics and recommend updates.",
  },
  {
    icon: <Award className="w-4 h-4 text-foreground" />,
    title: "Verified Digital Portfolios",
    desc: "Tamper-proof digital credentials capturing real code commits, benchmark percentiles, and faculty-approved capstones ready for one-click ATS export.",
  },
  {
    icon: <Briefcase className="w-4 h-4 text-foreground" />,
    title: "Pre-Skilling Bootcamps",
    desc: "Industry-sponsored micro-curricula that train students on proprietary enterprise stacks with guaranteed interview shortlists upon completion.",
  },
  {
    icon: <Network className="w-4 h-4 text-foreground" />,
    title: "Campus R&D Exchange",
    desc: "A collaborative portal where corporations post real engineering bottlenecks with grant funding, engaging faculty and student research teams.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-foreground" />,
    title: "Accreditation Reporting",
    desc: "Out-of-the-box telemetry exports aligned with NAAC, NBA, and NEP 2020 parameters, quantifying student skill acquisition and placement velocity.",
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
    portal: "Real-time industry demand telemetry & gap discovery",
  },
  {
    dimension: "Recruitment Screening",
    traditional: "Arbitrary GPA filtering and random ATS rejections",
    portal: "Objective competency ranking & direct challenge hiring",
  },
  {
    dimension: "Faculty Enablement",
    traditional: "Isolated theoretical pedagogy without corporate exposure",
    portal: "Corporate sabbaticals, sponsored FDPs & funded R&D grants",
  },
  {
    dimension: "Institutional Governance",
    traditional: "Manual placement spreadsheets and anecdotal reports",
    portal: "Centralized cohort analytics & audit-ready accreditation logs",
  },
];

const steps = [
  {
    num: "01",
    title: "Verify Identity",
    desc: "Sign up with your institutional email or Google Workspace to secure verified role-based access as a student, faculty member, university admin, or recruiter.",
  },
  {
    num: "02",
    title: "Diagnose Skill Gaps",
    desc: "Benchmark your technical and domain skills against live enterprise requirements to identify exact competency deficits and target areas.",
  },
  {
    num: "03",
    title: "Bridge Gaps with Accredited Training",
    desc: "Follow curated learning paths, complete accredited industry challenges, and build an unalterable digital portfolio verified by academic supervisors.",
  },
  {
    num: "04",
    title: "Direct Placement & Corporate Engagement",
    desc: "Apply to vetted corporate opportunities with verified credentials, while employers discover pre-evaluated talent without conventional recruitment friction.",
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
    a: "Any student can sign up individually. However, using an authorized institutional email automatically connects the student's profile to their university's cohort analytics and verified campus placement drives.",
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button
          type="button"
          id="nav-logo-btn"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-85 transition-opacity group"
          aria-label="PortalAcademia — Return to top"
        >
          <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs transition-colors">
            PA
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            PortalAcademia
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#roles" className="hover:text-foreground transition-colors">
            Stakeholders
          </a>
          <a href="#comparison" className="hover:text-foreground transition-colors">
            Why PortalAcademia
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Capabilities
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            Workflow
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
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
              className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
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
                className="h-8 px-3 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                id="nav-getstarted-btn"
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
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
  const [activePillar, setActivePillar] = useState<number>(0);

  const pillars = [
    {
      id: "stakeholders",
      stat: "04",
      title: "Verified Stakeholders",
      subtitle: "Dual-Sided Unified Network",
      badge: "Synchronized",
      icon: Users,
    },
    {
      id: "taxonomies",
      stat: "180+",
      title: "Competency Taxonomies",
      subtitle: "Real-Time Gap Discovery",
      badge: "Weekly Calibrated",
      icon: Cpu,
    },
    {
      id: "hiring",
      stat: "Direct",
      title: "Challenge-Based Hiring",
      subtitle: "Bypass Resume Filters",
      badge: "Zero Keyword Spam",
      icon: Briefcase,
    },
    {
      id: "accreditation",
      stat: "NEP 2020",
      title: "Accreditation Aligned",
      subtitle: "Institutional Compliance",
      badge: "OBE & ABC Ready",
      icon: GraduationCap,
    },
  ];

  return (
    <section className="border-b border-border bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <span className="mb-4 inline-flex items-center px-2.5 py-0.5 font-mono text-[11px] rounded-sm bg-muted text-muted-foreground border border-border">
          Bridging the gap between campus skills and industry opportunities — turning potential into careers.
        </span>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-3xl leading-[1.15]">
          Where higher education meets live industry demand.
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed mt-4">
          A unified collaboration infrastructure connecting students, faculty, universities, and enterprise employers through verified skill diagnostics, automated curriculum alignment, and direct talent placements.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button
            type="button"
            id="hero-primary-cta"
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            type="button"
            id="hero-secondary-cta"
            onClick={() => {
              document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Explore Ecosystem
          </button>
        </div>

        {/* Enhanced 4-Metric Pillars & Interactive Capabilities Console */}
        <div className="mt-12 w-full max-w-4xl">
          {/* 4 Cards Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-border rounded-t-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm text-left">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isActive = activePillar === idx;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  id={`pillar-tab-${idx}`}
                  onClick={() => setActivePillar(idx)}
                  className={`p-4 text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                    isActive
                      ? "bg-muted/50 dark:bg-zinc-900 text-foreground"
                      : "hover:bg-muted/25 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Top indicator line for active card */}
                  {isActive && (
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-foreground" />
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-2xl font-bold tabular-nums text-foreground group-hover:scale-105 transition-transform inline-block">
                        {pillar.stat}
                      </span>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-xs font-medium text-foreground tracking-tight">
                      {pillar.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {pillar.subtitle}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono ${
                        isActive
                          ? "bg-foreground text-background font-semibold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? "● Active View" : pillar.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feature Intelligence Console underneath */}
          <div className="border border-t-0 border-border rounded-b-md bg-card p-5 sm:p-6 text-left shadow-sm">
            {/* Tab 0: Verified Stakeholders */}
            {activePillar === 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Pillar 01 // Multi-Stakeholder Infrastructure
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mt-0.5">
                      Dedicated Workspaces for Every Higher Ed Stakeholder
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline shrink-0"
                  >
                    Enter Stakeholder Gateway
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-foreground shrink-0">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">Students & Job Seekers</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Standardized assessments generate an unalterable Skill Index. Match directly with live internships and roles bypassing ATS keyword rejections.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Skill Index</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Verified Repo</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">1-Click Apply</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-foreground shrink-0">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">Faculty & Educators</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bridge curricula to market demand with real-time gap discovery telemetry, corporate sabbaticals, FDP badges, and industry R&D grants.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Gap Diagnostics</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Corporate FDPs</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Industry Grants</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-foreground shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">Universities & Colleges</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Monitor departmental skill readiness in real time, integrate institutional SSO for batch cohorts, and export compliance audits for NAAC & NIRF.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">NAAC Criterion 1 & 2</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">SSO Batch Roster</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Placement Heatmap</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-foreground shrink-0">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">Corporate Recruiters</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Deploy real architectural problem statements and technical bounties. Evaluate candidates strictly on functional code pass rates, not resumes.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Automated Test Suites</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Pre-Screened Roster</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">Avg 9-Day Hire</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Competency Taxonomies */}
            {activePillar === 1 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Pillar 02 // Real-Time Skill Intelligence
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mt-0.5">
                      Automated Curriculum-to-Industry Competency Matrix
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Index: 50,000+ Live Tech Requisitions
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-md border border-border bg-background">
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-muted-foreground">
                    <span>COHORT TELEMETRY: CS & SYSTEMS (BATCH 2026)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● GAP RECONCILIATION ACTIVE</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">Distributed Systems & Cloud Orchestration</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          Industry Demand: <strong className="text-foreground">96%</strong> | Syllabus: <span className="text-amber-500">48%</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: "48%" }} title="Legacy Syllabus Coverage" />
                        <div className="bg-emerald-500 h-full" style={{ width: "48%" }} title="PortalAcademia Gap Bridge" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Focus: Docker, Kubernetes, gRPC, Redis, Kafka</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">+48% gap closed via PortalAcademia bridge</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">Applied Machine Learning & Vector Systems</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          Industry Demand: <strong className="text-foreground">92%</strong> | Syllabus: <span className="text-amber-500">35%</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: "35%" }} title="Legacy Syllabus Coverage" />
                        <div className="bg-emerald-500 h-full" style={{ width: "57%" }} title="PortalAcademia Gap Bridge" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Focus: PyTorch, Vector Embeddings, LLM RAG pipelines</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">+57% gap closed via hands-on labs</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">Modern Full-Stack & System Design</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          Industry Demand: <strong className="text-foreground">89%</strong> | Syllabus: <span className="text-amber-500">52%</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: "52%" }} title="Legacy Syllabus Coverage" />
                        <div className="bg-emerald-500 h-full" style={{ width: "37%" }} title="PortalAcademia Gap Bridge" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Focus: TypeScript, React 19, Redux, API Architecture</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">+37% gap closed via product bounties</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                      Legacy Syllabus Coverage
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                      PortalAcademia Gap Bridge
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">Updated every Sunday at 00:00 UTC</span>
                </div>
              </div>
            )}

            {/* Tab 2: Challenge-Based Hiring */}
            {activePillar === 2 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pillar 03 // Meritocratic Placement
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mt-0.5">
                      Direct Placement Driven by Proof-of-Work, Not Pedigree
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Avg Placement Cycle: 9 Days
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-md border border-border bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                        ACTIVE BOUNTY // HIRING PIPELINE
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Challenge ID: #CH-8820
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Stipend: ₹60,000 + Pre-Placement Offer (PPO)
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground tracking-tight">
                    High-Throughput Financial Transaction Reconciliation Service
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Build a resilient, idempotent transaction processor handling 50,000 req/sec with zero double-spends and p99 latency &lt; 15ms. Tested against live chaos failure simulations.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/60 text-center font-mono">
                    <div className="p-2 rounded bg-muted/40">
                      <p className="text-xs text-muted-foreground">Submissions</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">384</p>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <p className="text-xs text-muted-foreground">Test Pass Rate</p>
                      <p className="text-sm font-bold text-emerald-500 mt-0.5">14.8%</p>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <p className="text-xs text-muted-foreground">Direct Interviews</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">42</p>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <p className="text-xs text-muted-foreground">ATS Keyword Weight</p>
                      <p className="text-sm font-bold text-emerald-500 mt-0.5">0.0% (Code Only)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Top 10% benchmarked code submissions automatically bypass HR resume screens and unlock technical interview rounds.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    View Live Challenges
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: NEP 2020 Accreditation Aligned */}
            {activePillar === 3 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      Pillar 04 // Statutory & Institutional Compliance
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mt-0.5">
                      Institutional Alignment with NEP 2020 & NAAC/NIRF
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    OBE & ABC Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-xs text-foreground">Academic Bank of Credits (ABC)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Converts verified industry certifications and hackathon bounties into accredited academic credits recognized across statutory universities.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-xs text-foreground">Outcome-Based Education (OBE)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Direct automated mapping of student technical competencies to Course Outcomes (CO) and Program Outcomes (PO) required for NBA accreditation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-xs text-foreground">Mandatory AICTE Internship Tracking</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Verifiable logging of remote and on-site industry internship hours, mentor evaluations, and project deliverables with unalterable audit logs.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-xs text-foreground">1-Click NIRF & NAAC Audit Exports</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Export comprehensive cohort telemetry reports for NAAC Criteria 1, 2, and 5 with verified median salaries and placement rates.
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    100% audit-proof institutional telemetry compliant with Ministry of Education regulations.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    Request Institutional Audit Suite
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section id="comparison" className="py-16 px-4 sm:px-6 border-b border-border bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">
            Systemic Transformation
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Bridging the Academia-Industry Disconnect
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            How PortalAcademia replaces outdated legacy processes with objective, verifiable infrastructure.
          </p>
        </div>

        <div className="border border-border rounded-md bg-card overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border bg-muted/40 text-xs font-mono font-semibold text-muted-foreground p-3 sm:px-4">
            <div>DIMENSION</div>
            <div className="hidden sm:block text-destructive/80">LEGACY CAMPUS MODEL</div>
            <div className="hidden sm:block text-foreground">PORTALACADEMIA BRIDGE</div>
          </div>
          <div className="divide-y divide-border text-xs">
            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-3 p-3.5 sm:px-4 gap-2 sm:gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="font-medium text-foreground sm:col-span-1 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">0{idx + 1}.</span>
                  {row.dimension}
                </div>
                <div className="text-muted-foreground flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <span>{row.traditional}</span>
                </div>
                <div className="text-foreground flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{row.portal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section id="roles" className="py-16 px-4 sm:px-6 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-10">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">
            Stakeholder Ecosystem
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Dedicated Tools for Every Participant
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Eliminating guesswork with tailored interfaces built specifically for students, faculty, institutions, and corporate recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.title} className="rounded-md border border-border bg-card p-5 shadow-sm">
              <div className="pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
                    {r.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">{r.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">{r.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <ul className="space-y-2">
                  {r.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 border-b border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">
            Platform Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            End-to-End Collaboration Infrastructure
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Six architectural pillars powering objective talent assessment, syllabus optimization, and direct placement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-md border border-border bg-card p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-7 h-7 rounded-sm bg-muted border border-border flex items-center justify-center mb-3">
                  {c.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight mb-2">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[10px] font-mono text-muted-foreground uppercase">
                Enterprise Calibrated
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-10">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">
            Operational Lifecycle
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            How the Platform Works
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            A deterministic 4-stage pipeline that transitions candidates from enrollment to verified career placements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="rounded-md border border-border bg-card p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-muted-foreground block mb-2">
                  {s.num} // STEP
                </span>
                <h3 className="text-sm font-semibold text-foreground tracking-tight mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
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
    <section id="faq" className="py-16 px-4 sm:px-6 border-b border-border bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Institutional Knowledge Base</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
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

        <div className="w-full space-y-2">
          {landingFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-border rounded-sm bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-xs sm:text-sm font-medium text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="font-medium text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
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
    <section className="py-16 px-4 sm:px-6 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 p-8 sm:p-12 shadow-sm">
          <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            Ready to bridge the higher education gap?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-3 leading-relaxed">
            Create an institutional or student account today to assess competencies, unlock verified portfolios, and accelerate corporate placement.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              id="cta-enter-btn"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center justify-center gap-1.5 bg-white text-zinc-900 hover:bg-zinc-100 h-9 px-5 text-xs font-medium rounded-md transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-[10px]">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">
                PortalAcademia
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Unified academia-industry collaboration infrastructure. Skill diagnostics, verified portfolios, and direct career placements.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border border-border bg-muted/40 font-mono text-[10px] text-muted-foreground">
              <span>SIH 2026</span>
              <span className="text-zinc-400">•</span>
              <span>PS 26044</span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-foreground tracking-tight">Platform</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#roles" className="hover:text-foreground transition-colors">
                  Stakeholder Ecosystem
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-foreground transition-colors">
                  Legacy vs. Portal
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Core Capabilities
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  Operational Workflow
                </a>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Role-Based Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Knowledge & Support */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-foreground tracking-tight">Resources</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Quick FAQ Section
                </a>
              </li>
              <li>
                <span className="text-muted-foreground/70">Institutional Docs (2026)</span>
              </li>
              <li>
                <span className="text-muted-foreground/70">API Reference (v1.0)</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-foreground tracking-tight">Governance</h4>
            <ul className="space-y-2 text-muted-foreground">
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
                <span className="font-mono text-[11px] text-muted-foreground">DPDP & GDPR Standards</span>
              </li>
              <li>
                <span className="font-mono text-[11px] text-muted-foreground">NEP 2020 Aligned</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <ComparisonSection />
          <RolesSection />
          <CapabilitiesSection />
          <HowItWorksSection />
          <FAQSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}
