import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  ChevronRight,
  Sun,
  Moon,
  Code2,
  Bot,
  Building2,
  Award,
  AlertTriangle,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

interface TermsSection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  content: React.ReactNode;
}

export default function TermsPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("all");

  const sections: TermsSection[] = [
    {
      id: "institutional-governance",
      number: "01",
      title: "Acceptance of Terms & Four-Pillar Governance",
      icon: Building2,
      summary: "Contractual framework across Students, Faculty, Higher Education Institutions, and Corporate Recruiters.",
      content: (
        <div className="space-y-3">
          <p>
            By accessing, creating an account, or interacting with the PortalAcademia platform (the "Platform"), you agree to comply with and be bound by these Terms and Conditions. PortalAcademia operates as an objective, verified intermediary bridging academic talent, institutional governance, and corporate workforce requisitions.
          </p>
          <p>
            Platform operational scopes are strictly partitioned across four verified stakeholder pillars:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Pillar 1 (Students):</strong> Subject to academic integrity, honest skill benchmarking, and authentic portfolio representation.
            </li>
            <li>
              <strong className="text-foreground font-medium">Pillar 2 (Faculty):</strong> Authorized to endorse student competencies, publish research immersion projects, and oversee coursework mappings.
            </li>
            <li>
              <strong className="text-foreground font-medium">Pillar 3 (Academic Institutions):</strong> Required to register valid All India Survey on Higher Education (AISHE) accreditation codes and maintain official Training & Placement Cell (TPO) audit oversight.
            </li>
            <li>
              <strong className="text-foreground font-medium">Pillar 4 (Corporate Partners):</strong> Permitted to publish legitimate job and internship requisitions and review evaluated student candidates without automated spamming.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "code-ownership",
      number: "02",
      title: "100% Student Code & Artifact Ownership",
      icon: Code2,
      summary: "Students retain full, unencumbered intellectual property rights over all code and portfolio submissions.",
      content: (
        <div className="space-y-3">
          <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
            <span className="font-bold font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Core Guarantee: Unencumbered Student Intellectual Property
            </span>
            <p className="text-xs leading-relaxed">
              PortalAcademia claims zero intellectual property rights, commercial licenses, or proprietary claims over student source code, algorithmic submissions, GitHub project repositories, or research whitepapers submitted to the platform.
            </p>
          </div>
          <p>
            Key provisions regarding user-submitted work:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Code Solutions & Repositories:</strong> All code written in skill tests, hackathons, or uploaded to candidate portfolios remains the 100% sole exclusive property of the authoring student or scholar.
            </li>
            <li>
              <strong className="text-foreground font-medium">Limited Evaluation License:</strong> By submitting code to automated skill assessments or test runners, you grant PortalAcademia only a temporary, non-exclusive license to execute, test, and analyze the code for automated competency scoring and plagiarism detection.
            </li>
            <li>
              <strong className="text-foreground font-medium">Corporate Challenge Exceptions:</strong> If a student chooses to participate in an industry-sponsored proprietary challenge, intellectual property terms follow the explicit contest rules agreed to prior to enrollment.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "assessment-integrity",
      number: "03",
      title: "Skill Assessments & Proctoring Integrity",
      icon: Award,
      summary: "Rules governing automated test runners, timed benchmarks, and anti-cheating enforcement.",
      content: (
        <div className="space-y-3">
          <p>
            PortalAcademia operates standardized, calibrated skill assessment modules (<code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">SkillTestRunner</code>) reflecting live industry demand metrics. To ensure credibility across all partner employers:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Proctoring & Timing Integrity:</strong> Assessment sessions are timed and monitored for tab-switching, unauthorized script injections, and collaborative cheating.
            </li>
            <li>
              <strong className="text-foreground font-medium">Prohibition on Automated Solvers:</strong> Using AI scrapers, reverse-engineered test bank dumps, or automated bots to complete skill assessments is strictly prohibited.
            </li>
            <li>
              <strong className="text-foreground font-medium">Score Invalidation:</strong> PortalAcademia and affiliated institutional administrators reserve the right to revoke verified badges or invalidate test scores if irregular submission patterns are detected.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "ai-usage-policy",
      number: "04",
      title: "Contextual AI Career Guide Acceptable Use Policy",
      icon: Bot,
      summary: "AI Counselor provides strategic roadmaps & deficit analysis; code script generation is strictly prohibited.",
      content: (
        <div className="space-y-3">
          <p>
            Our AI Career Counselor (<code className="font-mono text-primary bg-secondary px-1 py-0.5 rounded text-[11px]">/ai-guide</code>) uses high-speed Groq LLM inference to offer personalized career roadmaps and deficit breakdowns. Users must comply with the following boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">No Code Script Generation:</strong> As notified on the workspace interface, the AI Guide is strictly configured to provide strategic advice, interview topics, and concept explanations. It must not be prompted to generate complete project code, homework assignments, or test answers.
            </li>
            <li>
              <strong className="text-foreground font-medium">Advisory Telemetry Only:</strong> AI-generated match percentages, career advice, and deficit warnings represent probabilistic models and should be considered recommendations, not contractual hiring guarantees.
            </li>
            <li>
              <strong className="text-foreground font-medium">Compliance Logging:</strong> Inquiries submitted to the AI system are recorded with user identifiers in <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">aiLogModel</code> to detect misuse and ensure platform safety.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "institutional-verification",
      number: "05",
      title: "Credential Auditing & TPO Endorsement Gate",
      icon: ShieldCheck,
      summary: "University placement officers verify uploaded credentials before granting verified badges.",
      content: (
        <div className="space-y-3">
          <p>
            To prevent credential fraud and diploma inflation, PortalAcademia integrates an institutional audit gate:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground font-medium">Placement Cell Audit Responsibility:</strong> Institutional administrators (TPOs) must review candidate proof URLs, issuer certificates, and roll number affiliations before approving verified credentials.
            </li>
            <li>
              <strong className="text-foreground font-medium">Endorsed Campus Opportunities:</strong> Higher education institutions may endorse select marketplace listings. Endorsed listings receive prioritized distribution to that institution's student cohort.
            </li>
            <li>
              <strong className="text-foreground font-medium">Fraud Sanctions:</strong> Submitting fabricated credentials or falsified university affiliations will trigger permanent platform blacklisting and formal notification to the affiliated university Dean.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "sanctions-liability",
      number: "06",
      title: "Prohibited Conduct, Termination & Dispute Jurisdiction",
      icon: AlertTriangle,
      summary: "Zero tolerance for harassment, data scraping, or malicious disruption; standard legal jurisdiction.",
      content: (
        <div className="space-y-3">
          <p>
            Users are strictly prohibited from engaging in unauthorized automated data scraping, credential sharing, distributed denial of service attacks, or distributing fraudulent hiring listings.
          </p>
          <p>
            These Terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023. For formal notices or legal inquiries, reach our compliance team at <span className="font-mono text-primary">legal@portalacademia.edu</span>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <title>Terms and Conditions — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia legal terms governing 100% student code ownership, Groq AI counselor policies, AISHE verification standards, and assessment integrity."
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
                PortalAcademia Legal
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="terms-theme-toggle-btn"
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
              <span className="inline-flex items-center gap-1 text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-semibold">
                <FileText className="w-3 h-3" />
                LEGAL SPECIFICATION • REVISION 3.0
              </span>
              <span>•</span>
              <span>FOUR-PILLAR STAKEHOLDER CONTRACT</span>
              <span>•</span>
              <span>EFFECTIVE DATE: SEPTEMBER 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Terms & Conditions of Service
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Standard regulatory framework and acceptable use parameters governing all student scholars, faculty mentors, higher education universities, and corporate recruiters on PortalAcademia.
            </p>

            {/* Ownership Strip */}
            <div className="p-3 rounded-md bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono pt-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Student Code & Artifact Ownership Protected</span>
              </div>
              <span className="text-muted-foreground text-[11px]">Zero-Tolerance Assessment Integrity Enforcement</span>
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
              <span>Related documentation:</span>
              <Link to="/privacy" className="text-foreground hover:underline font-medium">
                Privacy Policy & Telemetry Governance
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <Link to="/faq" className="text-foreground hover:underline font-medium">
                Frequently Asked Questions
              </Link>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Scale className="w-3.5 h-3.5 text-foreground" />
              <span>National Higher Education Compliance</span>
            </div>
          </div>
        </main>

        {/* Minimal Swiss Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-background mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>PortalAcademia Legal & Regulatory Repository</span>
          </div>
        </footer>
      </div>
    </>
  );
}
