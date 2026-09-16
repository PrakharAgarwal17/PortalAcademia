import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
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
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  content: React.ReactNode;
}

export default function PrivacyPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("all");

  const sections: PolicySection[] = [
    {
      id: "scope-collection",
      number: "01",
      title: "Information Collection & Multi-Pillar Architecture",
      icon: Database,
      summary: "Specific telemetry gathered across Students, Faculty, AISHE Institutions, and Corporate Partners.",
      content: (
        <div className="space-y-3">
          <p>
            PortalAcademia gathers and processes personal and professional data strictly to deliver talent gap analysis, skill assessments, and verified hiring pathways across our four ecosystem pillars:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">Pillar 1: Student Scholars</span>
              <p className="text-xs text-muted-foreground">
                Institutional roll number/ID, department, verified credentials, assessment run logs, project artifact URLs, and competency scorecards.
              </p>
            </div>
            <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">Pillar 2: Faculty & Mentors</span>
              <p className="text-xs text-muted-foreground">
                Academic designation, research specializations, institutional email verification status, and student project endorsements.
              </p>
            </div>
            <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">Pillar 3: Higher Ed Institutions</span>
              <p className="text-xs text-muted-foreground">
                Official AISHE regulatory code, placement cell authorization, student cohort readiness telemetry, and credential audit logs.
              </p>
            </div>
            <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">Pillar 4: Corporate Partners</span>
              <p className="text-xs text-muted-foreground">
                Company registration, official recruiter email, requisition criteria, and applicant evaluation audit trails.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-processing",
      number: "02",
      title: "AI Processing & Groq LLM Inference Governance",
      icon: Bot,
      summary: "How AI models (Qwen, GPT-OSS, Compound-Mini) process student career queries with zero code generation.",
      content: (
        <div className="space-y-3">
          <p>
            PortalAcademia operates a contextual AI Career Guide workspace powered by high-speed Groq Cloud LLM endpoints. We maintain strict privacy and academic integrity boundaries for all automated inferences:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Model Stack & Failover:</strong> Requests are processed through high-performance candidate models including <code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">qwen/qwen3.8-27b</code>, <code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">openai/gpt-oss-120b</code>, and <code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">groq/compound-mini</code>, with automatic failover to our deterministic local telemetry reasoning engine (<code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">local-expert-rag</code>).
            </li>
            <li>
              <strong className="text-foreground font-medium">Payload Minimization:</strong> Only the current query, the previous 6 conversation turns, and anonymized skill deficit indices are transmitted. Passwords, biometric tokens, and raw academic transcripts are never sent to external LLM providers.
            </li>
            <li>
              <strong className="text-foreground font-medium">Code Generation Prohibition:</strong> By platform policy and system prompt enforcement, the AI Counselor provides guidance, deficit breakdowns, and interview prep, but is strictly restricted from generating executable source code or answers to skill assessments.
            </li>
            <li>
              <strong className="text-foreground font-medium">Audit Logging:</strong> Prompts, response text, model identification, token metrics, and latency are securely logged in our MongoDB telemetry store for academic integrity auditing and model monitoring.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "authentication-security",
      number: "03",
      title: "Authentication, Cookies & Cryptographic Storage",
      icon: KeyRound,
      summary: "HttpOnly cookie session architecture with zero localStorage JWT vulnerability.",
      content: (
        <div className="space-y-3">
          <p>
            PortalAcademia implements defense-in-depth architectural security to eliminate client-side token exposure:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">HttpOnly Cookie Auth:</strong> Authentication tokens are stored exclusively in encrypted, <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">HttpOnly</code>, <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">SameSite=Lax</code> cookies. Tokens are never exposed to JavaScript, Redux store state, or <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">localStorage</code>, mitigating cross-site scripting (XSS) session theft.
            </li>
            <li>
              <strong className="text-foreground font-medium">Password Hashing:</strong> Credentials are cryptographically salted and hashed using bcrypt with adaptive cost factors prior to database persistence. Plaintext passwords are never logged or stored.
            </li>
            <li>
              <strong className="text-foreground font-medium">Transport Encryption:</strong> All client-to-server traffic is enforced over TLS 1.3 with mandatory CORS origin verification.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "visibility-sharing",
      number: "04",
      title: "Recruiter Discovery & Data Sharing Controls",
      icon: Eye,
      summary: "Zero commercial data selling; corporate access granted solely via explicit application or open discovery.",
      content: (
        <div className="space-y-3">
          <p>
            PortalAcademia operates under a strict <strong className="text-foreground">Zero Third-Party Data Monetization</strong> policy. Student candidate telemetry is never sold to marketing brokers or ad networks. Corporate recruiters can view student profiles only under specific authorized conditions:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Direct Application:</strong> When a candidate actively applies to a specific job or internship listing, the posting recruiter receives their verified profile, match score, and assessment badges.
            </li>
            <li>
              <strong className="text-foreground font-medium">Marketplace Talent Discovery:</strong> If a student enables discoverability in their profile settings, verified recruiters can review their competency matrix and verified skill scores.
            </li>
            <li>
              <strong className="text-foreground font-medium">Institutional Endorsement:</strong> Institutional placement officers (TPOs) may endorse select candidates or opportunities, attaching an official verified seal to student requisitions.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "dpdp-compliance",
      number: "05",
      title: "DPDP Act 2023 Compliance & Data Subject Rights",
      icon: FileCheck2,
      summary: "Full compliance with India's Digital Personal Data Protection Act 2023, including right to correction and erasure.",
      content: (
        <div className="space-y-3">
          <p>
            In alignment with India's <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong> and international academic governance standards, PortalAcademia grants all users comprehensive rights over their digital persona:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Right to Access & Portability:</strong> Request an export of your profile history, verified skill achievements, and AI consultation logs in machine-readable JSON format.
            </li>
            <li>
              <strong className="text-foreground font-medium">Right to Rectification:</strong> Modify inaccurate profile details, uploaded certification links, or contact preferences directly via your dashboard or profile settings.
            </li>
            <li>
              <strong className="text-foreground font-medium">Right to Erasure:</strong> Initiate permanent account deletion and purging of non-regulatory telemetry records by contacting <span className="font-mono text-primary">privacy@portalacademia.edu</span>.
            </li>
            <li>
              <strong className="text-foreground font-medium">Grievance Redressal:</strong> Dedicated Data Protection Officer (DPO) support with response SLAs under 72 business hours for institutional escalations.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <title>Privacy Policy — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia data protection standards detailing Groq LLM inference, AISHE university telemetry, HttpOnly cookie security, and DPDP 2023 compliance."
      />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>

            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
              aria-label="PortalAcademia — Return to top"
            >
              <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-[10px] transition-colors">
                PA
              </div>
              <span className="font-semibold text-xs tracking-tight text-foreground hidden sm:inline">
                PortalAcademia Privacy
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="privacy-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>

              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Sign In
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8">
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                <Lock className="w-3 h-3" />
                DPDP ACT 2023 & AISHE COMPLIANT
              </span>
              <span>•</span>
              <span>GROQ LLM INFERENCE PROTOCOL</span>
              <span>•</span>
              <span>REVISION: SEPTEMBER 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Privacy Policy & Telemetry Governance
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Transparent specification detailing how PortalAcademia safeguards student credentials, academic deficits, AISHE institutional telemetry, and AI Career Counselor interactions.
            </p>

            {/* Guarantee Highlight Strip */}
            <div className="p-3 rounded-md bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono pt-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero Data Selling • HttpOnly Cookie Protection • Tamper-Evident Audit Trails</span>
              </div>
              <span className="text-muted-foreground text-[11px]">Encrypted TLS 1.3 Transport</span>
            </div>
          </div>

          {/* Quick Navigation Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1 font-mono">Filter Section:</span>
            <button
              type="button"
              onClick={() => setActiveSection("all")}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                activeSection === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              )}
            >
              All Provisions
            </button>
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                  activeSection === sec.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                )}
              >
                {sec.number}. {sec.title.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Sections List */}
          <div className="space-y-5">
            {sections
              .filter((sec) => activeSection === "all" || activeSection === sec.id)
              .map((sec) => {
                const Icon = sec.icon;
                return (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="p-5 sm:p-6 rounded-md bg-card border border-border space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
                      <span className="font-mono text-xs text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {sec.number}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{sec.title}</span>
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground italic font-mono">
                      {sec.summary}
                    </p>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                      {sec.content}
                    </div>
                  </section>
                );
              })}
          </div>

          {/* Quick Legal Cross-Links */}
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Related governance:</span>
              <Link to="/terms" className="text-foreground hover:underline font-medium">
                Terms and Conditions
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <Link to="/faq" className="text-foreground hover:underline font-medium">
                Frequently Asked Questions
              </Link>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-foreground" />
              <span>DPDP Act 2023 & ISO/IEC 27001 Aligned</span>
            </div>
          </div>
        </main>

        {/* Minimal Swiss Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-background mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>Security & Data Governance Infrastructure</span>
          </div>
        </footer>
      </div>
    </>
  );
}
