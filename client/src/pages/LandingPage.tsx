import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  Brain,
  Building2,
  Building,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// ============================================================
// Core Value Data (Clean & High-Signal)
// ============================================================

const roles = [
  {
    icon: <Brain className="w-5 h-5 text-foreground" />,
    title: "Students",
    subtitle: "Career Readiness & Placement",
    features: [
      "Objective skill assessments & gap diagnostics",
      "Curated learning paths based on industry trends",
      "Verified digital portfolio & ATS resume builder",
      "Direct internship applications & tracking",
    ],
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-foreground" />,
    title: "Faculty",
    subtitle: "Industrial Training & Research",
    features: [
      "Access to domain corporate internships & sabbaticals",
      "Certified Faculty Development Programs (FDPs)",
      "Industry research collaborations & consultancy",
      "Real-world case studies for classroom teaching",
    ],
  },
  {
    icon: <Building className="w-5 h-5 text-foreground" />,
    title: "Institutions",
    subtitle: "Governance & Telemetry",
    features: [
      "Real-time cohort skill readiness dashboards",
      "Curriculum alignment with live hiring demand",
      "End-to-end placement & internship analytics",
      "Current student & alumni career tracking",
    ],
  },
  {
    icon: <Building2 className="w-5 h-5 text-foreground" />,
    title: "Industry",
    subtitle: "Targeted Talent Acquisition",
    features: [
      "Post internships, jobs, and live challenges",
      "Shortlist candidates by objective skill scores",
      "Sponsor custom training & pre-skilling bootcamps",
      "Direct campus R&D and faculty partnerships",
    ],
  },
];

const steps = [
  {
    num: "01",
    title: "Verify Identity",
    desc: "Sign up with your institutional email to secure role-based access as a student, faculty member, university admin, or recruiter.",
  },
  {
    num: "02",
    title: "Assess Skills",
    desc: "Benchmark technical and soft skills against live industry requirements to identify exact competency gaps.",
  },
  {
    num: "03",
    title: "Bridge Gaps",
    desc: "Follow curated learning paths, complete accredited training, and build a verified digital portfolio of work.",
  },
  {
    num: "04",
    title: "Connect & Hire",
    desc: "Apply to vetted opportunities with verified credentials, while employers discover pre-evaluated talent.",
  },
];

// ============================================================
// Components
// ============================================================

function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-none">
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
            For Stakeholders
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
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
            id="nav-getstarted-btn"
            size="sm"
            onClick={() => navigate("/auth")}
            className="h-8 px-3 text-xs font-medium"
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-border bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <Badge
          variant="secondary"
          className="mb-4 px-2.5 py-0.5 font-mono text-[11px] rounded-sm"
        >
          SIH 2026 // Problem Statement 26044
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-2xl leading-[1.15]">
          Where higher education meets industry demands.
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed mt-4">
          A centralized collaboration platform connecting students, faculty, institutions, and enterprise employers through verified skill assessments, curated training, and direct placement.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Button
            id="hero-primary-cta"
            size="sm"
            onClick={() => navigate("/auth")}
            className="h-9 px-4 text-xs font-medium"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button
            id="hero-secondary-cta"
            variant="outline"
            size="sm"
            onClick={() => {
              document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-9 px-4 text-xs font-medium"
          >
            Learn More
          </Button>
        </div>

        {/* Clean 4-Metric Grid */}
        <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm text-left">
          <div className="p-3.5">
            <p className="font-mono text-xl font-bold tabular-nums text-foreground">
              04
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core Stakeholders
            </p>
          </div>
          <div className="p-3.5">
            <p className="font-mono text-xl font-bold tabular-nums text-foreground">
              100%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified Skills
            </p>
          </div>
          <div className="p-3.5">
            <p className="font-mono text-xl font-bold tabular-nums text-foreground">
              Direct
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Industry Matching
            </p>
          </div>
          <div className="p-3.5">
            <p className="font-mono text-xl font-bold tabular-nums text-foreground">
              Real-Time
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placement Telemetry
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section id="roles" className="py-16 px-4 sm:px-6 border-b border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Built for the entire academic ecosystem
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Every stakeholder gets dedicated tools designed to eliminate guesswork and foster direct collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Card key={r.title} className="rounded-md border border-border bg-card p-5 shadow-sm">
              <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center">
                    {r.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{r.title}</CardTitle>
                    <p className="text-[11px] text-muted-foreground font-mono">{r.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-3 border-t border-border">
                <ul className="space-y-2">
                  {r.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
        <div className="text-center max-w-md mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            How PortalAcademia Works
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            From verified skill benchmarking to active recruitment in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-md bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm">
          {steps.map((s) => (
            <div key={s.num} className="p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {s.num}
                </span>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground mt-2">
                  {s.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
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
];

function FAQSection() {
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

        <Accordion type="single" collapsible className="w-full space-y-2">
          {landingFaqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-border rounded-sm px-4 bg-card"
            >
              <AccordionTrigger className="text-xs sm:text-sm py-3.5 hover:no-underline font-medium text-foreground">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground pt-1 pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="py-14 px-4 sm:px-6 border-b border-border bg-background">
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 p-8 sm:p-10 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Ready to bridge the academia-industry gap?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-2 leading-relaxed">
            Create an account today to assess skills, access verified training programs, and discover tailored career opportunities.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              id="cta-enter-btn"
              onClick={() => navigate("/auth")}
              className="bg-white text-zinc-900 hover:bg-zinc-100 h-9 px-4 text-xs font-medium"
            >
              Get Started Free
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
          <RolesSection />
          <HowItWorksSection />
          <FAQSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}
