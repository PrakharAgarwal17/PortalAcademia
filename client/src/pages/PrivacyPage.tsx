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
  CreditCard,
  Cloud,
  Globe,
  FileText,
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
                  Pillar 2: Faculty &amp; Senior Mentors
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

          <div className="pt-2 space-y-2">
            <span className="font-semibold text-xs text-foreground block">
              Additional Feature-Specific Data Telemetry
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground font-medium">Open-Source GitHub Contributions:</strong> When participating in enterprise open-source repositories, our system receives GitHub webhook payloads containing your GitHub username, PR number, PR title, commit identifiers, and merge status via SHA256 HMAC verification.
              </li>
              <li>
                <strong className="text-foreground font-medium">Community Discussion Spaces:</strong> Messages, files, and membership status in enterprise community discussion spaces (<code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">/dashboard/community</code>) are visible to all verified participants within that space and are not private communications.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "ai-processing",
      number: "2.0",
      title: "AI Career Guide & Groq LLM Inference Governance",
      icon: Bot,
      badge: "7-Day TTL Storage",
      summary: "Groq Cloud LLM inference boundaries, payload minimization, and 7-day automated conversation pruning.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates a contextual AI Career Guide workspace powered by Groq Cloud API inference endpoints running Meta's LLaMA-3.3 70B architecture. We maintain strict privacy and data minimization boundaries for all automated inferences:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Inference Data Pipeline &amp; Provider Policy
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inference queries are transmitted over encrypted TLS connections to Groq Cloud API endpoints located in the United States. Under Groq's standard commercial API data terms, customer prompt inputs are processed ephemerally and are not utilized to train foundation models. Passwords, session tokens, and academic transcripts are never sent to external AI compute endpoints.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Payload Minimization:</strong> Requests transmit only the candidate's immediate career question, the preceding 6 conversation turns, and anonymized skill deficit vectors required to contextualize advice.
            </li>
            <li>
              <strong className="text-foreground font-medium">Strict 7-Day MongoDB TTL Log Expiration:</strong> All conversational AI telemetry is recorded in our internal <code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">AiLog</code> collection with an automatic native MongoDB TTL index (<code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">expireAfterSeconds: 604800</code>). After exactly 7 days, conversation records are automatically deleted from database storage.
            </li>
            <li>
              <strong className="text-foreground font-medium">Storage Safety Pruning:</strong> To prevent database saturation, automatic batch pruning (<code className="font-mono text-primary bg-secondary px-1.5 py-0.5 rounded-xs text-[11px]">pruneIfThresholdExceeded</code>) discards historical logs if aggregate telemetry exceeds storage safety quotas.
            </li>
            <li>
              <strong className="text-foreground font-medium">Academic Integrity Constraints:</strong> The AI Guide system prompt explicitly prohibits the generation of graded assignment code, assessment answers, or plagiarized artifacts.
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
      summary: "Peer-to-peer audio/video streaming, zero server-side recording, and guaranteed camera/mic hardware release.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia features a 1-on-1 peer mentorship engine connecting junior scholars with verified 4th-year senior mentors. Sessions run via browser-native WebRTC peer-to-peer streaming with strict device-level privacy safeguards:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Zero Server-Side Media Recording
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audio, video, and screen-sharing packets stream directly between participants via DTLS-SRTP encryption. Relays via Google STUN or Metered TURN are utilized strictly for NAT traversal; media packets are never recorded, tapped, or stored on PortalAcademia application servers.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Deterministic Hardware Track Teardown
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a video session concludes, our <code className="font-mono text-[11px] bg-secondary text-primary px-1 py-0.5 rounded">forceStopAllHardwareMedia()</code> protocol traverses all active media tracks across video elements, peer connections, and global stream registries, forcing hardware indicator lights (webcam and microphone LEDs) to extinguish immediately.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Our signaling servers log high-level metadata only: session start timestamp, completion timestamp, logged duration in minutes, and optional mentee feedback ratings. This metadata is strictly required to enforce term completion integrity gates and award verified +20 ATS profile boosts.
          </p>
        </div>
      ),
    },
    {
      id: "authentication-security",
      number: "4.0",
      title: "Authentication, Session Cookies & Storage Architecture",
      icon: KeyRound,
      badge: "HttpOnly Cookies",
      summary: "HttpOnly SameSite session tokens, bcrypt hashing, and transparent disclosure of ongoing security controls.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia implements a standards-compliant session and authentication architecture designed to minimize token exposure and prevent client-side credential tampering:
          </p>

          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border space-y-1.5 text-xs text-muted-foreground">
            <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              Cookie Disclosure &amp; Scope
            </span>
            <p className="leading-relaxed">
              We use strictly necessary functional session cookies. PortalAcademia does not deploy third-party advertising cookies, marketing trackers, or cross-site tracking pixels:
            </p>
            <ul className="list-disc pl-5 space-y-1 pt-1 text-foreground/90 font-mono text-[11px]">
              <li><code className="text-primary font-bold">accesstoken</code> (15-min lifespan): Stateless HttpOnly JWT used for authenticated API calls.</li>
              <li><code className="text-primary font-bold">refreshtoken</code> (7-day or 30-day lifespan): HttpOnly token used for seamless session rotation.</li>
            </ul>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Bcrypt Password Hashing:</strong> Passwords are cryptographically salted and hashed using bcrypt (10 rounds) prior to database persistence. Plaintext credentials are never written to disk or logs.
            </li>
            <li>
              <strong className="text-foreground font-medium">Zero LocalStorage Credentials:</strong> Authentication tokens and sensitive session tokens are never stored in browser <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">localStorage</code> or <code className="font-mono text-[11px] bg-secondary text-foreground px-1 py-0.5 rounded">sessionStorage</code>, mitigating script-based token harvesting.
            </li>
            <li>
              <strong className="text-foreground font-medium">Security Posture Disclosure:</strong> While core session authentication relies on HttpOnly cookies and TLS 1.3 transport, the platform operates under a continuous security remediation roadmap. Secondary safeguards (including enhanced sliding-window rate limiting on OTP routes, fine-grained CSP headers, and automated vulnerability scanning) are actively being hardened.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "processors-infrastructure",
      number: "5.0",
      title: "Third-Party Data Processors & Infrastructure Hosting",
      icon: Cloud,
      badge: "Named Processors",
      summary: "Full disclosure of Cloudinary (media), Razorpay (payments), MongoDB Atlas (AWS Mumbai), and Groq Cloud (AI).",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            To provide robust enterprise functionality, PortalAcademia contracts with trusted third-party infrastructure providers that act as data processors under contractual data protection terms:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-primary" />
                  Cloudinary Ltd.
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Media &amp; CDN</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Utilized exclusively for optimized storage and delivery of uploaded profile pictures, resume documents (PDF, DOCX), and institutional credential verification media. Files are accessed via secure HTTPS URLs.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  Razorpay Software Pvt. Ltd.
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Payment Gateway</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Processes credit/debit card, UPI, and net banking payments for Premium Scholar subscriptions. PortalAcademia collects and stores only the Razorpay order ID, payment ID, and subscription expiration date. PortalAcademia never collects or stores raw credit card numbers or banking PINs.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  MongoDB Atlas (AWS Mumbai)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Primary Database</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Primary application database clusters are deployed within the <strong>AWS Asia Pacific (Mumbai / ap-south-1)</strong> region, ensuring primary student and institutional data is stored within the territory of India in alignment with DPDP Act sovereignty guidelines.
              </p>
            </div>

            <div className="p-3.5 rounded-sm bg-card border border-border space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  Groq Cloud Inc.
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">AI Compute</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Processes real-time inference queries for the AI Career Guide. Data is processed ephemerally on US-based cloud inference infrastructure without persistent retention or model training by Groq.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "visibility-sharing",
      number: "6.0",
      title: "Recruiter Discovery & Zero Commercial Data Brokerage",
      icon: Eye,
      badge: "No Data Sales",
      summary: "Candidate telemetry is never sold to marketing brokers; corporate access is strictly gated.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            PortalAcademia operates under an absolute <strong className="text-foreground">Zero Third-Party Data Monetization</strong> policy. Student candidate telemetry is never sold, leased, or traded to marketing brokers, data aggregators, or ad networks. Corporate recruiters access candidate profiles exclusively under three transparent workflows:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">1. Direct Application</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you apply to a published job or internship listing, the posting recruiter receives your verified profile, resume artifact, match score, and assessment badges.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">2. Talent Discovery</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If discoverability is enabled, verified corporate recruiters can review candidate competency matrices and verified skill scores.
              </p>
            </div>
            <div className="p-3 rounded-sm bg-card border border-border space-y-1">
              <span className="font-mono font-bold text-xs text-foreground">3. Institutional Endorsement</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                College placement officers (TPOs) may endorse select candidates, attaching an official verified seal to student requisitions.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dpdp-compliance",
      number: "7.0",
      title: "DPDP Act 2023 Compliance, Sovereign Rights & Age Policy",
      icon: FileCheck2,
      badge: "DPDP Aligned",
      summary: "Full compliance with India's Digital Personal Data Protection Act 2023, data portability, erasure, and youth policy.",
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            In compliance with India's <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong> and international academic privacy principles, PortalAcademia guarantees all users sovereign control over their digital identity:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Access &amp; Data Portability</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Request a complete archive of your profile data, verified skill badges, application records, and AI consultation logs in machine-readable JSON format.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Correction &amp; Rectification</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Update inaccurate profile details, uploaded certification credentials, or contact preferences directly via your profile settings.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Right to Permanent Erasure ("Right to be Forgotten")</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Request permanent account deletion and purging of non-regulatory telemetry records by emailing our Data Protection Officer at <span className="font-mono text-primary font-medium">dpo@portalacademia.ac.in</span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-card border border-border flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-foreground">Consent Withdrawal</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  You may withdraw consent for recruiter talent discovery or email notification dispatches at any time with immediate effect.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-sm bg-muted/40 border border-border space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block">
              Higher Education Eligibility &amp; Policy on Minors
            </span>
            <p className="leading-relaxed">
              PortalAcademia is designed for students enrolled in recognized higher education institutions, polytechnics, and universities, who are typically 18 years of age or older. Students under the age of 18 enrolled in university bridge or diploma programs must access the platform with institutional or parental/guardian consent. PortalAcademia does not knowingly collect personal data from children under 13.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "institutional-governance",
      number: "8.0",
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
      number: "9.0",
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
                <p className="font-semibold text-foreground mt-0.5">PortalAcademia Trust &amp; Safety Council</p>
                <p className="text-muted-foreground">Technology Innovation Hub, IIT Bombay Research Park</p>
                <p className="text-muted-foreground">Powai, Mumbai, Maharashtra 400076, India</p>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="font-mono text-muted-foreground uppercase text-[10px] block">
                    Direct Email Redressal
                  </span>
                  <a
                    href="mailto:dpo@portalacademia.ac.in"
                    className="font-mono font-medium text-primary hover:underline"
                  >
                    dpo@portalacademia.ac.in
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
      <title>Privacy Policy &amp; Telemetry Governance — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia comprehensive data governance specification covering DPDP Act 2023 compliance, Groq LLM inference, HttpOnly session tokens, and student IP protection."
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
                Legal &amp; Governance
              </span>
            </div>

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
                <span className="text-muted-foreground">REVISION 3.3.0</span>
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

            {/* Plain-Language Executive Summary Panel (DPDP Transparency Expectation) */}
            <div className="p-4 sm:p-5 rounded-md border border-border bg-card/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-xs uppercase text-foreground">
                    Plain-Language Executive Summary (TL;DR)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                  DPDP Act Plain-Text Standard
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">1. What We Collect &amp; Why</strong>
                  <p>
                    Only academic, assessment, and credential data needed to benchmark your skills, connect you to recruiters, and coordinate 1-on-1 peer mentorship.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">2. What We NEVER Do</strong>
                  <p>
                    We never sell, rent, or trade your personal records, resumes, or assessment transcripts to third-party ad networks or data brokers.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-foreground block font-mono text-[11px]">3. Your Rights &amp; Sovereign Control</strong>
                  <p>
                    You have full DPDP Act rights to export, correct, or permanently erase your account data. Our designated DPO responds within 72 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Executive Key Guarantees Bento Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
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
                  Tokens restricted from client scripts, eliminating localStorage theft.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  AI Ephemerality
                </span>
                <p className="text-xs font-bold text-foreground">7-Day TTL Storage</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Groq Cloud inference; chat history automatically erased after 7 days.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-card border border-border space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-500" />
                  Sovereign Hosting
                </span>
                <p className="text-xs font-bold text-foreground">AWS Mumbai (India)</p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Primary databases hosted in India per DPDP Act territorial expectations.
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
              <div id="dpo-card" className="p-3.5 rounded-sm bg-muted/30 border border-border space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Data Protection Officer
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Have an enquiry or want to exercise your DPDP rights?
                </p>
                <a
                  href="mailto:dpo@portalacademia.ac.in"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>dpo@portalacademia.ac.in</span>
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
                    Try searching for terms like "cookies", "Groq", "WebRTC", "DPDP", "Cloudinary", or "Razorpay".
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
                  <Link to="/terms" className="text-primary hover:underline font-mono">
                    Terms &amp; Conditions
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
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>DPDP Act 2023 &amp; AISHE Aligned</span>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* ── Minimal Swiss Footer ─────────────────────────────────── */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-card mt-auto print:border-none print:py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. DPDP Act 2023 Aligned Telemetry Specification.</span>
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
