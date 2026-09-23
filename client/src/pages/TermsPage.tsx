import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  ChevronRight,
  Sun,
  Moon,
  Code2,
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
  X,
  Briefcase,
  CreditCard,
  Ban,
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
  const [activeSectionId, setActiveSectionId] = useState<string>("acceptance-ecosystem");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sections: TermsSection[] = [
    {
      id: "acceptance-ecosystem",
      number: "1.0",
      title: "Acceptance of Terms & Four-Pillar Role Obligations",
      icon: Building2,
      badge: "Core Agreement",
      summary: "Contractual obligations partitioned across Students, Faculty, AISHE Institutions, and Corporate Partners.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            By accessing, creating an account, or interacting with PortalAcademia (the "Platform"), you agree to comply with and be bound by these Terms and Conditions. PortalAcademia operates as an objective, verified intermediary bridging academic talent, institutional governance, and corporate workforce requisitions.
          </p>
          <p className="leading-relaxed">
            Because each stakeholder role possesses distinct capabilities and responsibilities, specific contractual obligations apply per role:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Pillar 1: Student Scholars
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Must supply authentic academic records, genuine portfolio artifacts, and take assessments independently without automated solvers or unauthorized assistance. Respectful, professional conduct is mandatory during all 1-on-1 mentorship video sessions.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-primary" />
                Pillar 2: Faculty &amp; Mentors
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Must accurately represent academic designations and departmental affiliations. Faculty agree to endorse student competencies impartially, maintain academic rigor in research immersion postings, and provide constructive pedagogical guidance.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Pillar 3: Academic Institutions
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Must maintain a valid All India Survey on Higher Education (AISHE) code. Training &amp; Placement Cells (TPOs) are obligated to exercise reasonable diligence when reviewing and approving student credentials and campus announcements.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Pillar 4: Corporate Partners
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Must publish genuine, funded job and internship requisitions with clear compensation guidelines. Partners agree to respect student intellectual property on open-source repositories and evaluate assessed candidates based strictly on merit.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "code-ip-ownership",
      number: "2.0",
      title: "100% Student Code & Artifact Intellectual Property",
      icon: Code2,
      badge: "Irrevocable IP",
      summary: "Students retain full, unencumbered intellectual property rights over all code, portfolios, and project submissions.",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1.5">
            <span className="font-bold font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Foundational Guarantee: Unencumbered Student Intellectual Property
            </span>
            <p className="text-xs leading-relaxed">
              PortalAcademia claims zero proprietary ownership, commercial licenses, or patent rights over student source code, algorithmic submissions, GitHub repositories, or research whitepapers submitted to or created through the platform.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Sole Exclusive Ownership:</strong> All code authored in standardized skill assessments, hackathons, open-source pull requests, or uploaded to candidate portfolios remains the 100% sole exclusive property of the authoring student or scholar.
            </li>
            <li>
              <strong className="text-foreground font-medium">Limited Testing License:</strong> By submitting code to automated skill assessments or test runners, you grant PortalAcademia only a temporary, non-exclusive license to execute, test, and analyze the code for automated competency scoring and plagiarism detection.
            </li>
            <li>
              <strong className="text-foreground font-medium">Open-Source Contributions:</strong> Contributions to enterprise open-source repositories registered on PortalAcademia remain governed by the public open-source license declared by the repository (e.g., MIT, Apache 2.0). Industry partners receive rights strictly as permitted under that open-source license.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "credential-liability",
      number: "3.0",
      title: "Credential Auditing & Institutional Verification Liability Disclaimer",
      icon: ShieldCheck,
      badge: "Verification Disclaimer",
      summary: "PortalAcademia provides verification infrastructure; institutional placement cells hold auditing accountability.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia provides tamper-evident digital credentialing and deterministic ATS scoring infrastructure. However, the authenticity of uploaded physical certificates, transcripts, and external achievements relies on institutional review:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground block">
              Institutional Verification Disclaimer
            </span>
            Verification approvals are executed directly by college Placement and Training Officers (TPOs) or authorized issuing organizations. PortalAcademia does not independently examine original paper documents, physical university registers, or external notarizations. PortalAcademia expressly disclaims liability for fraudulent documents, forged credentials, or misleading representations that pass institutional approval.
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Badge Revocation &amp; Score Recalculation:</strong> If a credential is subsequently determined to be fraudulent, forged, or issued in error, PortalAcademia reserves the absolute right to revoke the verified badge, deduct corresponding points from the candidate's ATS score, and notify affiliated institutions.
            </li>
            <li>
              <strong className="text-foreground font-medium">Fraud Sanctions:</strong> Submitting falsified certificates, fake university roll numbers, or forged employer recommendation letters constitutes a material violation of these Terms and will result in immediate permanent account termination.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "acceptable-use",
      number: "4.0",
      title: "Platform Acceptable Use Policy & Anti-Abuse Standards",
      icon: Ban,
      badge: "Zero Tolerance",
      summary: "Prohibited conduct: automated scraping, AI prompt injection, assessment cheating, ghost postings, and harassment.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To preserve academic integrity and a safe professional ecosystem, users agree never to engage in any of the following prohibited activities:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                1. Automated Scraping &amp; Extraction
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Using web scrapers, bots, automated crawlers, or unauthorized scripts to extract candidate profiles, recruiter directories, assessment test banks, or salary telemetry.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                2. AI Career Guide Abuse
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Attempting prompt injection, jailbreaking, or exploiting the Groq LLM interface to generate malicious code, spam, academic assessment answers, or off-topic commercial content.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                3. Assessment Tampering
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Collaborative cheating during timed assessments, sharing examination answer keys, reverse-engineering test suites, or using browser automation extensions to falsify competency scores.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                4. Fraudulent &amp; Ghost Listings
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Publishing fictitious job postings, multi-level marketing positions, unpaid requisitions disguised as paid roles, or collecting candidate resumes without legitimate hiring intent.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                5. Video Mentorship Misconduct
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Harassment, stalking, vulgarity, unauthorized session recording, or soliciting off-platform private payments during 1-on-1 WebRTC peer mentorship calls.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                6. Identity Impersonation
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Registering under someone else's identity, misrepresenting university enrollment, forging institutional AISHE accreditation, or claiming fraudulent corporate domains.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "payment-premium",
      number: "5.0",
      title: "Premium Membership, Free Trial & Razorpay Payment Terms",
      icon: CreditCard,
      badge: "₹200 / 30 Days",
      summary: "Razorpay subscription billing, non-refundable terms, no recurring surprise charges, and expiration handling.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia offers student scholars optional tier progression to unlock specialized open-source repositories, 1-on-1 peer mentorship scheduling, and priority recruiter indexing:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground block">
              Transparent Subscription Model
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/90 font-mono text-[11px]">
              <li><strong className="text-primary">7-Day Free Trial:</strong> Available once per verified student account. Activates instantly without upfront credit card requirements.</li>
              <li><strong className="text-primary">Flat ₹200 / 30-Day Pass:</strong> Fixed membership processed securely via Razorpay Software Private Limited.</li>
              <li><strong className="text-primary">Zero Auto-Debit Surprises:</strong> Subscriptions do not automatically renew or auto-charge your payment method. Access automatically expires after 30 days unless manually renewed.</li>
            </ul>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Non-Refundable Policy:</strong> Because premium access activates instantly upon successful payment verification and unlocks immediate digital capabilities, payments are strictly non-refundable once processed for that billing cycle.
            </li>
            <li>
              <strong className="text-foreground font-medium">Subscription Lapse &amp; Continuity:</strong> When a premium subscription expires, previously earned verified certificates, assessment badges, and completed mentorship ratings remain permanently saved on your profile. However, scheduling new mentorship sessions, participating in private community spaces, and accessing active premium open-source repositories will require renewing your pass.
            </li>
            <li>
              <strong className="text-foreground font-medium">Payment Data Security:</strong> All payment transactions are executed directly within Razorpay's PCI-DSS compliant checkout frame. PortalAcademia never stores your card number, CVV, or banking credentials.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "mentorship-honor-code",
      number: "6.0",
      title: "Senior Peer Mentorship, Mentor Honor Code & Disclaimers",
      icon: Video,
      badge: "Mentor Honor Code",
      summary: "100% free advising pledge, zero off-platform solicitation, +20 ATS boost integrity, and misconduct sanctions.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Senior Scholar Mentorship workspace enables 4th-year students and alumni to advise junior scholars via encrypted 1-on-1 WebRTC video sessions. All participating mentors are legally bound by the <strong>Mentor Honor Code</strong>:
          </p>

          <div className="p-4 rounded-sm bg-card border border-border space-y-2 text-xs shadow-2xs">
            <span className="font-bold text-foreground font-mono text-xs block">
              The PortalAcademia Mentor Honor Code
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">100% Free Senior Advising:</strong> Mentorship on PortalAcademia is an educational service for scholars. Mentors are strictly prohibited from soliciting, negotiating, or accepting offline compensation (cash, UPI, gifts, cryptocurrency) from mentees.</li>
              <li><strong className="text-foreground">Academic Honesty &amp; Non-Ghostwriting:</strong> Mentors guide, review architecture, and explain concepts using Socratic methods. Mentors must never write graded coursework code for mentees or complete assignments on their behalf.</li>
              <li><strong className="text-foreground">Psychological Safety &amp; Empathy:</strong> Sessions must maintain constructive, encouraging, and harassment-free dialogue.</li>
            </ul>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Peer Guidance Disclaimer:</strong> Mentorship sessions constitute peer-to-peer educational guidance and do not represent formal institutional tutoring, legal counsel, or guaranteed employment outcomes.
            </li>
            <li>
              <strong className="text-foreground font-medium">+20 ATS Boost Integrity:</strong> Mentors receive a +20 ATS score profile boost only after completing a verified term meeting statutory integrity gates (&ge; 21 days timeline or &ge; 2 sessions lasting &ge; 30 mins) and receiving satisfactory ratings (&ge; 4.0). Fabricating session duration or colluding to inflate reviews will result in permanent disqualification.
            </li>
            <li>
              <strong className="text-foreground font-medium">In-Call Misconduct Reporting:</strong> Participants can file real-time misconduct reports during any call. If an administrative investigation substantiates misconduct (<code className="font-mono text-[11px] bg-secondary text-destructive px-1 py-0.5 rounded">action_taken</code>), the offending party's mentor status is permanently revoked and the incident is reported to their affiliated institution.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "limitation-liability",
      number: "7.0",
      title: "Limitation of Liability & Employment Disclaimer",
      icon: Scale,
      badge: "No Job Guarantee",
      summary: "Platform disclaims employment guarantees, recruiter hiring decisions, and AI counseling absolute accuracy.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia is an academia-industry collaboration and skill benchmarking technology platform. We are not an employment agency, job consultancy, or hiring contractor:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground block">
              Explicit Disclaimer of Employment Guarantees
            </span>
            PortalAcademia does not guarantee that using the platform, completing skill assessments, achieving high ATS scores, or consulting the AI Career Guide will result in job offers, internship placements, interview callbacks, or specific compensation levels. Final hiring decisions rest solely in the independent discretion of participating corporate partners.
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">No Liability for Third-Party Actions:</strong> PortalAcademia is not responsible or liable for the conduct, hiring practices, interview delays, or contractual breaches of any employer, recruiter, or academic institution using the platform.
            </li>
            <li>
              <strong className="text-foreground font-medium">AI Career Advice Disclaimer:</strong> Inferences and skill gap roadmaps generated by the Groq AI Guide represent probabilistic informational models and should not be relied upon as certified career, educational, or legal advice.
            </li>
            <li>
              <strong className="text-foreground font-medium">Platform Availability:</strong> While we endeavor to maintain high availability, PortalAcademia is provided on an "as-is" and "as-available" basis without warranties of uninterrupted uptime or error-free operation.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "termination-sanctions",
      number: "8.0",
      title: "Account Suspension, Termination & Statutory Jurisdiction",
      icon: AlertTriangle,
      badge: "Statutory Law",
      summary: "Immediate termination grounds, dispute resolution, and jurisdiction under Indian statutory law.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia reserves the right to immediately suspend or permanently terminate user accounts that violate these Terms or threaten platform safety:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Immediate Termination Grounds:</strong> Falsifying academic credentials, engaging in WebRTC session harassment, automated scraping of candidate databases, publishing fraudulent jobs, or attempting to compromise server infrastructure.
            </li>
            <li>
              <strong className="text-foreground font-medium">Effect of Termination:</strong> Upon termination, your right to access the platform terminates immediately. Verified credentials associated with fraudulent submissions will be invalidated.
            </li>
          </ul>

          <div className="p-4 rounded-sm bg-card border border-border space-y-2 text-xs shadow-2xs">
            <span className="font-mono text-muted-foreground uppercase text-[10px] block font-bold">
              Legal Jurisdiction &amp; Dispute Resolution
            </span>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India, including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai or New Delhi, India.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-muted-foreground">Formal Legal Notices:</span>
              <a
                href="mailto:legal@portalacademia.ac.in"
                className="font-mono text-primary font-medium hover:underline"
              >
                legal@portalacademia.ac.in
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
      <title>Terms &amp; Conditions — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia statutory terms of service governing multi-stakeholder roles, 100% student IP ownership, Razorpay memberships, and verified credential liability."
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
                Legal &amp; Terms
              </span>
            </div>

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
              <Link
                to="/knowledge-base"
                className="px-3 py-1 rounded-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Knowledge Base
              </Link>
            </div>

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
                  STATUTORY TERMS OF SERVICE
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">REVISION 3.3.0</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">IT ACT 2000 &amp; DPDP ACT ALIGNED</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                Terms &amp; Conditions of Service
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Legally binding agreement establishing student intellectual property guarantees, credential verification responsibilities, Razorpay memberships, and ethical peer mentorship standards.
              </p>
            </div>

            {/* Plain-Language Terms Summary Panel */}
            <div className="p-4 sm:p-5 rounded-md border border-border bg-card/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-xs uppercase text-foreground">
                    Terms at a Glance (Plain-Language Summary)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-primary/10 border border-primary/20 text-primary font-semibold">
                  Key Takeaways
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">1. 100% Student Code IP</strong>
                  <p>
                    You retain complete, exclusive ownership of your code, algorithms, repositories, and resumes. We never claim proprietary rights to your work.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">2. Verification &amp; Liability</strong>
                  <p>
                    Colleges and placement cells audit and approve credentials. We provide the scoring engine but do not guarantee hiring offers or employment outcomes.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">3. Free Senior Mentorship</strong>
                  <p>
                    Senior peer mentorship is 100% free under our Honor Code. Demanding or offering off-platform private payments leads to an immediate permanent ban.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Commitments Bento Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-emerald-500" />
                  IP Protection
                </span>
                <p className="text-xs font-bold text-foreground">100% Student Code IP</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Zero claim on your algorithms, repos, or project solutions.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-emerald-500" />
                  Fair Payments
                </span>
                <p className="text-xs font-bold text-foreground">₹200 / 30 Days (No Auto-Renew)</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Flat pass via Razorpay; no surprise auto-debits on expiration.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Video className="w-3 h-3 text-emerald-500" />
                  Honor Code
                </span>
                <p className="text-xs font-bold text-foreground">100% Free Peer Advising</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Senior mentorship is educational; off-platform solicitation is banned.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-500" />
                  Clear Scope
                </span>
                <p className="text-xs font-bold text-foreground">No Employment Guarantee</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Objective skill matching tool; recruiters make final hiring calls.
                </p>
              </div>
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
                    {sections.length} Articles
                  </span>
                </div>

                {/* Filter / Search input inside TOC */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search terms &amp; clauses..."
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

              {/* Legal Council Support Card */}
              <div className="p-3.5 rounded-sm bg-muted/30 border border-border space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Legal Compliance Desk
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Questions regarding contractual terms or enterprise licensing?
                </p>
                <a
                  href="mailto:legal@portalacademia.ac.in"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>legal@portalacademia.ac.in</span>
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
                  placeholder="Search terms &amp; clauses..."
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
                  <p className="text-xs font-semibold text-foreground">No terms matched "{searchQuery}"</p>
                  <p className="text-[11px] text-muted-foreground">
                    Try searching for terms like "IP", "mentorship", "liability", "refund", or "acceptable use".
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

              {/* ── Related Governance Cross-Links ─────────────────── */}
              <div className="p-4 rounded-sm bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">Related Governance:</span>
                  <Link to="/privacy" className="text-primary hover:underline font-mono">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link to="/knowledge-base" className="text-primary hover:underline font-mono">
                    Knowledge Base
                  </Link>
                  <span>•</span>
                  <Link to="/faq" className="text-primary hover:underline font-mono">
                    FAQ
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" />
                  <span>IT Act 2000 &amp; DPDP Act Aligned</span>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* ── Minimal Swiss Footer ─────────────────────────────────── */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-card mt-auto print:border-none print:py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. Four-Pillar Legal Governance Specification.</span>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/knowledge-base" className="hover:text-foreground transition-colors">
                Knowledge Base
              </Link>
              <span>•</span>
              <Link to="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
