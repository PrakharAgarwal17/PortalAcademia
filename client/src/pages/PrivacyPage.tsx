import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Bot,
  Database,
  Eye,
  KeyRound,
  FileCheck2,
  CheckCircle2,
  Search,
  Printer,
  Copy,
  Check,
  Video,
  Building2,
  Scale,
  Clock,
  Mail,
  UserCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  summary: string;
  content: React.ReactNode;
}

export default function PrivacyPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSectionId, setActiveSectionId] = useState<string>("scope-collection");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sections: PolicySection[] = [
    {
      id: "scope-collection",
      number: "1.0",
      title: "Information Collection & Multi-Pillar Architecture",
      icon: Database,
      badge: "Core Telemetry",
      summary: "Specific telemetry gathered across Students, Faculty, AISHE Institutions, and Corporate Partners.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia gathers and processes personal and professional data strictly to deliver talent gap analysis, skill assessments, verified mentorship, and authenticated hiring pathways. Data collection is compartmentalized across our four ecosystem pillars:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  Pillar 1: Student Scholars
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Individual
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Institutional roll number/ID, department, degree program, verified credentials, assessment telemetry, project artifact URLs, and ATS competency scorecards.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Pillar 2: Faculty & Senior Mentors
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Academic
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Academic designation, research specializations, institutional email verification status, student project endorsements, and mentorship advising logs.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Pillar 3: Higher Ed Institutions
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  AISHE Certified
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Official AISHE regulatory accreditation code, placement cell authorization credentials, student cohort readiness telemetry, and institutional audit logs.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  Pillar 4: Corporate Partners
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Corporate entity registration, verified recruiter domain credentials, opportunity requisition parameters, and applicant evaluation audit trails.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-processing",
      number: "2.0",
      title: "AI Processing & Groq LLM Inference Governance",
      icon: Bot,
      badge: "Zero Code Gen",
      summary: "How AI models (Qwen, GPT-OSS, Compound-Mini) process student career queries with zero code generation.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates a contextual AI Career Guide workspace powered by high-speed Groq Cloud LLM endpoints. We maintain strict privacy and academic integrity boundaries for all automated inferences:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Ephemeral Model Inference Stack
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inference requests are routed to high-performance candidate models including{" "}
              <code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">qwen/qwen3.8-27b</code>,{" "}
              <code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">openai/gpt-oss-120b</code>, and{" "}
              <code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">groq/compound-mini</code>, with seamless failover to our deterministic local telemetry reasoning engine (<code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">local-expert-rag</code>).
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Payload Minimization:</strong> Only the immediate career query, the preceding 6 conversation turns, and anonymized skill deficit indices are transmitted. Passwords, biometric identifiers, and raw academic transcripts are never sent to external LLM providers.
            </li>
            <li>
              <strong className="text-foreground font-medium">Zero Model Training on User Data:</strong> By explicit enterprise agreement with our inference compute providers, queries transmitted through PortalAcademia are ephemeral and are never retained, logged, or utilized to train future public foundation models.
            </li>
            <li>
              <strong className="text-foreground font-medium">Code Generation Prohibition:</strong> By platform policy and system prompt enforcement, the AI Counselor provides guidance, deficit breakdowns, and interview prep, but is strictly restricted from generating executable source code or answers to skill assessments.
            </li>
            <li>
              <strong className="text-foreground font-medium">Audit Telemetry:</strong> Prompts, response text, model identification, token metrics, and latency are securely logged in our MongoDB telemetry store for academic integrity auditing and model monitoring.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "webrtc-telemetry",
      number: "3.0",
      title: "WebRTC 1-on-1 Advising & Hardware Teardown Protocol",
      icon: Video,
      badge: "P2P Encrypted",
      summary: "Direct peer-to-peer WebRTC video calling with mandatory hardware track termination.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia provides direct WebRTC 1-on-1 audio, video, and screen-sharing sessions between verified senior scholars and junior student mentees. We enforce stringent privacy controls over local hardware devices:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                End-to-End Media Encryption
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Video and audio streams flow directly peer-to-peer (P2P) between participants via DTLS-SRTP encryption. Raw media packets are never routed through or stored on PortalAcademia application servers.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Guaranteed Hardware Release
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a video session concludes or the modal unmounts, all active camera, microphone, and display media tracks are explicitly halted and detached from browser memory, ensuring hardware indicator LEDs immediately extinguish.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Signaling servers record only high-level call telemetry (session start time, completion timestamp, logged duration in minutes, and optional mentee feedback ratings) necessary for issuing verifiable mentorship credentials and calculating ATS profile boosts.
          </p>
        </div>
      ),
    },
    {
      id: "authentication-security",
      number: "4.0",
      title: "Authentication, Session Cookies & Cryptographic Storage",
      icon: KeyRound,
      badge: "HttpOnly Cookies",
      summary: "HttpOnly cookie session architecture with zero localStorage JWT vulnerability.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia implements defense-in-depth architectural security to eliminate client-side token exposure and credential interception:
          </p>

          <div className="p-3.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
            <span className="font-mono font-bold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Defense-in-Depth Cookie Architecture
            </span>
            <p className="text-xs leading-relaxed">
              Authentication tokens are stored exclusively in encrypted, <code className="font-mono text-[11px] bg-secondary text-primary px-1.5 py-0.5 rounded-xs">HttpOnly</code>, <code className="font-mono text-[11px] bg-secondary text-primary px-1.5 py-0.5 rounded-xs">SameSite=Lax</code> cookies. Tokens are inaccessible to client-side JavaScript, protecting users against cross-site scripting (XSS) session hijacking.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Bcrypt Password Salting:</strong> User credentials are cryptographically salted and hashed using bcrypt with adaptive cost factors prior to database persistence. Plaintext passwords are never logged, cached, or stored.
            </li>
            <li>
              <strong className="text-foreground font-medium">Enforced TLS 1.3 Transport:</strong> All data in transit between client browsers and API endpoints is encrypted using Transport Layer Security (TLS 1.3) with mandatory CORS origin verification.
            </li>
            <li>
              <strong className="text-foreground font-medium">Zero LocalStorage Credentials:</strong> Neither JWT access tokens, session identifiers, nor sensitive profile metadata are ever placed in browser <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">localStorage</code> or <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">sessionStorage</code>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "visibility-sharing",
      number: "5.0",
      title: "Recruiter Discovery & Zero Commercial Data Brokerage",
      icon: Eye,
      badge: "No Data Sales",
      summary: "Zero commercial data selling; corporate access granted solely via explicit application or open discovery.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates under a strict <strong className="text-foreground">Zero Third-Party Data Monetization</strong> policy. Student candidate telemetry is never sold to marketing brokers or ad networks. Corporate recruiters can view student profiles only under specific authorized conditions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">1. Direct Application</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a candidate applies to a verified job or internship listing, the posting recruiter receives their verified profile, match score, and assessment badges.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">2. Talent Discovery</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If discoverability is enabled, verified recruiters can review candidate competency matrices and verified skill scores.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">3. Institutional Seal</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Placement officers (TPOs) may endorse select candidates, attaching an official verified seal to student requisitions.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dpdp-compliance",
      number: "6.0",
      title: "DPDP Act 2023 Compliance & Data Subject Rights",
      icon: FileCheck2,
      badge: "Statutory Rights",
      summary: "Full compliance with India's Digital Personal Data Protection Act 2023, including right to correction and erasure.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            In alignment with India's <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong> and international academic data governance standards, PortalAcademia guarantees all users sovereign rights over their digital identity:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Access & Data Portability</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Request an export of your complete profile history, verified skill achievements, and AI consultation logs in machine-readable JSON format.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Correction & Rectification</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Modify inaccurate profile details, uploaded certification links, or contact preferences directly via your account settings.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Permanent Erasure ("Right to be Forgotten")</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Initiate permanent account deletion and purging of non-regulatory telemetry records by emailing our Data Protection Officer at <span className="font-mono text-primary font-medium">privacy@portalacademia.edu</span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Consent Withdrawal</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  You may withdraw consent for recruiter talent discovery or email digest notifications at any time with immediate effect.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "institutional-governance",
      number: "7.0",
      title: "Institutional Telemetry & AISHE Accreditation Governance",
      icon: Building2,
      badge: "Regulatory",
      summary: "Regulatory alignment with Ministry of Education AISHE standards and university placement cells.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia coordinates with accredited higher education institutions registered with the Ministry of Education's <strong>All India Survey on Higher Education (AISHE)</strong>.
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground block">
              Cohort Telemetry Aggregation
            </span>
            Institutional dashboards access only anonymized, aggregate cohort readiness indicators (such as department-level skill gaps, assessment completion rates, and industry placement benchmarks). Individual student assessment attempts and AI queries remain private to the student unless explicitly shared via placement applications.
          </div>
        </div>
      ),
    },
    {
      id: "dpo-grievance",
      number: "8.0",
      title: "Data Protection Officer & Statutory Grievance Redressal",
      icon: Mail,
      badge: "72h SLA",
      summary: "Dedicated grievance redressal mechanism with statutory response timelines under 72 business hours.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Pursuant to the DPDP Act 2023, PortalAcademia maintains a designated Data Protection Officer (DPO) and formal grievance redressal mechanism:
          </p>

          <div className="p-4 rounded-sm bg-card border border-border space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-mono text-muted-foreground uppercase text-[10px] block">
                  Office of the Data Protection Officer
                </span>
                <p className="font-semibold text-foreground mt-0.5">PortalAcademia Trust & Safety Council</p>
                <p className="text-muted-foreground">Technology Innovation Hub, IIT Bombay Research Park</p>
                <p className="text-muted-foreground">Powai, Mumbai, Maharashtra 400076, India</p>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="font-mono text-muted-foreground uppercase text-[10px] block">
                    Direct Email Redressal
                  </span>
                  <a
                    href="mailto:dpo@portalacademia.edu"
                    className="font-mono font-medium text-primary hover:underline"
                  >
                    dpo@portalacademia.edu
                  </a>
                </div>
                <div>
                  <span className="font-mono text-muted-foreground uppercase text-[10px] block">
                    Statutory Response Window
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Within 72 Business Hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.number.includes(q) ||
        sec.id.toLowerCase().includes(q)
    );
  }, [searchQuery, sections]);

  // Scrollspy observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const copySectionLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedSectionId(id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <title>Privacy Policy & Telemetry Governance — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia comprehensive data governance specification covering DPDP Act 2023 compliance, Groq LLM inference, HttpOnly session tokens, and student IP protection."
      />

      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {/* ── Top Header Navigation Bar ──────────────────────────────── */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            {/* Left: Breadcrumb / Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/"
                className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
                aria-label="PortalAcademia — Return to home"
              >
                <div className="w-6 h-6 rounded-xs bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs tracking-tighter">
                  PA
                </div>
                <span className="font-semibold text-xs tracking-tight text-foreground hidden sm:inline">
                  PortalAcademia
                </span>
              </Link>
              <span className="text-muted-foreground/60 text-xs hidden sm:inline">/</span>
              <span className="text-xs font-mono font-medium text-muted-foreground truncate">
                Legal &amp; Governance
              </span>
            </div>

            {/* Center: Legal Suite Document Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-secondary/60 p-1 rounded-sm border border-border text-xs">
              <span className="px-3 py-1 rounded-xs font-semibold bg-card text-foreground shadow-2xs">
                Privacy Policy
              </span>
              <Link
                to="/terms"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/faq"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                title="Print Policy Specification"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-sm border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                id="privacy-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 rounded-sm border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>

              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
              >
                <span>Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero & Document Header ───────────────────────────────── */}
        <section className="border-b border-border bg-muted/15 print:border-none print:bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-xs font-semibold">
                  <Lock className="w-3 h-3" />
                  STATUTORY TELEMETRY SPECIFICATION
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">REVISION 3.2.0</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">DPDP ACT (INDIA) 2023 ALIGNED</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                Privacy Policy &amp; Telemetry Governance
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Transparent statutory specification governing how PortalAcademia protects student telemetry, AI Career Counselor queries, WebRTC media sessions, and AISHE institutional compliance records.
              </p>
            </div>

            {/* Executive Key Guarantees Bento Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Data Ownership
                </span>
                <p className="text-xs font-bold text-foreground">Zero Commercial Sales</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Candidate telemetry is never sold to marketing brokers or advertisers.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-500" />
                  Session Guard
                </span>
                <p className="text-xs font-bold text-foreground">HttpOnly Auth Cookies</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Tokens are never stored in localStorage, blocking script theft.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Bot className="w-3 h-3 text-emerald-500" />
                  AI Boundaries
                </span>
                <p className="text-xs font-bold text-foreground">Zero Model Training</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Groq LLM queries are ephemeral and never used for public training.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  Statutory SLA
                </span>
                <p className="text-xs font-bold text-foreground">&lt; 72h DPO Redressal</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Formal DPDP Act grievance response SLA under 72 business hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Two-Column Reading Area ─────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Sticky Left Navigation Sidebar (Desktop) ─────────── */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4 print:hidden">
              <div className="p-4 rounded-sm bg-card border border-border space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Table of Contents
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {sections.length} Provisions
                  </span>
                </div>

                {/* Filter / Search input inside TOC */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search policy clauses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-7 py-1 text-xs bg-background border border-border rounded-xs text-foreground focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/60"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Clause List */}
                <nav className="flex flex-col gap-0.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredSections.map((sec) => {
                    const isActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-xs text-xs font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer group",
                          isActive
                            ? "bg-secondary text-foreground font-semibold border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
                            § {sec.number}
                          </span>
                          <span className="truncate">{sec.title}</span>
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-background border border-border text-muted-foreground shrink-0">
                          {sec.badge}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* DPO Quick Contact Card */}
              <div className="p-3.5 rounded-sm bg-muted/30 border border-border space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Data Protection Officer
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Have an enquiry or want to exercise your DPDP rights?
                </p>
                <a
                  href="mailto:privacy@portalacademia.edu"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>privacy@portalacademia.edu</span>
                </a>
              </div>
            </aside>

            {/* ── Main Document Clauses Stream (Right) ─────────────── */}
            <main className="lg:col-span-8 space-y-6">
              {/* Mobile Search Bar */}
              <div className="lg:hidden relative print:hidden">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search policy clauses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs bg-card border border-border rounded-sm text-foreground focus:outline-none focus:border-foreground/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredSections.length === 0 ? (
                <div className="p-12 rounded-sm border border-dashed border-border text-center space-y-2">
                  <p className="text-xs font-semibold text-foreground">No clauses matched "{searchQuery}"</p>
                  <p className="text-[11px] text-muted-foreground">
                    Try searching for terms like "cookies", "Groq", "WebRTC", "DPDP", or "collection".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-1 rounded-sm bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 border border-border cursor-pointer mt-2"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <article
                      key={sec.id}
                      id={sec.id}
                      className="p-6 rounded-sm bg-card border border-border space-y-4 shadow-2xs scroll-mt-24"
                    >
                      {/* Clause Title & Quick Copy Link */}
                      <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3.5">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded-xs bg-primary/10 border border-primary/20">
                              § {sec.number}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                              {sec.badge}
                            </span>
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <span>{sec.title}</span>
                          </h2>
                        </div>

                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => copySectionLink(sec.id)}
                          title="Copy direct section link"
                          className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0 print:hidden"
                        >
                          {copiedSectionId === sec.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Clause Summary */}
                      <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-1.5 rounded-xs border-l-2 border-primary">
                        {sec.summary}
                      </p>

                      {/* Clause Detailed Body */}
                      <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-1">
                        {sec.content}
                      </div>
                    </article>
                  );
                })
              )}

              {/* ── Related Governance Cross-Links ─────────────────── */}
              <div className="p-4 rounded-sm bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">Related Governance:</span>
                  <Link to="/terms" className="text-primary hover:underline font-mono">
                    Terms &amp; Conditions
                  </Link>
                  <span>•</span>
                  <Link to="/faq" className="text-primary hover:underline font-mono">
                    FAQ &amp; Platform Guidelines
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ISO/IEC 27001 &amp; DPDP 2023 Aligned</span>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* ── Minimal Swiss Footer ─────────────────────────────────── */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-card mt-auto print:border-none print:py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>Security &amp; Statutory Telemetry Infrastructure</span>
          </div>
        </footer>
      </div>
    </>
  );
}
