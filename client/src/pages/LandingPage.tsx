import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Brain,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Building2,
  Lightbulb,
  CheckCircle2,
  Building,
  Target,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================================
// Types
// ============================================================

interface StakeholderDetail {
  id: string;
  role: string;
  tagline: string;
  primaryProblem: string;
  solutionCapabilities: {
    title: string;
    description: string;
    tag: string;
  }[];
}

interface CollaborativeActivity {
  title: string;
  category: string;
  description: string;
  deliverable: string;
}

// ============================================================
// Structured Context Data (Extracted from Platform Blueprint)
// ============================================================

const stakeholders: StakeholderDetail[] = [
  {
    id: "students",
    role: "Students & Learners",
    tagline: "Bridging the curriculum-to-competency gap with verifiable proof of skill.",
    primaryProblem:
      "Students lack objective measurement of their technical and soft skills against live industry benchmarks, leading to mismatched applications and unrecognized career deficits.",
    solutionCapabilities: [
      {
        title: "Objective Skill Assessment & Gap Diagnostics",
        description:
          "Industry-standard evaluation questionnaires and technical benchmarks pinpointing exact curriculum deficits and strengths.",
        tag: "DIAGNOSTICS",
      },
      {
        title: "Curated Remediation & Adaptive Learning Paths",
        description:
          "Personalized course recommendations, training modules, and certifications directly targeting identified skill gaps.",
        tag: "CURRICULUM",
      },
      {
        title: "Dynamic Career Roadmap & Market Trends",
        description:
          "Continuous telemetry tracking emerging tech stacks and demand trends to guide personalized career trajectories.",
        tag: "ROADMAP",
      },
      {
        title: "Verified Digital Portfolio & ATS Resume Builder",
        description:
          "Tamper-evident portfolio showcasing verified skills, certifications, and live projects with auto-generated role-specific resumes.",
        tag: "CREDENTIALS",
      },
      {
        title: "Skill-Matched Internship & Job Desk",
        description:
          "Direct dispatch to vetted company openings filtered by verifiable competency scores rather than random keyword matching.",
        tag: "PLACEMENT",
      },
      {
        title: "Peer Community & AI Career HelpBot",
        description:
          "Collaborative discussion forums for cohort problem solving, hackathons, and guided automated career orientation.",
        tag: "COMMUNITY",
      },
    ],
  },
  {
    id: "faculty",
    role: "Faculty & Academicians",
    tagline: "Direct industrial immersion, domain sabbaticals, and curriculum co-development.",
    primaryProblem:
      "Academicians have restricted access and visibility into corporate internships, practical domain training, and emerging industry workflows, isolating classroom teaching from production realities.",
    solutionCapabilities: [
      {
        title: "Domain-Specific Faculty Internships",
        description:
          "Direct visibility and placement into dedicated corporate internships and industrial sabbaticals for teaching personnel.",
        tag: "SABBATICALS",
      },
      {
        title: "Faculty Development Programs (FDPs)",
        description:
          "Centralized catalog of certified industry upskilling workshops, pedagogical refreshers, and advanced technology seminars.",
        tag: "UPSKILLING",
      },
      {
        title: "Collaborative Research & Consultancy Desk",
        description:
          "Direct engagement channels connecting university researchers with enterprise R&D problems, live projects, and paid consulting.",
        tag: "RESEARCH",
      },
      {
        title: "Curriculum Modernization Telemetry",
        description:
          "Access to real-world corporate case studies, dataset repositories, and industry workflows to integrate into lectures.",
        tag: "ALIGNMENT",
      },
    ],
  },
  {
    id: "institutions",
    role: "Universities & Institutions",
    tagline: "Complete governance, cohort readiness telemetry, and automated placement analytics.",
    primaryProblem:
      "Institutions lack centralized visibility into the longitudinal competency development of their student cohorts, unable to quantify placement readiness or track industry demand curves.",
    solutionCapabilities: [
      {
        title: "Cohort Skill Evolution Telemetry",
        description:
          "Real-time analytical dashboards mapping institutional competency distributions, readiness curves, and syllabus gaps.",
        tag: "ANALYTICS",
      },
      {
        title: "Student & Alumni Lifecycle Management",
        description:
          "Unified tracking database monitoring current undergraduate/postgraduate cohorts and long-term alumni career milestones.",
        tag: "GOVERNANCE",
      },
      {
        title: "Live Industry Demand Monitoring",
        description:
          "Predictive market telemetry alerting academic boards to regional and national shifts in employer technical requirements.",
        tag: "TELEMETRY",
      },
      {
        title: "Consolidated Placement & Internship Desking",
        description:
          "End-to-end recruitment funnel analytics: application volume, shortlisting conversion rates, and offer distributions.",
        tag: "PLACEMENTS",
      },
    ],
  },
  {
    id: "industry",
    role: "Industry & Enterprise",
    tagline: "Direct access to pre-assessed, verified candidate pipelines and campus partnerships.",
    primaryProblem:
      "Enterprises spend exorbitant budgets filtering thousands of unverified resumes, struggling to identify candidates with genuine practical skills matching job requirements.",
    solutionCapabilities: [
      {
        title: "Direct Opportunity & Project Dispatch",
        description:
          "Publish internships, apprenticeships, entry-level jobs, and live challenge statements with precise technical prerequisites.",
        tag: "DISPATCH",
      },
      {
        title: "Algorithmic Candidate Discovery & Shortlisting",
        description:
          "Screen applicants through objective competency vectors and standardized assessment scores, eliminating manual resume sift.",
        tag: "MATCHING",
      },
      {
        title: "Corporate Learning & Pre-Skilling Programs",
        description:
          "Sponsor custom training modules, technical challenges, and certification bootcamps to prepare students before hiring.",
        tag: "PRE-SKILLING",
      },
      {
        title: "University & Faculty Co-Innovation",
        description:
          "Collaborate directly with institutional departments on applied research, guest lectures, and innovation labs.",
        tag: "PARTNERSHIP",
      },
    ],
  },
];

const collaborativeActivities: CollaborativeActivity[] = [
  {
    title: "Innovation Challenges & Hackathons",
    category: "COMPETITION",
    description: "Enterprise sponsors post production problem statements for multi-disciplinary student teams to solve.",
    deliverable: "Working prototypes & direct fast-track interview offers",
  },
  {
    title: "Live Industry Micro-Projects",
    category: "EXPERIENTIAL",
    description: "Students earn formal academic credits and industry stipends by executing scoped engineering projects under company mentors.",
    deliverable: "Code repository commits & verified project credential",
  },
  {
    title: "Executive Seminars & Guest Masterclasses",
    category: "KNOWLEDGE_TRANSFER",
    description: "Automated booking desk enabling industry veterans to conduct domain lectures, workshops, and lab demonstrations.",
    deliverable: "Verified attendance telemetry & recorded curriculum assets",
  },
  {
    title: "1-on-1 Structured Mentorship Tracks",
    category: "MENTORSHIP",
    description: "Dedicated pairings between senior engineering practitioners and high-potential students navigating target career tracks.",
    deliverable: "Bi-weekly milestone evaluations & portfolio reviews",
  },
  {
    title: "Joint Research & Technology Transfer",
    category: "R&D_COLLABORATION",
    description: "Universities and corporate research divisions co-author papers, file patents, and transition prototypes to commercial pilot.",
    deliverable: "Intellectual property filings & research publications",
  },
];

const lifecycleSteps = [
  {
    phase: "01",
    code: "AUTHENTICATE",
    title: "Institutional Domain Verification",
    desc: "Rigorous email domain verification via 6-digit cryptographic OTP, assigning explicit RBAC privileges with zero client-token exposure.",
  },
  {
    phase: "02",
    code: "DIAGNOSE",
    title: "Objective Competency Profiling",
    desc: "Students execute standardized aptitude and technical evaluations mapped directly against current industry requirement matrices.",
  },
  {
    phase: "03",
    code: "REMEDIATE",
    title: "Targeted Gap Elimination",
    desc: "Automated routing into industry-published learning modules, certifications, and live projects to close identified curriculum deficits.",
  },
  {
    phase: "04",
    code: "EXECUTE",
    title: "Verified Placement & Telemetry",
    desc: "Algorithmically shortlisting verified profiles for corporate hiring while streaming aggregate placement metrics to institutional dashboards.",
  },
];

// ============================================================
// Navigation Header
// ============================================================

function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      {/* Top Telemetry Ribbon */}
      <div className="border-b border-border/80 bg-zinc-100 dark:bg-zinc-900 px-4 py-1 text-[11px] font-mono text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span>NATIONAL COLLABORATION NODE // SIH-26044 // MINISTRY OF AYUSH</span>
        </div>
        <div className="flex items-center gap-3">
          <span>HTTPONLY SESSION SECURITY</span>
          <span className="hidden md:inline-block">•</span>
          <span className="hidden md:inline-block">4-SIDED ECOSYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Primary Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-xs">
            PA
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-foreground leading-tight">
              PortalAcademia
            </span>
            <span className="text-[10px] font-mono text-muted-foreground leading-tight">
              Academia–Industry Collaboration
            </span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#disconnect" className="hover:text-foreground transition-colors">
            The Problem
          </a>
          <a href="#stakeholders" className="hover:text-foreground transition-colors">
            Four Stakeholders
          </a>
          <a href="#lifecycle" className="hover:text-foreground transition-colors">
            Lifecycle Flow
          </a>
          <a href="#collaboration" className="hover:text-foreground transition-colors">
            Collaborative Hub
          </a>
        </nav>

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
            id="nav-enter-btn"
            size="sm"
            onClick={() => navigate("/auth")}
            className="h-8 px-3 text-xs font-medium"
          >
            Launch Console
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Hero Section
// ============================================================

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-border bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Purpose Tag */}
        <Badge
          variant="outline"
          className="mb-6 px-3 py-1 font-mono text-xs text-muted-foreground bg-background border-border rounded-sm"
        >
          SIH 2026 // Problem Statement 26044 // Centralized Collaboration Gateway
        </Badge>

        {/* Master Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-4xl leading-[1.15]">
          Closing the divide between academic curriculum and industry competency.
        </h1>

        {/* Dense Subheading */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed mt-5">
          Universities educate; corporations innovate. Yet students struggle with unverified skill gaps,
          faculty face restricted industry exposure, and recruiters waste hundreds of hours screening unqualified resumes.
          PortalAcademia unites <strong>Students, Faculty, Institutions, and Industry</strong> onto a single deterministic platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button
            id="hero-primary-cta"
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-9 px-5 text-xs font-medium"
          >
            Access Role-Based Workspace
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
          <Button
            id="hero-secondary-cta"
            variant="outline"
            size="lg"
            onClick={() => {
              document
                .getElementById("stakeholders")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-9 px-5 text-xs font-medium"
          >
            Review Stakeholder Architecture
          </Button>
        </div>

        {/* 4 Pillars Summary Grid */}
        <div className="mt-14 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm text-left">
          <div className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1">
                <Brain className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Students</span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                Standardized skill assessments, gap analysis, dynamic roadmaps, and verified ATS resumes.
              </p>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mt-3">
              [TALENT PIPELINE]
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1">
                <GraduationCap className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Faculty</span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                Domain corporate internships, accredited FDP programs, and sponsored research consultancy.
              </p>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mt-3">
              [FACULTY IMMERSION]
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1">
                <Building className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Institutions</span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                Cohort competency telemetry, real-time market demand tracking, and placement funnel analytics.
              </p>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mt-3">
              [GOVERNANCE & TELEMETRY]
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1">
                <Building2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Industry</span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                Direct vacancy dispatch, candidate shortlisting by verified score, and corporate pre-skilling.
              </p>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mt-3">
              [CANDIDATE DISCOVERY]
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section: The Core Problem (The Systemic Disconnect)
// ============================================================

function DisconnectSection() {
  const problems = [
    {
      role: "Student Crisis",
      headline: "The Guesswork Dilemma",
      body: "Students study standardized academic syllabi without knowing what live roles actually demand. Without objective technical and soft skill tests, they apply blindly with generic resumes and struggle to pass automated screening.",
      stats: "Unclear market direction & unverified skills",
    },
    {
      role: "Faculty Isolation",
      headline: "The Industrial Exposure Vacuum",
      body: "University professors have near-zero visibility into industrial internships, live enterprise technology stacks, or funded research consultancy. Classroom teaching remains theoretical rather than aligned with actual production code.",
      stats: "Restricted visibility into corporate sabbaticals",
    },
    {
      role: "Institutional Blind Spot",
      headline: "Telemetry & Governance Deficits",
      body: "Colleges and placement cells cannot measure cohort competency in real time. They lack data on which specific technologies are surging in demand, leading to sluggish curriculum revisions and declining campus placement rates.",
      stats: "No aggregate student skill telemetry",
    },
    {
      role: "Enterprise Inefficiency",
      headline: "Exorbitant Hiring & Screening Overhead",
      body: "Recruiters are overwhelmed by thousands of low-quality, keyword-stuffed resumes. Finding candidates with genuine verified competence requires expensive multi-round testing that should have occurred in the university phase.",
      stats: "Inefficient discovery & unverified claims",
    },
  ];

  return (
    <section id="disconnect" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Systemic Problem Statement // PS-26044
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1.5">
            The Structural Disconnect in Higher Technical Education
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            India's engineering and university ecosystem produces millions of graduates, yet industry consistently reports a severe lack of job-ready talent. Here is why the existing model fails each stakeholder:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((p) => (
            <Card key={p.role} className="rounded-md border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {p.role}
                </span>
                <Badge variant="secondary" className="font-mono text-[10px] rounded-sm">
                  CRITICAL DEFICIT
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{p.headline}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {p.body}
              </p>
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <Target className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>{p.stats}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section: The Four-Pillar Solution Architecture
// ============================================================

function StakeholdersSection() {
  const [activeTab, setActiveTab] = useState("students");
  const activeStakeholder = stakeholders.find((s) => s.id === activeTab) ?? stakeholders[0];

  return (
    <section id="stakeholders" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Deterministic Modules
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
              Four-Sided Stakeholder Architecture
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-md font-mono">
            Click to inspect role-specific capabilities formulated from the Ministry blueprint.
          </p>
        </div>

        {/* Stakeholder Selector Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-10 p-1 bg-muted rounded-md mb-8">
            {stakeholders.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="rounded-sm text-xs font-medium tracking-tight"
              >
                {s.role}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Active Stakeholder View */}
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
              <div>
                <Badge variant="outline" className="font-mono text-[10px] rounded-sm mb-2">
                  STAKEHOLDER WORKSPACE // {activeStakeholder.role.toUpperCase()}
                </Badge>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeStakeholder.tagline}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  <strong>Challenge Solved:</strong> {activeStakeholder.primaryProblem}
                </p>
              </div>
            </div>

            {/* Grid of Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStakeholder.solutionCapabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-md border border-border bg-background p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="font-mono text-[9px] rounded-sm">
                        {cap.tag}
                      </Badge>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground leading-snug">
                      {cap.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
}

// ============================================================
// Section: Collaborative Activity Hub (Beyond Just Job Boards)
// ============================================================

function CollaborationSection() {
  return (
    <section id="collaboration" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-border gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Ecosystem Exchange
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
              Active Industry–Academia Collaboration Desks
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            PortalAcademia is not just a static job board — it is an active cooperative sandbox where academia and industry build together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collaborativeActivities.map((act) => (
            <Card key={act.title} className="rounded-md border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                  <Badge variant="secondary" className="font-mono text-[9px] rounded-sm">
                    {act.category}
                  </Badge>
                  <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{act.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {act.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-start gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                <FileCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>Deliverable: {act.deliverable}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section: End-to-End Operational Lifecycle
// ============================================================

function LifecycleSection() {
  return (
    <section id="lifecycle" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Sequential Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
              Deterministic User Lifecycle
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Rigorous verification from enrollment through corporate hiring.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm">
          {lifecycleSteps.map((s) => (
            <div key={s.phase} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-4">
                  <span className="font-semibold text-foreground text-sm">{s.phase}</span>
                  <Badge variant="outline" className="font-mono text-[9px] rounded-sm py-0">
                    {s.code}
                  </Badge>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  {s.title}
                </h3>
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

// ============================================================
// Section: Enterprise Security & Institutional Compliance
// ============================================================

function GovernanceSection() {
  const specs = [
    { label: "Authentication Standard", value: "HttpOnly SameSite Strict JWT Sessions" },
    { label: "Identity Verification", value: "Cryptographic 6-Digit Domain OTP" },
    { label: "Token Storage", value: "Zero Client-Side Storage (No LocalStorage)" },
    { label: "Authorization Matrix", value: "Role-Based Access Control (4 Stakeholders)" },
    { label: "Design Discipline", value: "Swiss Typographic Grid & Anti-Slop System" },
    { label: "Problem Authority", value: "Smart India Hackathon 2026 // PS 26044" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
      <div className="max-w-4xl mx-auto">
        <Card className="rounded-md border border-border bg-card p-6 shadow-sm">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  System Architecture &amp; Compliance Specification
                </span>
              </div>
              <Badge variant="secondary" className="font-mono text-[9px] rounded-sm">
                GOV-TECH SPEC
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              PortalAcademia is architected as an institutional-grade platform with hardened security protocols. All identity verification occurs server-side with strict session binding:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between p-2.5 rounded-sm border border-border bg-zinc-50 dark:bg-zinc-900/60"
                >
                  <span className="text-muted-foreground text-[11px]">{s.label}:</span>
                  <span className="text-foreground font-medium text-[11px] text-right">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ============================================================
// Section: Final Action Banner
// ============================================================

function CallToAction() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 border-b border-border">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 p-8 sm:p-12 text-center shadow-sm">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 font-mono text-[10px] rounded-sm mb-3">
            INITIALIZE SESSION GATEWAY
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Unify Your Institutional Talent Pipeline
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
            Whether you are a student evaluating competency gaps, a faculty member pursuing industrial research, an institution managing placement funnels, or an enterprise seeking verified candidates — PortalAcademia connects your workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Button
              id="cta-enter-btn"
              onClick={() => navigate("/auth")}
              className="bg-white text-zinc-900 hover:bg-zinc-100 h-9 px-5 text-xs font-medium"
            >
              Enter PortalAcademia Gateway
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Footer
// ============================================================

function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-bold text-[9px]">
            PA
          </div>
          <span className="font-semibold text-foreground">PortalAcademia</span>
          <span>// Smart India Hackathon 2026</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] tabular-nums">
          <span>Problem ID: 26044</span>
          <span>Ministry of Ayush</span>
          <span>© {new Date().getFullYear()} National Collaboration Portal</span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Root Landing Page
// ============================================================

export default function LandingPage() {
  return (
    <>
      <title>PortalAcademia — Centralized Academia-Industry Collaboration Portal</title>
      <meta
        name="description"
        content="National collaboration platform bridging academia and industry. Standardized skill assessments, verified digital portfolios, faculty industrial sabbaticals, and institutional telemetry."
      />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Hero />
          <DisconnectSection />
          <StakeholdersSection />
          <CollaborationSection />
          <LifecycleSection />
          <GovernanceSection />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}
