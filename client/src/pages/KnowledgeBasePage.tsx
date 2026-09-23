import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Building,
  GraduationCap,
  Briefcase,
  Award,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Search,
  Printer,
  Copy,
  Check,
  Sun,
  Moon,
  Video,
  Sliders,
  Sparkles,
  X,
  Building2,
} from "lucide-react";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

interface KBSection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  summary: string;
  content: React.ReactNode;
}

export default function KnowledgeBasePage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSectionId, setActiveSectionId] = useState<string>("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sections: KBSection[] = [
    {
      id: "getting-started",
      number: "1.0",
      title: "Getting Started Across Ecosystem Roles",
      icon: BookOpen,
      badge: "Quick Start",
      summary: "Step-by-step onboarding walkthrough for Students, Faculty, Institutions, and Recruiters.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates four isolated, role-locked workspaces designed for each stakeholder in the higher education and workforce ecosystem:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-sm bg-card border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  1. Student Scholars
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Scholar Workspace
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sign up with your personal or college email. Select your degree, branch, and graduating year. Build your verified profile, take standardized skill assessments, generate an objective 1-click ATS resume, and apply directly to vetted opportunities.
              </p>
              <div className="pt-2">
                <Link to="/auth" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                  <span>Create Student Account</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-card border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  2. Faculty &amp; Mentors
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Academic Portal
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register using your institutional domain email. Explore corporate sabbaticals, research grants, and Faculty Development Programs (FDPs). Track live market skill demands to align curriculum modules with enterprise hiring requirements.
              </p>
              <div className="pt-2">
                <Link to="/auth" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                  <span>Register as Faculty</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-card border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  3. Academic Institutions
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Placement Cell
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register with your Ministry of Education AISHE accreditation code. Placement and Training Officers (TPOs) gain real-time cohort skill telemetry, audit and verify student credentials, endorse curated listings, and broadcast campus announcements.
              </p>
              <div className="pt-2">
                <a href="#institution-guide" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                  <span>Read Onboarding Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-card border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  4. Industry Partners
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-secondary border border-border text-muted-foreground">
                  Recruiter Console
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register with your corporate work email. Publish verified jobs, internships, and hackathons. Register enterprise open-source repositories with webhook tracking and discover pre-assessed candidates ranked by objective ATS competency scores.
              </p>
              <div className="pt-2">
                <Link to="/auth" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                  <span>Join as Enterprise Partner</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "institution-guide",
      number: "2.0",
      title: "Institution Onboarding & AISHE Verification Guide",
      icon: Building2,
      badge: "AISHE Verified",
      summary: "Official onboarding documentation for universities, polytechnics, and Training & Placement Cells (TPOs).",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia anchors higher education institutional accounts to the Ministry of Education's <strong>All India Survey on Higher Education (AISHE)</strong> regulatory directory. This guarantees that only legitimate academic entities operate institutional consoles.
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] flex items-center justify-center font-bold">1</span>
                AISHE Code Autocomplete &amp; Verification
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                During institutional onboarding (<code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">/onboarding/organization</code>), enter your institution's name or official AISHE code (e.g., <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">C-12345</code> or <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">U-0987</code>). The system queries our pre-indexed AISHE dataset to verify regulatory standing and pre-fill state, district, and affiliating university records.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] flex items-center justify-center font-bold">2</span>
                Institutional Domain Email OTP Validation
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                The registering administrative officer must supply an authorized institutional email domain (<code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">tpo@college.ac.in</code> or <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">placement@univ.edu.in</code>). A 6-digit cryptographic one-time password (OTP) is dispatched via Nodemailer to authenticate that the registrant possesses direct control over the university domain.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] flex items-center justify-center font-bold">3</span>
                Placement Cell (TPO) Verification Queue
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                Once authenticated, the Training &amp; Placement Office accesses the verification queue at <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">/dashboard/institution</code>. When enrolled students upload external credentials, certificates, or research papers, they appear in this queue with artifact links for one-click approval or rejection with audit feedback.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] flex items-center justify-center font-bold">4</span>
                Direct Campus Broadcasts
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                Institutions can dispatch official announcements to enrolled students or affiliated faculty via <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">POST /api/notifications/broadcast</code>. Broadcasts appear in students' real-time notification bells and historical records.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "credential-verification",
      number: "3.0",
      title: "Three-Tier Credential & Verification Architecture",
      icon: ShieldCheck,
      badge: "Anti-Fraud",
      summary: "How student certificates, skills, and assessment scores are audited and given verified badges.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia replaces unverified self-claimed resumes with a rigorous three-tier credential trust model:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground">Tier 1: Self-Reported</span>
                <span className="text-[10px] font-mono text-muted-foreground">0.45 ATS Weight</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skills or project claims added by the student without verification. Stored on the profile as self-reported entries. Provides baseline visibility but limited priority in recruiter searches.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-primary">Tier 2: Institution-Verified</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0.96 ATS Weight</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Certificates, internships, or academic honors audited and approved by the college Placement Cell (TPO). Displays an institutional verified badge and significantly elevates ATS match scores.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">Tier 3: Assessment-Verified</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Up to 1.00 ATS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skills validated through standardized platform benchmark examinations. Carries dynamic weight (0.70 + 0.30 &times; Score/100) based on cumulative attempt averages and awards tamper-evident badges.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ats-scoring",
      number: "4.0",
      title: "Deterministic ATS Scoring & Proof-of-Separation",
      icon: Sliders,
      badge: "Objective Math",
      summary: "Mathematical breakdown of the unified ATS scoring engine (60% Skill Match + 40% Profile Completeness).",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            Unlike commercial keyword-matching ATS parsers that penalize formatting or overlook non-traditional candidates, PortalAcademia executes a pure, deterministic mathematical scoring function:
          </p>

          <div className="p-4 rounded-sm bg-secondary/50 border border-border font-mono text-xs text-foreground space-y-1">
            <span className="text-muted-foreground uppercase text-[10px] block font-semibold">Official Composite ATS Equation</span>
            <p className="font-bold text-sm text-primary">
              Total ATS Score = min(100, max(0, round(0.60 × SkillScore + 0.40 × CompletenessScore)))
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">1. Skill Score Calibration (60% Total Weight)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For every skill required by a job listing, the engine looks for candidate proof in descending order of trust:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li><strong className="text-foreground">Passed Assessment:</strong> Weight = 0.70 + 0.30 &times; (Score / 100) (yields 0.70 to 1.00 multiplier).</li>
              <li><strong className="text-foreground">Institution-Verified Credential:</strong> Weight = 0.96 (calibrated default equivalent to an 85% test score).</li>
              <li><strong className="text-foreground">Admin-Verified Profile Skill:</strong> Weight = 0.96.</li>
              <li><strong className="text-foreground">Self-Reported Skill:</strong> Weight = 0.45 (ensures clear proof-of-separation from verified talent).</li>
              <li><strong className="text-foreground">Unmatched / Missing Skill:</strong> Weight = 0.00.</li>
            </ul>

            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono pt-2">2. Completeness Score (40% Total Weight, 100 Pts Max)</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
              <li><strong className="text-foreground">Contact Info (20 pts):</strong> Full name (5), valid email (5), phone number (5), location (5).</li>
              <li><strong className="text-foreground">Professional Summary (15 pts):</strong> Detailed summary (&ge; 30 chars: 15 pts; partial: 8 pts).</li>
              <li><strong className="text-foreground">Education (15 pts):</strong> Degree, branch, and college name.</li>
              <li><strong className="text-foreground">Work / Projects (15 pts):</strong> Past internships or projects with descriptions.</li>
              <li><strong className="text-foreground">Certifications / Badges (20 pts):</strong> Verified certificate or passed test (20 pts; self-reported: 10 pts).</li>
              <li><strong className="text-foreground">Section Structure (15 pts):</strong> Balanced completion across &ge; 4 distinct profile sections.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "premium-features",
      number: "5.0",
      title: "Premium Scholar Membership & Open-Source Studio",
      icon: Sparkles,
      badge: "₹200 / 30 Days",
      summary: "Student premium tier capabilities: Razorpay subscription, open-source PR tracking, and verified certificates.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Premium Scholar tier unlocks specialized career acceleration tools. Every student receives a one-time <strong>7-Day Free Trial</strong>, followed by a flat ₹200 / 30-day membership with zero recurring auto-debit surprises.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Enterprise Open-Source
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contribute to real corporate repositories registered by industry partners. Merged pull requests trigger automated GitHub webhooks that log your contribution and allow sponsors to issue verifiable achievement certificates.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-primary" />
                1-on-1 Peer Mentorship
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Schedule direct WebRTC video advising with verified 4th-year senior scholars. Practice mock interviews, review system design architecture, and earn a permanent +20 ATS score profile boost upon term completion.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Recruiter Priority
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Premium Scholars receive the verified "Premium Scholar" badge strip and priority indexing in recruiter talent discovery searches.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "nep-alignment",
      number: "6.0",
      title: "National Education Policy (NEP 2020) Framework Alignment",
      icon: Award,
      badge: "Regulatory Alignment",
      summary: "How PortalAcademia operationalizes NEP 2020 mandates: Academic Bank of Credits, internship tracking, and skill outcomes.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia is architected to operationalize key reforms mandated under the <strong>National Education Policy 2020 (NEP 2020)</strong> and UGC guidelines for higher education:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Mandatory Internship &amp; Apprenticeship Tracking
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                NEP 2020 requires experiential learning and mandatory industry internships for undergraduate degrees. PortalAcademia provides institutions with verifiable tracking of internship offers, mentor evaluations, and hours logged, fulfilling accreditation compliance for NAAC Criterion 1.3 and NIRF parameters.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Multidisciplinary Skill Transcripts &amp; Academic Bank of Credits (ABC)
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                In accordance with the National Higher Education Qualifications Framework (NHEQF), student portfolios capture verifiable cross-disciplinary competencies, standardized assessment badges, and open-source contributions that can be mapped to university credit banks.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
              <span className="font-bold text-xs text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Outcome-Based Education (OBE) Curriculum Telemetry
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                Faculty dashboards present live curriculum deficit analytics that compare student assessment performance against market hiring quotas. Departments use this data to execute continuous syllabus revisions based on demonstrable learning outcomes.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "webrtc-troubleshooting",
      number: "7.0",
      title: "WebRTC Video & Hardware Troubleshooting",
      icon: Video,
      badge: "Media Support",
      summary: "Camera, microphone, and firewall connection guide for 1-on-1 mentorship video sessions.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia uses peer-to-peer WebRTC video calling. Follow these recommendations to resolve common connection or hardware issues:
          </p>

          <div className="space-y-2.5 text-xs text-muted-foreground">
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-foreground block">Browser Camera/Microphone Permissions</span>
              <p className="leading-relaxed">
                Ensure you have granted camera and mic permissions in your browser. Click the lock/tune icon in the browser address bar $\rightarrow$ select "Site settings" $\rightarrow$ allow Camera and Microphone.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-foreground block">Campus Firewalls &amp; Symmetric NAT</span>
              <p className="leading-relaxed">
                University campus Wi-Fi networks frequently block standard UDP peer-to-peer traffic. PortalAcademia incorporates automatic STUN and TURN relay fallback (<code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">turn:openrelay.metered.ca:80</code>) to traverse symmetric NAT firewalls without requiring port forwarding.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-foreground block">Hardware LED Indicators</span>
              <p className="leading-relaxed">
                Our strict Hardware Teardown Protocol halts media tracks directly at the OS device driver layer when you end a call or close the modal. If an indicator light remains lit due to a third-party extension, refreshing the browser tab will immediately release all media locks.
              </p>
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

  return (
    <>
      <title>Knowledge Base &amp; Platform Guides — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia comprehensive help center and documentation: role onboarding, AISHE institution verification, ATS scoring math, and NEP 2020 alignment."
      />

      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {/* ── Top Header Navigation Bar ──────────────────────────────── */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
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
                Help Center &amp; Documentation
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-secondary/60 p-1 rounded-sm border border-border text-xs">
              <Link
                to="/faq"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <span className="px-3 py-1 rounded-xs font-semibold bg-card text-foreground shadow-2xs">
                Knowledge Base
              </span>
              <Link
                to="/terms"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                title="Print Documentation"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-sm border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                id="kb-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="w-8 h-8 rounded-sm border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />}
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

        {/* ── Document Header ───────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/15 print:border-none print:bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-4">
            <div className="space-y-2 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-xs font-semibold">
                  <BookOpen className="w-3 h-3" />
                  KNOWLEDGE BASE &amp; SPECIFICATIONS
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">OFFICIAL DOCUMENTATION</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">NEP 2020 ALIGNED</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                Platform Architecture &amp; User Guides
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Comprehensive operational guides covering institutional AISHE registration, deterministic ATS scoring calculations, credential verification, and National Education Policy alignment.
              </p>
            </div>
          </div>
        </section>

        {/* ── Two-Column Layout (TOC + Main Content) ────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left Sidebar (TOC) ─────────────────────────────────── */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4 print:hidden">
              <div className="p-4 rounded-sm bg-card border border-border space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                    Table of Contents
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {sections.length} Guides
                  </span>
                </div>

                {/* Filter / Search input inside TOC */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search guides &amp; topics..."
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

                {/* Guide List */}
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

              {/* Quick Institutional Support Link */}
              <div className="p-3.5 rounded-sm bg-muted/30 border border-border space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Institutional Support Desk
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Need assistance with AISHE onboarding or bulk cohort telemetry?
                </p>
                <a
                  href="mailto:support@portalacademia.ac.in"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline"
                >
                  <span>support@portalacademia.ac.in</span>
                </a>
              </div>
            </aside>

            {/* ── Right Content Stream ───────────────────────────────── */}
            <main className="lg:col-span-8 space-y-6">
              {/* Mobile Search */}
              <div className="lg:hidden relative print:hidden">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search guides..."
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
                  <p className="text-xs font-semibold text-foreground">No documentation found for "{searchQuery}"</p>
                  <p className="text-[11px] text-muted-foreground">
                    Try searching for "AISHE", "ATS", "NEP", "verification", or "premium".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-1 rounded-sm bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 border border-border cursor-pointer mt-2"
                  >
                    Clear Search
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

                      <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-1.5 rounded-xs border-l-2 border-primary">
                        {sec.summary}
                      </p>

                      <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-1">
                        {sec.content}
                      </div>
                    </article>
                  );
                })
              )}
            </main>
          </div>
        </div>

        {/* ── Minimal Swiss Footer ─────────────────────────────────── */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-card mt-auto print:border-none print:py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. Official Documentation &amp; Knowledge Base.</span>
            <div className="flex items-center gap-4">
              <Link to="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
