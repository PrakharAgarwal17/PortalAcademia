import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-xs">
            PA
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            PortalAcademia
          </span>
        </div>

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
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-border bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <span className="mb-4 inline-flex items-center px-2.5 py-0.5 font-mono text-[11px] rounded-sm bg-muted text-muted-foreground border border-border">
          SIH 2026 // Problem Statement 26044
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

        {/* 4-Metric Grid */}
        <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm text-left">
          <div className="p-4">
            <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
              04
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified Stakeholders
            </p>
          </div>
          <div className="p-4">
            <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
              180+
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Competency Taxonomies
            </p>
          </div>
          <div className="p-4">
            <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
              Direct
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Challenge-Based Hiring
            </p>
          </div>
          <div className="p-4">
            <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
              NEP 2020
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accreditation Aligned
            </p>
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
