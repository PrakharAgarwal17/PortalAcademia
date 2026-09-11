import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CheckCircle2,
  Clock,
  Bot,
  Send,
  X,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Search,
  Filter,
  Inbox,
  ChevronDown,
  Building2,
  MapPin,
  TrendingUp,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Layers,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface FacultyProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
  accountType: string;
  designation?: string;
  department?: string;
  institution?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  expertise?: string[];
  researchInterests?: string[];
  bio?: string;
}

interface Opportunity {
  _id: string;
  title: string;
  description: string;
  organization: string;
  category: string;
  domain: string;
  location: string;
  mode: string;
  duration: string;
  stipendOrPrize: string;
  requiredSkills: string[];
  deadline: string;
  recommendedToFacultyBy?: string[];
  applicantCount: number;
}

export type FacultyCategoryFilter =
  | "all"
  | "fdp"
  | "research"
  | "conference"
  | "workshop"
  | "industrial_training";

export const CATEGORY_OPTIONS: { id: FacultyCategoryFilter; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "fdp", label: "FDP" },
  { id: "research", label: "Research Opportunity" },
  { id: "conference", label: "Conferences" },
  { id: "workshop", label: "Workshops" },
  { id: "industrial_training", label: "Industrial Training" },
];

const FACULTY_CONCERN_CHIPS = [
  "How are IP rights handled during industry sabbaticals?",
  "Which corporate immersion projects grant MHRD CAS credits?",
  "How do I align my course syllabus with industry deficits?",
  "How can I initiate a corporate research collaboration?",
];

const DEFAULT_FACULTY_OPPORTUNITIES: Opportunity[] = [
  // 1. FDP
  {
    _id: "opp-fdp-1",
    title: "Faculty Development Program (FDP) on AI & Pedagogical Modernization",
    description: "Intensive 2-week hybrid refresher program empowering university professors to integrate live industry telemetry, case studies, and ML tools into syllabus design.",
    organization: "IIT Bombay & Ministry of Education",
    category: "fdp",
    domain: "Higher Education Curriculum Modernization",
    location: "Mumbai, Maharashtra",
    mode: "Hybrid",
    duration: "2 Weeks",
    stipendOrPrize: "MHRD Certified Credit Badge",
    requiredSkills: ["Machine Learning", "Curriculum Design", "Python"],
    deadline: "2026-10-25",
    recommendedToFacultyBy: ["Academic Council", "Department Chair"],
    applicantCount: 9,
  },
  {
    _id: "opp-fdp-2",
    title: "AICTE-ATAL FDP on Quantum Computing & Cryptographic Systems",
    description: "National training initiative on quantum algorithms, Qiskit programming, and post-quantum cryptography frameworks for senior faculty and research advisors.",
    organization: "IISc Bangalore & AICTE ATAL",
    category: "fdp",
    domain: "Quantum Information Science",
    location: "Bengaluru, Karnataka",
    mode: "Remote",
    duration: "1 Week",
    stipendOrPrize: "AICTE ATAL Certification",
    requiredSkills: ["Quantum Computing", "Linear Algebra", "Python"],
    deadline: "2026-11-10",
    recommendedToFacultyBy: ["Research & Dean Office"],
    applicantCount: 16,
  },

  // 2. Research Opportunity
  {
    _id: "opp-res-1",
    title: "Joint DST-SERB Research Grant on Clean Energy & Smart Grids",
    description: "Co-funded grant for university faculty to spearhead smart microgrid optimization, renewable energy forecasting, and distributed IoT sensing research.",
    organization: "DST-SERB & Tata Power Labs",
    category: "research",
    domain: "Renewable Energy & Power Systems",
    location: "New Delhi / Host Campus",
    mode: "Hybrid",
    duration: "1 - 2 Years",
    stipendOrPrize: "₹35,00,000 Research Grant",
    requiredSkills: ["Power Systems", "IoT", "MATLAB", "Data Modeling"],
    deadline: "2026-12-15",
    recommendedToFacultyBy: ["Dean of Sponsored Research (DSR)"],
    applicantCount: 6,
  },
  {
    _id: "opp-res-2",
    title: "AI in Healthcare Diagnostics & Clinical NLP Research Residency",
    description: "Cross-institutional collaborative project focusing on automated radiological report analysis and multi-modal pathology vision models.",
    organization: "ICMR & Microsoft Research India",
    category: "research",
    domain: "Biomedical AI & Diagnostics",
    location: "Hyderabad, Telangana",
    mode: "Hybrid",
    duration: "6 Months",
    stipendOrPrize: "₹18,00,000 Grant",
    requiredSkills: ["Deep Learning", "Computer Vision", "PyTorch", "NLP"],
    deadline: "2026-11-20",
    recommendedToFacultyBy: ["University Academic Council"],
    applicantCount: 8,
  },

  // 3. Conferences
  {
    _id: "opp-conf-1",
    title: "IEEE International Conference on Advanced Computing & Communications (ACC-2026)",
    description: "Premier academic symposium calling for faculty research papers, panel discussions, and keynote presentations on emerging computing paradigms and distributed networks.",
    organization: "IEEE India Council & IIT Madras",
    category: "conference",
    domain: "Computer Science & Communications",
    location: "Chennai, Tamil Nadu",
    mode: "On-site",
    duration: "3 Days",
    stipendOrPrize: "Scopus / IEEE Xplore Indexing",
    requiredSkills: ["Research Publishing", "Peer Review", "Cloud Architecture"],
    deadline: "2026-10-30",
    recommendedToFacultyBy: ["Department of CSE"],
    applicantCount: 42,
  },
  {
    _id: "opp-conf-2",
    title: "National Higher Education Innovation & NEP 2020 Academic Summit",
    description: "Annual convention of university deans and department chairs focusing on NEP curriculum alignment, institutional accreditation, and research patents.",
    organization: "University Grants Commission (UGC)",
    category: "conference",
    domain: "Higher Education Policy & Patents",
    location: "New Delhi",
    mode: "Hybrid",
    duration: "2 Days",
    stipendOrPrize: "Invited Delegate / Publication",
    requiredSkills: ["NEP 2020", "Academic Governance", "Institutional Research"],
    deadline: "2026-11-05",
    applicantCount: 31,
  },

  // 4. Workshops
  {
    _id: "opp-ws-1",
    title: "AWS Cloud Practitioner & Serverless Architecture Masterclass",
    description: "4-week hands-on deep dive covering AWS Lambda, API Gateway, DynamoDB, and infrastructure-as-code with official certification examination vouchers.",
    organization: "AWS Academy & PortalAcademia",
    category: "workshop",
    domain: "Cloud Architecture & DevOps",
    location: "Remote (Interactive Virtual Lab)",
    mode: "Remote",
    duration: "4 Weeks",
    stipendOrPrize: "Free Certified Voucher (Value ₹12,000)",
    requiredSkills: ["Cloud", "Linux", "Docker"],
    deadline: "2026-10-15",
    recommendedToFacultyBy: ["Institution Innovation Council (IIC)"],
    applicantCount: 28,
  },
  {
    _id: "opp-ws-2",
    title: "Outcome-Based Education (OBE) & NBA Accreditation Hands-On Workshop",
    description: "Practical training on CO-PO mapping, attainment calculations, continuous quality improvement rubrics, and documentation for NBA accreditation.",
    organization: "National Board of Accreditation (NBA)",
    category: "workshop",
    domain: "Academic Accreditation & Quality Assurance",
    location: "Bengaluru, Karnataka",
    mode: "Hybrid",
    duration: "3 Days",
    stipendOrPrize: "NBA Master Trainer Certification",
    requiredSkills: ["OBE Rubrics", "Curriculum Mapping", "NBA Standards"],
    deadline: "2026-10-20",
    recommendedToFacultyBy: ["Internal Quality Assurance Cell (IQAC)"],
    applicantCount: 19,
  },

  // 5. Industrial Training
  {
    _id: "opp-ind-1",
    title: "Industrial Sabbatical in Autonomous Systems & Robotics",
    description: "Corporate sabbatical residency at DRDO laboratories for university faculty to conduct defense robotics research, unmanned aerial system simulation, and embedded control testing.",
    organization: "DRDO Research & Development Center",
    category: "industrial_training",
    domain: "Robotics, Autonomous Navigation & Control",
    location: "Pune, Maharashtra",
    mode: "On-site",
    duration: "3 - 6 Months",
    stipendOrPrize: "₹1,20,000 / mo Fellowship",
    requiredSkills: ["Robotics", "Embedded Systems", "C++", "Linux"],
    deadline: "2026-11-30",
    recommendedToFacultyBy: ["Dean Research & Development"],
    applicantCount: 11,
  },
  {
    _id: "opp-ind-2",
    title: "Semiconductor Fab & VLSI Physical Design Industry Immersion",
    description: "Corporate hands-on training residency with leading semiconductor chip designers focusing on 5nm tape-out, Cadence EDA toolchains, and silicon verification.",
    organization: "Intel India & MeitY Semiconductor Mission",
    category: "industrial_training",
    domain: "VLSI Design & Semiconductor Fabrication",
    location: "Bengaluru, Karnataka",
    mode: "On-site",
    duration: "8 Weeks",
    stipendOrPrize: "Industry Fellow Stipend ₹85,000 / mo",
    requiredSkills: ["Verilog", "Cadence", "VLSI Design", "Digital Electronics"],
    deadline: "2026-11-15",
    recommendedToFacultyBy: ["Industry-Academia Board"],
    applicantCount: 14,
  },
  {
    _id: "opp-fdp-3",
    title: "AICTE Sponsored FDP on Cyber Security & Blockchain Forensics",
    description: "Hands-on faculty training covering cryptographic hashing, smart contract security audits, zero-knowledge proofs, and digital forensics methodologies.",
    organization: "CERT-In & IIT Kanpur",
    category: "fdp",
    domain: "Cybersecurity & Cryptography",
    location: "Kanpur, Uttar Pradesh",
    mode: "Hybrid",
    duration: "2 Weeks",
    stipendOrPrize: "AICTE Certificate & CEH Credits",
    requiredSkills: ["Cyber Security", "Blockchain", "Solidity", "Network Security"],
    deadline: "2026-11-28",
    applicantCount: 22,
  },
  {
    _id: "opp-res-3",
    title: "National Supercomputing Mission (NSM) HPC Research Fellowship",
    description: "High-performance computing allocations and research grants for computational fluid dynamics, material science modeling, and molecular simulation.",
    organization: "C-DAC & Department of Science and Technology",
    category: "research",
    domain: "High Performance Computing & Simulations",
    location: "Pune, Maharashtra",
    mode: "Remote",
    duration: "1 Year",
    stipendOrPrize: "₹24,00,000 Compute & Grant Fund",
    requiredSkills: ["MPI", "OpenMP", "CUDA", "Linux HPC"],
    deadline: "2026-12-05",
    applicantCount: 12,
  },
];

function formatAiMessage(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1 my-1.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="font-mono text-[10.5px] bg-secondary px-1 py-0.5 rounded text-primary font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`flush-${idx}`);
      return;
    }

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
      flushList(`flush-${idx}`);
      const headingText = trimmed.replace(/^#+\s*/, "");
      elements.push(
        <h4 key={idx} className="font-bold text-foreground text-xs mt-3 mb-1 tracking-tight border-b border-border/40 pb-0.5">
          {renderInline(headingText)}
        </h4>
      );
    } else if (trimmed.startsWith("#### ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <h5 key={idx} className="font-semibold text-foreground text-[11px] mt-2 mb-0.5">
          {renderInline(trimmed.slice(5))}
        </h5>
      );
    } else if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={idx} className="text-xs leading-relaxed text-foreground/90 flex items-start gap-1.5">
          <span className="text-primary font-mono text-[10px] mt-0.5">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </li>
      );
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      flushList(`flush-${idx}`);
      elements.push(
        <div key={idx} className="text-xs leading-relaxed text-foreground/90 my-1 flex items-start gap-1.5">
          <span className="font-mono text-[10px] font-semibold text-primary mt-0.5">{trimmed.match(/^\d+[\.\)]/)?.[0]}</span>
          <span>{renderInline(trimmed.replace(/^\d+[\.\)]\s*/, ""))}</span>
        </div>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <blockquote key={idx} className="border-l-2 border-primary/60 pl-2.5 my-1.5 italic text-muted-foreground text-[11px] bg-secondary/30 py-1 rounded-r">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
      flushList(`flush-${idx}`);
      elements.push(<hr key={idx} className="border-border my-2" />);
    } else {
      flushList(`flush-${idx}`);
      elements.push(
        <p key={idx} className="text-xs leading-relaxed text-foreground/90 my-1">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  flushList("final-flush");
  return elements;
}

export default function FacultyDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Core data states
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation tabs: "dashboard" | "trends" | "self_analysis"
  const [activeNavTab, setActiveNavTab] = useState<"dashboard" | "trends" | "self_analysis">("dashboard");

  // Search query (from top bar [Search] input next to profile avatar)
  const [searchQuery, setSearchQuery] = useState("");

  // Filters (Category Filter dropdown and Inbox toggle)
  const [selectedCategory, setSelectedCategory] = useState<FacultyCategoryFilter>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isCollegeInboxOnly, setIsCollegeInboxOnly] = useState(false);

  // Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const infiniteScrollSentinelRef = useRef<HTMLDivElement | null>(null);

  // Application / Proposal Modal State
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [proposalNotes, setProposalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // AI Assistant Drawer
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Welcome Professor! I am your AI Academic Immersion Advisor. Ask me anything about faculty sabbaticals, FDPs, research grants, CAS credits, or industry collaborations.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Close filter dropdown on outside click
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * @description Fetch faculty live profile data
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch faculty profile:", err);
    }
  }, []);

  /**
   * @description Fetch live opportunities (sabbaticals, FDPs, research)
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setOpportunities(data.data);
      } else {
        setOpportunities(DEFAULT_FACULTY_OPPORTUNITIES);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
      setOpportunities(DEFAULT_FACULTY_OPPORTUNITIES);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchOpportunities()]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchOpportunities]);

  /**
   * Filter opportunities based on:
   * 1. Category (All, FDP, Research Opportunity, Conferences, Workshops, Industrial Training)
   * 2. Inbox / Recommended by College toggle
   * 3. Header Search Query
   */
  const filteredOpportunities = useMemo(() => {
    const list = opportunities.length > 0 ? opportunities : DEFAULT_FACULTY_OPPORTUNITIES;
    return list.filter((opp) => {
      const cat = (opp.category || "").toLowerCase();
      const title = (opp.title || "").toLowerCase();
      const desc = (opp.description || "").toLowerCase();
      const org = (opp.organization || "").toLowerCase();
      const skills = (opp.requiredSkills || []).map((s) => s.toLowerCase());

      // 1. College Recommendation (Inbox) filter
      if (isCollegeInboxOnly) {
        const hasRec =
          (opp.recommendedToFacultyBy && opp.recommendedToFacultyBy.length > 0) ||
          title.includes("aicte") ||
          title.includes("iit") ||
          title.includes("nba") ||
          title.includes("dst");
        if (!hasRec) return false;
      }

      // 2. Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "fdp") {
          if (!(cat === "fdp" || title.includes("fdp") || title.includes("faculty development"))) return false;
        } else if (selectedCategory === "research") {
          if (!(cat === "research" || title.includes("research") || title.includes("grant") || title.includes("fellowship"))) return false;
        } else if (selectedCategory === "conference") {
          if (!(cat === "conference" || cat === "conferences" || title.includes("conference") || title.includes("summit") || title.includes("symposium"))) return false;
        } else if (selectedCategory === "workshop") {
          if (!(cat === "workshop" || cat === "workshops" || title.includes("workshop") || title.includes("masterclass"))) return false;
        } else if (selectedCategory === "industrial_training") {
          if (!(cat === "industrial_training" || cat === "sabbatical" || cat === "training" || title.includes("industrial") || title.includes("training") || title.includes("sabbatical"))) return false;
        } else if (cat !== selectedCategory) {
          return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          title.includes(q) ||
          desc.includes(q) ||
          org.includes(q) ||
          skills.some((s) => s.includes(q));
        if (!matchesQ) return false;
      }

      return true;
    });
  }, [opportunities, selectedCategory, isCollegeInboxOnly, searchQuery]);

  // Infinite scroll trigger: load more items
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= filteredOpportunities.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 3, filteredOpportunities.length));
      setIsLoadingMore(false);
    }, 450);
  }, [isLoadingMore, visibleCount, filteredOpportunities.length]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = infiniteScrollSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(4);
  }, [selectedCategory, isCollegeInboxOnly, searchQuery]);

  /**
   * Helper to format human category label
   */
  const getCategoryLabel = (cat: string, title: string) => {
    const lowerCat = (cat || "").toLowerCase();
    const lowerTitle = (title || "").toLowerCase();
    if (lowerCat === "fdp" || lowerTitle.includes("fdp")) return "FDP";
    if (lowerCat === "research" || lowerTitle.includes("research")) return "Research Opportunity";
    if (lowerCat === "conference" || lowerTitle.includes("conference")) return "Conferences";
    if (lowerCat === "workshop" || lowerTitle.includes("workshop")) return "Workshops";
    if (lowerCat === "industrial_training" || lowerCat === "sabbatical" || lowerTitle.includes("industrial")) return "Industrial Training";
    return cat.toUpperCase();
  };

  /**
   * Helper for contextual action text
   */
  const getActionText = (cat: string, title: string) => {
    const lowerCat = (cat || "").toLowerCase();
    const lowerTitle = (title || "").toLowerCase();
    if (lowerCat === "research" || lowerTitle.includes("research")) return "Submit Proposal";
    if (lowerCat === "conference" || lowerTitle.includes("conference")) return "Submit Paper";
    if (lowerCat === "workshop" || lowerTitle.includes("workshop")) return "Register Workshop";
    if (lowerCat === "fdp" || lowerTitle.includes("fdp")) return "Apply for FDP";
    if (lowerCat === "industrial_training" || lowerCat === "sabbatical" || lowerTitle.includes("industrial")) return "Apply for Training";
    return "Apply Now";
  };

  /**
   * @description Submit sabbatical / FDP application
   */
  const handleApply = async () => {
    if (!applyingOpportunity) return;
    setIsSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          opportunityId: applyingOpportunity._id,
          notes: proposalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissionFeedback("Proposal submitted successfully to institution / corporate desk!");
        setTimeout(() => {
          setApplyingOpportunity(null);
          setProposalNotes("");
          setSubmissionFeedback(null);
        }, 1500);
      } else {
        setSubmissionFeedback(data.message || "Failed to submit proposal.");
      }
    } catch (err: any) {
      setSubmissionFeedback(err.message || "Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @description Send chat query to contextual AI
   */
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;
    const userText = aiQuery.trim();
    setAiQuery("");
    setAiChatHistory((prev) => [...prev, { role: "user", content: userText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: userText,
          history: aiChatHistory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.data.response },
        ]);
      } else {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue analyzing academic telemetry." },
        ]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI advisor." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendChipMessage = async (text: string) => {
    if (isAiLoading || !text.trim()) return;
    setAiQuery("");
    setAiChatHistory((prev) => [...prev, { role: "user", content: text }]);
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: text,
          history: aiChatHistory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.data.response },
        ]);
      } else {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue analyzing academic telemetry." },
        ]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI advisor." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Profile initials
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FA";

  // Selected Category Label
  const currentCategoryLabel =
    CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label || "Categories";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading faculty academic immersion telemetry…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 
        ========================================================================
        HEADER (Matches Sketch Exactly)
        - Left: Circular Profile Avatar ( O ) with verified tick + [ Search ] Bar
        - Right: Dashboard | Trends | Self Analysis | AI HelpBOT | LogOut (+ Theme)
        ========================================================================
      */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Side: Avatar Circle + Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Circular Profile Avatar ( O ) */}
            <div
              onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
              className="relative w-9 h-9 rounded-full bg-secondary border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-foreground shrink-0 shadow-xs cursor-pointer hover:border-primary transition-all overflow-hidden"
              title={`View ${profile?.name || "Faculty Member"}'s Profile`}
            >
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              {/* Verified tick mark */}
              <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
              </span>
            </div>

            {/* [ Search ] Bar */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities, topics, skills…"
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Navigation Links & Actions */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Dashboard Link */}
            <button
              type="button"
              onClick={() => setActiveNavTab("dashboard")}
              className={cn(
                "text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                activeNavTab === "dashboard"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Dashboard
            </button>

            {/* Trends Link */}
            <button
              type="button"
              onClick={() => setActiveNavTab("trends")}
              className={cn(
                "text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                activeNavTab === "trends"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Trends
            </button>

            {/* Self Analysis Link */}
            <button
              type="button"
              onClick={() => setActiveNavTab("self_analysis")}
              className={cn(
                "text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                activeNavTab === "self_analysis"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Self Analysis
            </button>

            {/* AI HelpBOT Button */}
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border cursor-pointer transition-all hover:border-primary/50 shadow-xs"
              title="Open AI Academic Immersion Advisor"
            >
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">AI HelpBOT</span>
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary border border-border cursor-pointer transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* LogOut Link */}
            <button
              type="button"
              onClick={() => dispatch(signOutThunk()).then(() => navigate("/auth"))}
              className="flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Log Out of Faculty Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">LogOut</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 
        ========================================================================
        SUBHEADER ACTION TOOLBAR (Right Side in Mockup)
        - Inbox: "Recommended by college" toggle
        - Filter: Oval button opening Categories dropdown:
            * FDP
            * Research Opportunity
            * Conferences
            * Workshops
            * Industrial Training
        ========================================================================
      */}
      <section className="bg-card/40 border-b border-border/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Active Status / Breadcrumb on left */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {profile?.name ? (
                <>
                  Logged in as <strong onClick={() => navigate(`/profile/${profile?._id || "me"}`)} className="text-foreground font-semibold hover:text-primary transition-colors cursor-pointer" title="View Full Profile">{profile.name}</strong>
                  {profile.institution && (
                    <span className="text-muted-foreground"> ({profile.institution})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-[11px] font-medium text-primary hover:underline ml-2"
                  >
                    View / Edit Profile →
                  </button>
                </>
              ) : (
                "Faculty Immersion Portal"
              )}
            </span>
          </div>

          {/* Right-aligned Action Buttons (Inbox & Filter) */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            
            {/* 1. Inbox button -> "Recommended by college" */}
            <button
              type="button"
              onClick={() => setIsCollegeInboxOnly((prev) => !prev)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                isCollegeInboxOnly
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground hover:bg-secondary border-border"
              )}
              title="Filter opportunities recommended by your college/institution"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors",
                  isCollegeInboxOnly
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                Recommended by college
              </span>
            </button>

            {/* 2. Filter oval button -> Categories Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className={cn(
                  "text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                  selectedCategory !== "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground hover:bg-secondary border-border"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {selectedCategory === "all" ? "Filter" : currentCategoryLabel}
                </span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isFilterDropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu (Categories) */}
              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-border/60">
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider block">
                      Categories
                    </span>
                  </div>
                  <div className="py-1">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left text-xs px-3 py-2 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer",
                            isSelected ? "font-bold text-primary bg-secondary/50" : "text-foreground"
                          )}
                        >
                          <span>{cat.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        MAIN BODY:
        Switch between "dashboard", "trends", and "self_analysis"
        ========================================================================
      */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
        {/* VIEW 1: DASHBOARD FEED (Mockup: "Recommended For You" + Infinite Scroll) */}
        {activeNavTab === "dashboard" && (
          <section className="space-y-4">
            
            {/* Heading: "Recommended For You" */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Recommended For You
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated academic opportunities, research fellowships, and industry sabbaticals matched to your profile.
                </p>
              </div>

              {/* Active Filter Indicator Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedCategory !== "all" && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    Category: {currentCategoryLabel}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {isCollegeInboxOnly && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    Inbox: Recommended by College
                    <button
                      type="button"
                      onClick={() => setIsCollegeInboxOnly(false)}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border flex items-center gap-1">
                    Search: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(selectedCategory !== "all" || isCollegeInboxOnly || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setIsCollegeInboxOnly(false);
                      setSearchQuery("");
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>
            </div>

            {/* Opportunities Feed (Stacked cards matching drawing) */}
            {filteredOpportunities.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-xl bg-card/30 space-y-2">
                <p className="text-sm font-semibold text-foreground">No opportunities matching your active filters</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing the category filter or changing your search terms to explore all opportunities.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setIsCollegeInboxOnly(false);
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  View All Opportunities
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOpportunities.slice(0, visibleCount).map((opp) => {
                  const isCollegeRecommended =
                    opp.recommendedToFacultyBy && opp.recommendedToFacultyBy.length > 0;

                  return (
                    <article
                      key={opp._id}
                      className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md space-y-3"
                    >
                      {/* Top Header of Card: Category Badge, College Recommended badge, Duration */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border uppercase tracking-wide">
                            {getCategoryLabel(opp.category, opp.title)}
                          </span>

                          {isCollegeRecommended && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Recommended by College
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {opp.duration}
                          </span>
                          <span>•</span>
                          <span>Deadline: {opp.deadline}</span>
                        </div>
                      </div>

                      {/* Main Title & Organization Details */}
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug">
                          {opp.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            {opp.organization}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {opp.location} ({opp.mode})
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {opp.description}
                      </p>

                      {/* Required Skills Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-muted-foreground mr-1 font-mono">Skills / Prerequisites:</span>
                        {opp.requiredSkills.map((sk, sIdx) => (
                          <SkillBadge key={sIdx} skill={sk} size="xs" />
                        ))}
                      </div>

                      {/* Footer: Stipend/Grant & Apply Action Button */}
                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                            Grant / Fellowship / Accreditation
                          </span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                            {opp.stipendOrPrize}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setApplyingOpportunity(opp)}
                          className="text-xs font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow"
                        >
                          <span>{getActionText(opp.category, opp.title)}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 
              ==================================================================
              INFINITE SCROLL COMPONENT (Matches Hand-Drawn Mockup at bottom)
              ==================================================================
            */}
            {filteredOpportunities.length > 0 && (
              <div
                ref={infiniteScrollSentinelRef}
                className="pt-6 pb-8 flex flex-col items-center justify-center gap-2"
              >
                {visibleCount < filteredOpportunities.length ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 text-xs font-mono font-semibold px-5 py-2.5 rounded-full bg-card hover:bg-secondary text-foreground border border-border transition-all shadow-xs cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Loading more recommendations…</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>
                          Infinite Scroll (Showing {Math.min(visibleCount, filteredOpportunities.length)} of {filteredOpportunities.length})
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>You're all caught up with recommended opportunities</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: TRENDS (Academic & Industry R&D Telemetry) */}
        {activeNavTab === "trends" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Academic & Industrial Immersion Trends
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time national telemetry on research grants, patents, faculty sabbatical demand, and NEP 2020 alignments.
              </p>
            </div>

            {/* Trends Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Growth in R&D Grants
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-foreground">+48.2%</span>
                  <span className="text-xs text-emerald-500 font-semibold">↑ YoY</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Driven by MeitY Semiconductor Mission, AI Healthcare, and DST-SERB clean energy allocations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Corporate Sabbaticals
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-foreground">3,850+</span>
                  <span className="text-xs text-emerald-500 font-semibold">Active Fellows</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Institutions granting CAS (Career Advancement Scheme) promotion points for corporate residencies.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Scopus & Patent Velocity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-foreground">8.4k</span>
                  <span className="text-xs text-primary font-semibold">Papers Indexed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cross-disciplinary engineering and AI-assisted educational methodologies published this academic cycle.
                </p>
              </div>
            </div>

            {/* Hot Academic Domains */}
            <div className="p-5 rounded-xl bg-card border border-border space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase text-foreground">
                High-Priority Domains (AICTE & Ministry of Education)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: "Quantum Information & Cryptography", tags: "IISc, IITM", heat: "High Demand" },
                  { title: "VLSI & Semiconductor Fab Tape-out", tags: "MeitY, Intel", heat: "Urgent" },
                  { title: "Autonomous Robotics & UAVs", tags: "DRDO, ISRO", heat: "Strategic" },
                  { title: "Outcome-Based Curriculum (OBE)", tags: "NBA, NAAC", heat: "Accreditation" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {item.heat}
                    </span>
                    <h4 className="text-xs font-bold text-foreground pt-1">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">{item.tags}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 3: SELF ANALYSIS (Faculty Profile & CAS Scoring) */}
        {activeNavTab === "self_analysis" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Faculty Self Analysis & Academic CAS Metrics
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculate CAS promotion points, NBA/NAAC attainment rubrics, and research collaboration index.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary border-2 border-primary/40 flex items-center justify-center font-bold text-sm text-foreground">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-foreground">{profile?.name || "Faculty Scholar"}</h3>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile?.designation || "Faculty Member"} • {profile?.department || "Department Not Specified"} • {profile?.institution || "Institution Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-md bg-secondary border border-border text-foreground">
                    CAS API Score: <strong className="text-primary">185 / 200</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-center">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block">FDPs Attended</span>
                  <span className="text-lg font-bold font-mono text-foreground">4</span>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block">Papers Published</span>
                  <span className="text-lg font-bold font-mono text-foreground">12</span>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block">Research Grants</span>
                  <span className="text-lg font-bold font-mono text-primary">₹22.5L</span>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block">Industry Residencies</span>
                  <span className="text-lg font-bold font-mono text-foreground">2</span>
                </div>
              </div>
            </div>

            {/* Expertise and Research Domains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-card border border-border rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Verified Academic Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.expertise && profile.expertise.length > 0
                    ? profile.expertise
                    : ["Machine Learning", "Cloud Systems", "VLSI Design", "Curriculum Modernization"]
                  ).map((exp, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-foreground font-mono border border-border">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-card border border-border rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Research Interests & Sabbatical Focus
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.researchInterests && profile.researchInterests.length > 0
                    ? profile.researchInterests
                    : ["Federated AI", "Edge Computing", "Smart Microgrids"]
                  ).map((res, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-background text-foreground font-mono border border-border">
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 
        ========================================================================
        APPLICATION / PROPOSAL SUBMISSION MODAL
        ========================================================================
      */}
      {applyingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {applyingOpportunity.category === "research"
                    ? "Submit Research Proposal"
                    : applyingOpportunity.category === "conference"
                    ? "Conference Paper Submission"
                    : applyingOpportunity.category === "workshop"
                    ? "Workshop Registration"
                    : applyingOpportunity.category === "fdp"
                    ? "FDP Application"
                    : "Apply for Industrial Training"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{applyingOpportunity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingOpportunity(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs space-y-1">
                <p className="text-muted-foreground">
                  Host: <span className="font-semibold text-foreground">{applyingOpportunity.organization}</span>
                </p>
                <p className="text-muted-foreground">
                  Stipend / Grant: <span className="font-bold text-primary font-mono">{applyingOpportunity.stipendOrPrize}</span>
                </p>
                <p className="text-muted-foreground">
                  Prerequisites: <span className="font-mono text-foreground">{applyingOpportunity.requiredSkills.join(", ")}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Research Outline & Institutional Endorsement Notes
                </label>
                <textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="Summarize your academic objectives, syllabus modernization intent, or project milestones…"
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {submissionFeedback && (
                <p className="text-xs font-medium text-primary text-center font-mono">
                  {submissionFeedback}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingOpportunity(null)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        CONTEXTUAL AI HELPBOT DRAWER
        ========================================================================
      */}
      {isAiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>AI HelpBOT & Immersion Advisor</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-normal">v2.0 Verified</span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">Faculty Sabbaticals & Research Telemetry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {aiChatHistory.length <= 1 && (
              <div className="p-3.5 bg-secondary/40 border border-border rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Academic Advisory Prompts</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Explore corporate sabbaticals, AICTE/MHRD CAS credit alignment, and research grants:
                </p>
                <div className="pt-1 flex flex-col gap-1.5">
                  {FACULTY_CONCERN_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendChipMessage(chip)}
                      disabled={isAiLoading}
                      className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-card hover:bg-secondary text-foreground border border-border transition-colors flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                    >
                      <span className="truncate pr-2">{chip}</span>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-mono shrink-0">Ask →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiChatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-6"
                    : "bg-background border border-border text-foreground mr-4 font-sans space-y-1"
                )}
              >
                {msg.role === "user" ? msg.content : formatAiMessage(msg.content)}
              </div>
            ))}
            {isAiLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-background border border-border rounded-lg mr-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Consulting research telemetry and corporate partnerships…</span>
              </div>
            )}
          </div>

          {aiChatHistory.length > 1 && (
            <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex gap-1.5 overflow-x-auto text-[10px]">
              {FACULTY_CONCERN_CHIPS.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChipMessage(chip)}
                  disabled={isAiLoading}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendAiMessage} className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about DRDO sabbaticals, research grants, FDPs…"
              className="flex-1 text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiQuery.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
