import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Brain,
  Briefcase,
  BarChart3,
  Users,
  BookOpen,
  Building2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ============================================================
// Types
// ============================================================

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  audience: string;
  gradient: string;
}

interface FutureFeature {
  label: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
}

// ============================================================
// Data
// ============================================================

const features: FeatureCard[] = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Skill Gap Analysis",
    description:
      "Radar-chart visualisations mapping your competencies against live industry role requirements — pinpoint exactly what to learn next.",
    audience: "Students",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Curated Learning Paths",
    description:
      "Dynamic, personalised course recommendations targeting your specific skill gaps — not generic syllabi.",
    audience: "Students",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "Internship & Placement Desk",
    description:
      "Search, filter, apply, and track every application in one unified dashboard. Real opportunities from vetted companies.",
    audience: "Students",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Faculty Upskilling Hub",
    description:
      "Browse Faculty Development Programs and industry workshops. Deepen domain expertise to bring real-world relevance into classrooms.",
    audience: "Faculty",
    gradient: "from-orange-500 to-amber-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Recruiter Opportunity Board",
    description:
      "Post jobs, internships, and live projects. Review applicants with AI compatibility scores and manage hiring pipelines effortlessly.",
    audience: "Recruiters",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Institutional Analytics",
    description:
      "Cohort-level placement rate dashboards, readiness distributions, and market trend signals for placement cells and admins.",
    audience: "Admins",
    gradient: "from-indigo-500 to-brand-600",
  },
];

const futureFeatures: FutureFeature[] = [
  {
    label: "AI Semantic Screener",
    description: "pgvector + cosine similarity candidate ranking",
  },
  {
    label: "Cryptographic Credentials",
    description: "SHA-256 tamper-proof on-chain verification",
  },
  {
    label: "Curriculum Telemetry",
    description: "Automated alerts for systemic skill deficits",
  },
];

const stats: Stat[] = [
  { value: "4+", label: "Stakeholder Roles" },
  { value: "15+", label: "Core Features" },
  { value: "SIH", label: "26044 Project" },
  { value: "100%", label: "Cookie-based Security" },
];

// ============================================================
// Sub-components
// ============================================================

function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            Portal<span className="text-brand-600">Academia</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#roadmap" className="hover:text-foreground transition-colors">
            Roadmap
          </a>
          <a href="#about" className="hover:text-foreground transition-colors">
            About
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            id="nav-signin-btn"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
          <Button
            id="nav-getstarted-btn"
            variant="brand"
            size="sm"
            onClick={() => navigate("/auth")}
          >
            Get Started
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-mesh pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-600/30 bg-brand-600/5 text-brand-600 text-sm font-medium animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          SIH 2026 — Problem Statement 26044
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight animate-slide-up">
          Academia meets
          <br />
          <span className="text-gradient">Industry — Finally.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-slide-up [animation-delay:100ms]">
          PortalAcademia bridges the gap between what institutions teach and
          what industry needs — with skill assessments, curated learning paths,
          placement tools, and real-time analytics for every stakeholder.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 animate-slide-up [animation-delay:200ms]">
          <Button
            id="hero-get-started-btn"
            variant="brand"
            size="xl"
            onClick={() => navigate("/auth")}
            className="shadow-xl shadow-brand-600/25 animate-pulse-glow"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            id="hero-learn-more-btn"
            variant="brand-outline"
            size="xl"
            onClick={() => {
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore Features
          </Button>
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-2xl animate-fade-in [animation-delay:400ms]">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-display font-bold text-gradient">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const navigate = useNavigate();
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
            Everything your institution needs
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Built for students, faculty, recruiters, and admins — each role gets
            a tailored experience.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/60 hover:border-brand-600/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-600/8 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-600/10 text-brand-600 border border-brand-600/20">
                    {feature.audience}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA below grid */}
        <div className="mt-14 text-center">
          <Button
            id="features-cta-btn"
            variant="brand"
            size="lg"
            onClick={() => navigate("/auth")}
            className="shadow-lg shadow-brand-600/20"
          >
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <Zap className="w-5 h-5" />,
      step: "01",
      title: "Sign Up & Verify",
      body: "Register with your institutional email. Verify via OTP to ensure academic authenticity.",
    },
    {
      icon: <Users className="w-5 h-5" />,
      step: "02",
      title: "Select Your Role",
      body: "Tell us if you're a Student, Faculty member, Recruiter, or Institution Admin.",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      step: "03",
      title: "Assess & Grow",
      body: "Take skill assessments, find your gaps, follow personalised learning paths.",
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      step: "04",
      title: "Connect & Succeed",
      body: "Apply to internships, showcase your portfolio, and land your first industry role.",
    },
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
            From campus to career
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="relative flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-card hover:border-brand-600/40 hover:shadow-md transition-all duration-300"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="hidden lg:block absolute top-10 -right-3 w-6 h-[2px] bg-gradient-to-r from-border to-transparent"
                />
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-600">
                  {s.icon}
                </div>
                <span className="text-3xl font-display font-bold text-brand-600/20 leading-none">
                  {s.step}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Future Roadmap
          </p>
          <h2 className="text-4xl font-display font-bold text-foreground">
            What's coming next
          </h2>
          <p className="mt-4 text-muted-foreground">
            Ambitious features on our roadmap — currently in R&amp;D.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {futureFeatures.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-card opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Star className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {f.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.description}
                  </p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                <Clock className="w-3 h-3" />
                Future
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-purple-700 to-brand-800 p-12 text-center shadow-2xl shadow-brand-600/30">
          {/* Orbs */}
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />

          <div className="relative flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium border border-white/30">
              <Shield className="w-3.5 h-3.5" />
              Free to Join — No Credit Card Required
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
              Ready to bridge the gap?
            </h2>
            <p className="text-white/75 text-lg max-w-xl">
              Join thousands of students, faculty, and recruiters already using
              PortalAcademia to build meaningful connections.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Button
                id="cta-banner-signup-btn"
                variant="glass"
                size="xl"
                onClick={() => navigate("/auth")}
                className="border-white/30 hover:bg-white/25"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                id="cta-banner-signin-btn"
                variant="ghost"
                size="xl"
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/auth")}
              >
                Sign In Instead
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">
            Portal<span className="text-brand-600">Academia</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Smart India Hackathon 2026 — Problem Statement{" "}
          <span className="font-semibold text-brand-600">26044</span>
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PortalAcademia
        </p>
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
      <title>PortalAcademia — Academia-Industry Collaboration Platform</title>
      <meta
        name="description"
        content="PortalAcademia bridges academia and industry with skill assessments, curated learning paths, placement tools, and analytics for students, faculty, and recruiters."
      />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <RoadmapSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}
