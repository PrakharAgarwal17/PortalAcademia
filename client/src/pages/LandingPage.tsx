import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Brain,
  Briefcase,
  BarChart3,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============================================================
// Types
// ============================================================

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  audience: string;
}

interface RoadmapItem {
  id: string;
  name: string;
  metadata: string;
  status: string;
}

interface MetricStat {
  value: string;
  label: string;
  sublabel: string;
}

// ============================================================
// Data
// ============================================================

const features: FeatureCard[] = [
  {
    icon: <Brain className="w-4 h-4 text-foreground" />,
    title: "Skill Gap Analysis",
    description:
      "Competency vector mapping against live industry role requirements to pinpoint exact curriculum and learner deficits.",
    audience: "Student",
  },
  {
    icon: <BookOpen className="w-4 h-4 text-foreground" />,
    title: "Curated Learning Paths",
    description:
      "Structured course recommendations targeting individual skill gaps with modular outcome tracking.",
    audience: "Student",
  },
  {
    icon: <Briefcase className="w-4 h-4 text-foreground" />,
    title: "Placement & Internship Desk",
    description:
      "Unified pipeline for filtering, application dispatch, and verification directly tied to employer requirements.",
    audience: "Student",
  },
  {
    icon: <GraduationCap className="w-4 h-4 text-foreground" />,
    title: "Faculty Upskilling Registry",
    description:
      "Directory of Faculty Development Programs, industrial sabbaticals, and domain workshops with institutional tracking.",
    audience: "Faculty",
  },
  {
    icon: <Users className="w-4 h-4 text-foreground" />,
    title: "Recruiter Opportunity Board",
    description:
      "Post roles, review verified candidate profiles, inspect skill scores, and manage structured applicant funnels.",
    audience: "Recruiter",
  },
  {
    icon: <BarChart3 className="w-4 h-4 text-foreground" />,
    title: "Institutional Telemetry",
    description:
      "Cohort placement velocity dashboards, readiness distributions, and regional industry skill demand telemetry.",
    audience: "Admin",
  },
];

const roadmapItems: RoadmapItem[] = [
  {
    id: "RD-01",
    name: "AI Semantic Resume Screener",
    metadata: "pgvector + cosine similarity candidate ranking matrix",
    status: "R&D Active",
  },
  {
    id: "RD-02",
    name: "Cryptographic Credential Ledger",
    metadata: "SHA-256 tamper-evident verification protocol",
    status: "Specification",
  },
  {
    id: "RD-03",
    name: "Curriculum Deficit Telemetry",
    metadata: "Automated systemic reporting for academic boards",
    status: "Planned",
  },
];

const stats: MetricStat[] = [
  { value: "04", label: "Stakeholder Roles", sublabel: "Student, Faculty, Recruiter, Admin" },
  { value: "100%", label: "HttpOnly Security", sublabel: "Strict cookie authentication" },
  { value: "26044", label: "SIH Problem ID", sublabel: "Smart India Hackathon 2026" },
  { value: "06", label: "Core Modules", sublabel: "Integrated platform microservices" },
];

// ============================================================
// Sub-components
// ============================================================

function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-xs">
            PA
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              PortalAcademia
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
              / Enterprise
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-foreground transition-colors">
            Workflow
          </a>
          <a href="#telemetry" className="hover:text-foreground transition-colors">
            Roadmap
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <Button
            id="nav-signin-btn"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="h-8 px-3 text-xs"
          >
            Sign In
          </Button>
          <Button
            id="nav-getstarted-btn"
            variant="default"
            size="sm"
            onClick={() => navigate("/auth")}
            className="h-8 px-3 text-xs"
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-border bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Purpose-driven section label */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm border border-border bg-background text-xs font-mono tabular-nums text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          SIH 2026 // PS-26044 // Enterprise Edition
        </div>

        {/* Swiss typographic headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-3xl leading-[1.1]">
          Academia meets Industry.
          <br />
          Structured, verified, aligned.
        </h1>

        {/* Dense explanatory subheading */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed mt-5">
          PortalAcademia delivers a unified interface for skill gap diagnostics,
          curriculum alignment, and recruitment telemetry — built on a strict
          government-grade architectural standard.
        </p>

        {/* Compact action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button
            id="hero-get-started-btn"
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-9 px-4 text-xs font-medium"
          >
            Enter Platform
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button
            id="hero-learn-more-btn"
            variant="outline"
            size="lg"
            onClick={() => {
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-9 px-4 text-xs font-medium"
          >
            System Capabilities
          </Button>
        </div>

        {/* Structured tabular metrics strip */}
        <div className="mt-14 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm text-left">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 flex flex-col justify-between">
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {stat.label}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Module Registry
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
              Core Platform Services
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            Role-bounded interfaces providing deterministic workflows for universities, candidates, and industry partners.
          </p>
        </div>

        {/* Structured bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="rounded-md border border-border bg-card shadow-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="w-7 h-7 rounded-sm border border-border bg-muted flex items-center justify-center">
                  {f.icon}
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] tabular-nums rounded-sm">
                  {f.audience}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <CardTitle className="text-sm font-semibold">{f.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {f.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const steps = [
    {
      step: "01",
      code: "IDENTITY",
      title: "Credential Authentication",
      desc: "Institutional email validation with cryptographic OTP dispatch and session-bound HttpOnly cookies.",
    },
    {
      step: "02",
      code: "ROLE_ASSIGN",
      title: "Stakeholder Routing",
      desc: "Role classification across Student, Faculty, Recruiter, or Institutional Administrator domains.",
    },
    {
      step: "03",
      code: "TELEMETRY",
      title: "Competency Diagnostic",
      desc: "Baseline assessment vectors against current industry role requirements with gap quantification.",
    },
    {
      step: "04",
      code: "PIPELINE",
      title: "Industry Integration",
      desc: "Direct recruitment desk connectivity, verified skill credentials, and placement cohort analytics.",
    },
  ];

  return (
    <section id="architecture" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Architecture Workflow
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
              End-to-End Operational Lifecycle
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono tabular-nums">
            State Sequence // 4 Phases
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm">
          {steps.map((s) => (
            <div key={s.step} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-muted-foreground mb-4">
                  <span className="font-semibold text-foreground">{s.step}</span>
                  <span>[{s.code}]</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
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

function RoadmapSection() {
  return (
    <section id="telemetry" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="max-w-4xl mx-auto">
        <Card className="w-full border-border bg-card rounded-md overflow-hidden shadow-sm">
          {/* Structural Header */}
          <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-muted/40 space-y-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                R&amp;D Pipeline // Upcoming Specifications
              </span>
            </div>
            <Badge className="font-mono text-[10px] tabular-nums rounded-sm" variant="secondary">
              {roadmapItems.length} records
            </Badge>
          </CardHeader>

          {/* High-Density Row List */}
          <CardContent className="p-0 divide-y divide-border text-sm">
            {roadmapItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {item.id}
                  </span>
                  <div>
                    <p className="text-foreground font-medium text-xs sm:text-sm">
                      {item.name}
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
                      {item.metadata}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="self-start sm:self-auto font-mono text-[10px] tabular-nums rounded-sm shrink-0">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 border-b border-border">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 p-8 sm:p-10 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SIH-26044 Production Node</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Connect University &amp; Industry Systems
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
            Initialize an authenticated session to deploy skill diagnostics, participate in recruitment drives, or manage institutional telemetry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Button
              id="cta-banner-signup-btn"
              onClick={() => navigate("/auth")}
              className="bg-white text-zinc-900 hover:bg-zinc-100 h-9 px-4 text-xs font-medium"
            >
              Sign Up / Login
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono tabular-nums">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-bold text-[9px]">
            PA
          </div>
          <span className="font-semibold text-foreground">PortalAcademia</span>
          <span>// Smart India Hackathon 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Problem Statement: 26044</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Landing Page
// ============================================================

export default function LandingPage() {
  return (
    <>
      <title>PortalAcademia — Enterprise Academia-Industry Interface</title>
      <meta
        name="description"
        content="Enterprise interface bridging academia and industry with skill gap diagnostics, verified credentials, and institutional telemetry."
      />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <ArchitectureSection />
          <RoadmapSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}
