import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
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
  Search,
  Printer,
  Copy,
  Check,
  Video,
  Mail,
  UserCheck,
  Shield,
  X,
  Briefcase,
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

interface TermsSection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  summary: string;
  content: React.ReactNode;
}

export default function TermsPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSectionId, setActiveSectionId] = useState<string>("institutional-governance");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sections: TermsSection[] = [
    {
      id: "institutional-governance",
      number: "1.0",
      title: "Acceptance of Terms & Four-Pillar Ecosystem Governance",
      icon: Building2,
      badge: "Core Agreement",
      summary: "Contractual framework across Students, Faculty, Higher Education Institutions, and Corporate Recruiters.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            By accessing, creating an account, or interacting with the PortalAcademia platform (the "Platform"), you agree to comply with and be bound by these Terms and Conditions. PortalAcademia operates as an objective, verified intermediary bridging academic talent, institutional governance, and corporate workforce requisitions.
          </p>
          <p className="leading-relaxed">
            Platform operational scopes are strictly partitioned across four verified stakeholder pillars:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Pillar 1: Student Scholars
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Subject to strict academic integrity, honest skill benchmarking, authentic portfolio representation, and peer advising ethics.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-primary" />
                Pillar 2: Faculty & Mentors
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Authorized to endorse student competencies, publish research immersion opportunities, and validate course syllabus mappings.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Pillar 3: Academic Institutions
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Required to maintain valid All India Survey on Higher Education (AISHE) accreditation codes and exercise Placement Cell (TPO) oversight.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Pillar 4: Corporate Partners
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permitted to publish legitimate, verified career requisitions and evaluate assessed student candidates without automated spamming.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "code-ownership",
      number: "2.0",
      title: "100% Student Code & Artifact Intellectual Property",
      icon: Code2,
      badge: "Irrevocable IP",
      summary: "Students retain full, unencumbered intellectual property rights over all code and portfolio submissions.",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1.5">
            <span className="font-bold font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Foundational Guarantee: Unencumbered Student Intellectual Property
            </span>
            <p className="text-xs leading-relaxed">
              PortalAcademia claims zero intellectual property rights, commercial licenses, or proprietary ownership over student source code, algorithmic submissions, GitHub repositories, or research whitepapers submitted to the platform.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Sole Exclusive Ownership:</strong> All code written in skill tests, hackathons, open source contributions, or uploaded to candidate portfolios remains the 100% sole exclusive property of the authoring student or scholar.
            </li>
            <li>
              <strong className="text-foreground font-medium">Limited Testing License:</strong> By submitting code to automated skill assessments or test runners, you grant PortalAcademia only a temporary, non-exclusive license to execute, test, and analyze the code for automated competency scoring and plagiarism detection.
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
      number: "3.0",
      title: "Standardized Skill Assessments & Proctoring Integrity",
      icon: Award,
      badge: "Calibrated Tests",
      summary: "Rules governing automated test runners, timed benchmarks, and anti-cheating enforcement.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates standardized, calibrated skill assessment modules (<code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">SkillTestRunner</code>) calibrated against industry hiring bars:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Proctoring & Timing Integrity:</strong> Assessment sessions are timed and monitored for tab-switching, unauthorized script injections, and collaborative tampering.
            </li>
            <li>
              <strong className="text-foreground font-medium">Prohibition on Automated Solvers:</strong> Using AI scrapers, reverse-engineered test bank dumps, or automated bots to complete skill assessments is strictly prohibited.
            </li>
            <li>
              <strong className="text-foreground font-medium">Score Invalidation & Revocation:</strong> PortalAcademia and affiliated institutional administrators reserve the right to revoke verified badges or invalidate test scores if irregular submission patterns are detected.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "ai-usage-policy",
      number: "4.0",
      title: "Contextual AI Career Guide Acceptable Use Policy",
      icon: Bot,
      badge: "Advisory Only",
      summary: "AI Counselor provides strategic roadmaps & deficit analysis; code script generation is strictly prohibited.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Our AI Career Counselor workspace utilizes high-speed Groq LLM inference to offer personalized career roadmaps and deficit breakdowns. Users must comply with the following boundaries:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Prohibition on Complete Code Generation
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As notified on the workspace interface, the AI Guide is strictly configured to provide strategic advice, interview topics, and concept explanations. It must not be prompted to generate complete project code, homework assignments, or test answers.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Advisory Telemetry Only:</strong> AI-generated match percentages, career advice, and deficit warnings represent probabilistic models and should be considered recommendations, not contractual hiring guarantees.
            </li>
            <li>
              <strong className="text-foreground font-medium">Compliance Logging:</strong> Inquiries submitted to the AI system are recorded with user identifiers in <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">aiLogModel</code> to detect misuse and ensure platform academic integrity.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "mentorship-protocols",
      number: "5.0",
      title: "Senior Scholar Mentorship & 1-on-1 Advising Protocols",
      icon: Video,
      badge: "Peer Advising",
      summary: "Professional standards, WebRTC etiquette, and +20 ATS boost integrity for verified senior mentors.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Senior scholars (3rd and 4th year students or alumni) may register as peer mentors to conduct 1-on-1 video advising, architecture reviews, and mock interviews:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Professional Conduct:</strong> Both mentors and mentees must maintain respectful, constructive, and inclusive professional communication during all WebRTC audio/video sessions.
            </li>
            <li>
              <strong className="text-foreground font-medium">ATS Boost Authenticity:</strong> Senior mentors earn a permanent +20 ATS score boost on employer search algorithms upon completing verified advising sessions with satisfied mentee reviews. Attempts to fabricate session duration or trade false ratings will result in immediate loss of mentor privileges.
            </li>
            <li>
              <strong className="text-foreground font-medium">Media Privacy:</strong> Recording 1-on-1 WebRTC sessions without explicit bilateral written consent is strictly prohibited.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "institutional-verification",
      number: "6.0",
      title: "Credential Auditing & TPO Endorsement Gate",
      icon: ShieldCheck,
      badge: "AISHE Verified",
      summary: "University placement officers verify uploaded credentials before granting verified badges.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To prevent credential fraud and diploma inflation, PortalAcademia integrates an institutional audit gate:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
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
      id: "recruiter-standards",
      number: "7.0",
      title: "Corporate Partner Requisitions & Fair Hiring Standards",
      icon: Briefcase,
      badge: "Fair Requisitions",
      summary: "Verified employer listings, prohibition of ghost postings, and ethical candidate engagement.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Corporate partners utilizing PortalAcademia for talent acquisition and hackathon sponsorship agree to transparent hiring standards:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Legitimate Requisitions:</strong> All posted jobs and internships must represent genuine, funded requisitions with clear compensation guidelines. Ghost postings and misleading multi-level marketing positions are prohibited.
            </li>
            <li>
              <strong className="text-foreground font-medium">Non-Discrimination:</strong> Candidate evaluation must be based exclusively on verified skills, assessment badges, and academic qualifications without bias.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "sanctions-liability",
      number: "8.0",
      title: "Prohibited Conduct, Termination & Dispute Jurisdiction",
      icon: AlertTriangle,
      badge: "Statutory Law",
      summary: "Zero tolerance for harassment, data scraping, or malicious disruption; Indian legal jurisdiction.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Users are strictly prohibited from engaging in unauthorized automated data scraping, credential sharing, denial of service attacks, or distributing fraudulent hiring listings.
          </p>

          <div className="p-4 rounded-sm bg-card border border-border space-y-2 text-xs">
            <span className="font-mono text-muted-foreground uppercase text-[10px] block font-bold">
              Legal Jurisdiction &amp; Dispute Resolution
            </span>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai/New Delhi, India.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-muted-foreground">Formal Legal Notices:</span>
              <a
                href="mailto:legal@portalacademia.edu"
                className="font-mono text-primary font-medium hover:underline"
              >
                legal@portalacademia.edu
              </a>
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
      <title>Terms and Conditions of Service — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia comprehensive terms governing 100% student code ownership, Groq AI counselor policies, AISHE verification standards, and assessment integrity."
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
              <Link
                to="/privacy"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="px-3 py-1 rounded-xs font-semibold bg-card text-foreground shadow-2xs">
                Terms of Service
              </span>
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
                title="Print Terms Specification"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-sm border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                id="terms-theme-toggle-btn"
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
                <span className="inline-flex items-center gap-1.5 text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-xs font-semibold">
                  <FileText className="w-3 h-3" />
                  LEGAL SPECIFICATION &amp; USER AGREEMENT
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">REVISION 3.2.0</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">EFFECTIVE: SEPTEMBER 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                Terms &amp; Conditions of Service
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Contractual framework governing 100% student code ownership, standardized skill assessments, four-pillar ecosystem roles, and verified campus placement integrity.
              </p>
            </div>

            {/* Executive Key Commitments Bento Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-emerald-500" />
                  Code Ownership
                </span>
                <p className="text-xs font-bold text-foreground">100% Student Owned</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  You retain all IP rights to all code, algorithms, and repositories.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-500" />
                  Governance
                </span>
                <p className="text-xs font-bold text-foreground">Four-Pillar Model</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Strictly partitioned roles for Students, Faculty, Colleges, and Industry.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-500" />
                  Test Integrity
                </span>
                <p className="text-xs font-bold text-foreground">Standardized Bar</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Automated test runners with proctoring and anti-cheating protections.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Accreditation
                </span>
                <p className="text-xs font-bold text-foreground">AISHE Campus Gate</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  University placement cells (TPOs) audit all verified credentials.
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
                    {sections.length} Articles
                  </span>
                </div>

                {/* Filter / Search input inside TOC */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search terms & clauses..."
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

              {/* Legal Council Quick Contact Card */}
              <div className="p-3.5 rounded-sm bg-muted/30 border border-border space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Office of Legal Affairs
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Questions regarding contracts, enterprise sponsorship, or IP ownership?
                </p>
                <a
                  href="mailto:legal@portalacademia.edu"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>legal@portalacademia.edu</span>
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
                  placeholder="Search terms & clauses..."
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
                    Try searching for terms like "code", "assessment", "mentorship", "Groq", or "AISHE".
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
                  <Link to="/privacy" className="text-primary hover:underline font-mono">
                    Privacy Policy &amp; Telemetry
                  </Link>
                  <span>•</span>
                  <Link to="/faq" className="text-primary hover:underline font-mono">
                    FAQ &amp; Platform Guidelines
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Information Technology Act 2000 &amp; DPDP 2023</span>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* ── Minimal Swiss Footer ─────────────────────────────────── */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-card mt-auto print:border-none print:py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>Academic Integrity &amp; Statutory Legal Framework</span>
          </div>
        </footer>
      </div>
    </>
  );
}
