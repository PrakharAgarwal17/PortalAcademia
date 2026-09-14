import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Award,
  Sparkles,
  Loader2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Layers,
  Compass,
  GitCompare,
  RefreshCw,
  Filter,
  ChevronDown,
  Bot,
  Building,
  GraduationCap,
  Landmark,
  Scale,
  Zap,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface UserProfile {
  _id?: string;
  name: string;
  skills?: string[];
  expertise?: string[];
  accountType?: string;
  designation?: string;
  department?: string;
  institution?: string;
}

export interface ResearchQuarterPoint {
  quarter: string;
  grantIndex: number; // Growth momentum index (Base 100 = 2024)
  avgGrantLakhs: number; // in Lakhs INR (e.g. 52 = ₹52 Lakhs)
  activeProjects: number; // number of sponsored active university projects
}

export interface FacultyFieldProfile {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  colorHex: string;
  status: "surging" | "high-demand" | "steady" | "emerging";
  yoyGrowth: string;
  avgGrantDisplay: string;
  activeProjectsDisplay: string;
  teacherVerdict: string;
  whyThisMatters: string;
  primaryGrantors: string[];
  casImpact: string;
  recommendedActions: string[];
  portalUrl: string;
  portalLabel: string;
  coreTools: string[];
  quarterlyData: ResearchQuarterPoint[];
}

// 5 Core Academic Research & Teaching Fields for Faculty (2023–2026 Trajectory)
export const FACULTY_FIELDS: FacultyFieldProfile[] = [
  {
    id: "ai_data",
    title: "AI, Machine Learning & Computational Science",
    shortTitle: "AI & Data Science",
    badge: "Highest Grant Outlay",
    colorHex: "#3b82f6", // Blue
    status: "surging",
    yoyGrowth: "+84.2%",
    avgGrantDisplay: "₹45L – ₹95L / project",
    activeProjectsDisplay: "340+ Active Projects",
    teacherVerdict: "Unprecedented grant allocations across DST-SERB, IndiaAI Mission, and corporate research labs.",
    whyThisMatters:
      "Universities are receiving massive funding to set up High-Performance Computing (HPC) clusters and fine-tune domain-specific AI models. Professors publishing in this domain see fast-track grant approvals and strong industry co-sponsorship.",
    primaryGrantors: ["DST-SERB (CRG)", "IndiaAI Mission", "Microsoft Research", "Google Cloud Research"],
    casImpact: "25 API Pts per Q1 IEEE/ACM journal publication + 20 Pts per funded project (UGC Cat III).",
    recommendedActions: [
      "Submit a proposal under DST-SERB Core Research Grant (CRG)",
      "Introduce an advanced elective on Generative AI / LLMs (15 CAS Pts)",
      "Apply for Microsoft / Google academic cloud compute credits",
    ],
    portalUrl: "https://dst.gov.in/",
    portalLabel: "DST IndiaAI Portal",
    coreTools: ["PyTorch", "HPC Clusters", "CUDA / TensorRT", "Vector DBs", "Python"],
    quarterlyData: [
      { quarter: "2023 Q1", grantIndex: 55, avgGrantLakhs: 34, activeProjects: 140 },
      { quarter: "2023 Q3", grantIndex: 78, avgGrantLakhs: 42, activeProjects: 185 },
      { quarter: "2024 Q1", grantIndex: 110, avgGrantLakhs: 50, activeProjects: 230 },
      { quarter: "2024 Q3", grantIndex: 155, avgGrantLakhs: 62, activeProjects: 280 },
      { quarter: "2025 Q1", grantIndex: 205, avgGrantLakhs: 75, activeProjects: 310 },
      { quarter: "2025 Q3", grantIndex: 250, avgGrantLakhs: 85, activeProjects: 335 },
      { quarter: "2026 Q1", grantIndex: 295, avgGrantLakhs: 92, activeProjects: 345 },
    ],
  },
  {
    id: "vlsi_semiconductors",
    title: "Semiconductors, VLSI & Chip Design",
    shortTitle: "Semiconductors & VLSI",
    badge: "National Strategic Priority",
    colorHex: "#10b981", // Emerald
    status: "surging",
    yoyGrowth: "+68.4%",
    avgGrantDisplay: "₹50L – ₹1.2 Cr / project",
    activeProjectsDisplay: "160+ Active Projects",
    teacherVerdict: "Government fully subsidizing Cadence EDA tools and 5nm MPW chip tape-outs for academia.",
    whyThisMatters:
      "Under the India Semiconductor Mission (ISM) and MeitY's Chips to Startup (C2S) program, university faculty receive direct subsidies to fabricate physical silicon chips and train future chip design engineers.",
    primaryGrantors: ["MeitY (C2S Scheme)", "India Semiconductor Mission", "Intel Labs", "Qualcomm"],
    casImpact: "20 API Pts per sponsored project + 15 Pts for setting up industry-partnered VLSI lab.",
    recommendedActions: [
      "Access subsidized Cadence / Synopsys EDA tools via MeitY C2S",
      "Lead a Multi-Project Wafer (MPW) university tape-out proposal",
      "Partner with semiconductor firms for sponsored student fellowships",
    ],
    portalUrl: "https://www.meity.gov.in/esdm/c2s",
    portalLabel: "MeitY C2S Portal",
    coreTools: ["Cadence Virtuoso", "Synopsys EDA", "Verilog / SystemVerilog", "RISC-V ISA", "5nm FinFET"],
    quarterlyData: [
      { quarter: "2023 Q1", grantIndex: 42, avgGrantLakhs: 38, activeProjects: 65 },
      { quarter: "2023 Q3", grantIndex: 64, avgGrantLakhs: 46, activeProjects: 85 },
      { quarter: "2024 Q1", grantIndex: 95, avgGrantLakhs: 58, activeProjects: 110 },
      { quarter: "2024 Q3", grantIndex: 140, avgGrantLakhs: 72, activeProjects: 130 },
      { quarter: "2025 Q1", grantIndex: 185, avgGrantLakhs: 88, activeProjects: 148 },
      { quarter: "2025 Q3", grantIndex: 220, avgGrantLakhs: 102, activeProjects: 155 },
      { quarter: "2026 Q1", grantIndex: 255, avgGrantLakhs: 115, activeProjects: 162 },
    ],
  },
  {
    id: "quantum_defense",
    title: "Quantum Tech & Defense Systems",
    shortTitle: "Quantum & Defense",
    badge: "National Quantum Mission",
    colorHex: "#8b5cf6", // Purple
    status: "high-demand",
    yoyGrowth: "+54.6%",
    avgGrantDisplay: "₹60L – ₹1.5 Cr / project",
    activeProjectsDisplay: "185+ Active Projects",
    teacherVerdict: "High grant funding for quantum cryptography, low-latency control, and autonomous robotics.",
    whyThisMatters:
      "The ₹6,000 Cr National Quantum Mission (NQM) and DRDO CARS schemes are actively seeking academic Principal Investigators (PIs) for post-quantum security, drone swarms, and quantum sensing devices.",
    primaryGrantors: ["DST National Quantum Mission", "DRDO (CARS / ER&IPR)", "ISRO Space Tech Cell"],
    casImpact: "25 API Pts for national defense sponsored projects + patent filing API credits.",
    recommendedActions: [
      "Submit an exploratory proposal under National Quantum Mission (NQM)",
      "Apply for DRDO CARS extra-mural contract research",
      "Setup a Qiskit quantum computing student research laboratory",
    ],
    portalUrl: "https://nqm.dst.gov.in/",
    portalLabel: "National Quantum Mission",
    coreTools: ["Qiskit", "ROS 2 / Gazebo", "Lattice Cryptography", "Quantum Algorithms", "Embedded C"],
    quarterlyData: [
      { quarter: "2023 Q1", grantIndex: 48, avgGrantLakhs: 45, activeProjects: 90 },
      { quarter: "2023 Q3", grantIndex: 62, avgGrantLakhs: 54, activeProjects: 110 },
      { quarter: "2024 Q1", grantIndex: 82, avgGrantLakhs: 65, activeProjects: 135 },
      { quarter: "2024 Q3", grantIndex: 112, avgGrantLakhs: 78, activeProjects: 155 },
      { quarter: "2025 Q1", grantIndex: 148, avgGrantLakhs: 95, activeProjects: 170 },
      { quarter: "2025 Q3", grantIndex: 175, avgGrantLakhs: 110, activeProjects: 180 },
      { quarter: "2026 Q1", grantIndex: 195, avgGrantLakhs: 125, activeProjects: 188 },
    ],
  },
  {
    id: "clean_energy",
    title: "Clean Energy, EV Systems & Smart Grids",
    shortTitle: "Clean Energy & EV",
    badge: "Industry Co-Funded",
    colorHex: "#f59e0b", // Amber
    status: "steady",
    yoyGrowth: "+38.5%",
    avgGrantDisplay: "₹35L – ₹80L / project",
    activeProjectsDisplay: "220+ Active Projects",
    teacherVerdict: "Strong corporate co-sponsorship from Tata Power, automotive majors, and renewable bodies.",
    whyThisMatters:
      "Automotive OEMs and energy grids are partnering with university engineering faculties to develop solid-state battery management systems, microgrid inverters, and green hydrogen power electronics.",
    primaryGrantors: ["Ministry of New & Renewable Energy (MNRE)", "DST-SERB", "Tata Power", "Automotive OEMs"],
    casImpact: "15 API Pts for industry technology transfer + 10 Pts for industry consultancy.",
    recommendedActions: [
      "Partner with renewable energy firms for joint DST-SERB proposals",
      "Apply for 2-month summer faculty corporate sabbatical in clean tech",
      "Deliver an AICTE ATAL Faculty Development Program on EV systems",
    ],
    portalUrl: "https://mnre.gov.in/",
    portalLabel: "MNRE R&D Framework",
    coreTools: ["MATLAB / Simulink", "Battery Management (BMS)", "Solid-State Cells", "CAN Bus", "Power Electronics"],
    quarterlyData: [
      { quarter: "2023 Q1", grantIndex: 68, avgGrantLakhs: 32, activeProjects: 130 },
      { quarter: "2023 Q3", grantIndex: 82, avgGrantLakhs: 38, activeProjects: 155 },
      { quarter: "2024 Q1", grantIndex: 102, avgGrantLakhs: 46, activeProjects: 180 },
      { quarter: "2024 Q3", grantIndex: 125, avgGrantLakhs: 55, activeProjects: 195 },
      { quarter: "2025 Q1", grantIndex: 152, avgGrantLakhs: 64, activeProjects: 210 },
      { quarter: "2025 Q3", grantIndex: 172, avgGrantLakhs: 72, activeProjects: 218 },
      { quarter: "2026 Q1", grantIndex: 188, avgGrantLakhs: 78, activeProjects: 224 },
    ],
  },
  {
    id: "biomedical_ai",
    title: "Bio-Medical Engineering & Healthcare AI",
    shortTitle: "Healthcare AI & Bio",
    badge: "High Clinical Impact",
    colorHex: "#ec4899", // Pink
    status: "emerging",
    yoyGrowth: "+46.2%",
    avgGrantDisplay: "₹30L – ₹70L / project",
    activeProjectsDisplay: "140+ Active Projects",
    teacherVerdict: "Rapidly expanding interdisciplinary grant programs funded jointly by ICMR, BIRAC, and DST.",
    whyThisMatters:
      "Engineering professors collaborating with medical colleges on AI-assisted diagnostics, wearable telemetry, and medical imaging receive prioritized extra-mural funding and fast-track ethical approvals.",
    primaryGrantors: ["ICMR Health-AI", "BIRAC (Biotech Council)", "DST Bio-Engineering", "Philips Research"],
    casImpact: "25 API Pts for multidisciplinary patents + 20 Pts for sponsored clinical trials.",
    recommendedActions: [
      "Forge interdisciplinary research pact with a regional medical institute",
      "Apply for BIRAC Biotechnology Ignition Grant (BIG)",
      "Publish in PubMed / Scopus Q1 indexed biomedical journals",
    ],
    portalUrl: "https://main.icmr.nic.in/",
    portalLabel: "ICMR Health-AI Portal",
    coreTools: ["Medical Imaging (DICOM)", "PyTorch Vision", "Bio-Sensors", "NLP Clinical Records", "Edge Diagnostics"],
    quarterlyData: [
      { quarter: "2023 Q1", grantIndex: 45, avgGrantLakhs: 28, activeProjects: 75 },
      { quarter: "2023 Q3", grantIndex: 58, avgGrantLakhs: 34, activeProjects: 92 },
      { quarter: "2024 Q1", grantIndex: 76, avgGrantLakhs: 42, activeProjects: 108 },
      { quarter: "2024 Q3", grantIndex: 98, avgGrantLakhs: 50, activeProjects: 122 },
      { quarter: "2025 Q1", grantIndex: 124, avgGrantLakhs: 60, activeProjects: 132 },
      { quarter: "2025 Q3", grantIndex: 145, avgGrantLakhs: 66, activeProjects: 138 },
      { quarter: "2026 Q1", grantIndex: 165, avgGrantLakhs: 72, activeProjects: 142 },
    ],
  },
];

// Top National Statutory Grant Allocation Pools (₹ Crores)
const STATUTORY_GRANT_POOLS = [
  { agency: "MeitY (C2S & ISM)", allocationCr: 760, avgLakhs: 52, activeSchemes: 120, fill: "#10b981" },
  { agency: "DST-SERB (CRG)", allocationCr: 480, avgLakhs: 58, activeSchemes: 340, fill: "#3b82f6" },
  { agency: "DRDO (CARS/ER)", allocationCr: 320, avgLakhs: 65, activeSchemes: 185, fill: "#8b5cf6" },
  { agency: "Industry Labs", allocationCr: 280, avgLakhs: 75, activeSchemes: 95, fill: "#f59e0b" },
  { agency: "CSIR Extra-Mural", allocationCr: 210, avgLakhs: 40, activeSchemes: 260, fill: "#06b6d4" },
  { agency: "ICMR Health-AI", allocationCr: 190, avgLakhs: 44, activeSchemes: 140, fill: "#ec4899" },
];

// Corporate Sabbatical Residencies by Sector (% distribution)
const SABBATICAL_SECTORS = [
  { name: "Semiconductors (Intel, Qualcomm)", value: 35, color: "#10b981" },
  { name: "AI & Cloud (Microsoft, Google)", value: 28, color: "#3b82f6" },
  { name: "Clean Tech & EV (Tata, Mahindra)", value: 18, color: "#f59e0b" },
  { name: "Defense & Robotics (DRDO Labs)", value: 13, color: "#8b5cf6" },
  { name: "Bio-Informatics & MedTech", value: 6, color: "#ec4899" },
];

// Simple, Clear UGC 2018 / AICTE CAS Promotion API Points
const CAS_PROMOTION_POINTS = [
  {
    title: "Lead a Funded Research Project (> ₹10L)",
    category: "Category III: Research Projects",
    points: "+20 Points",
    rule: "UGC 2018 Table 2 (Sec 4)",
    hint: "Funded by DST, MeitY, DRDO, or Industry",
  },
  {
    title: "Publish in a Q1 / Scopus Indexed Journal",
    category: "Category III: Publications",
    points: "+25 Points",
    rule: "UGC-CARE List Table 2 (Sec 1)",
    hint: "High citation impact, peer-reviewed",
  },
  {
    title: "Complete a 2-Month Corporate Sabbatical",
    category: "Category II: Industrial Immersion",
    points: "+20 Points",
    rule: "AICTE 7th CPC Framework",
    hint: "Direct hands-on immersion in industry labs",
  },
  {
    title: "Design a New Elective / Modernize Syllabus",
    category: "Category I: Teaching & Pedagogy",
    points: "+15 Points",
    rule: "NEP 2020 Outcome-Based Framework",
    hint: "Outcome-based curriculum aligned with market",
  },
];

// Regional Research Clusters
const REGIONAL_CLUSTERS = [
  {
    city: "Bengaluru",
    title: "Semiconductor & Deep Tech Hub",
    ecosystem: "IISc, Intel Labs, DRDO, ISRO",
    activeGrants: "140+ Projects",
    stipend: "₹1.4L / mo",
  },
  {
    city: "Delhi-NCR",
    title: "Central Policy & Research Labs",
    ecosystem: "IIT Delhi, CSIR HQ, MeitY Labs",
    activeGrants: "115+ Projects",
    stipend: "₹1.2L / mo",
  },
  {
    city: "Hyderabad",
    title: "Defense & Healthcare-AI Corridor",
    ecosystem: "IIT Hyderabad, DRDO, Microsoft R&D",
    activeGrants: "90+ Projects",
    stipend: "₹1.25L / mo",
  },
  {
    city: "Pune-Mumbai",
    title: "Automotive & Clean Energy Hub",
    ecosystem: "IIT Bombay, Tata Motors, Clean Tech Labs",
    activeGrants: "80+ Projects",
    stipend: "₹1.15L / mo",
  },
  {
    city: "Chennai",
    title: "Robotics & Advanced Manufacturing",
    ecosystem: "IIT Madras Research Park, Defense Labs",
    activeGrants: "70+ Projects",
    stipend: "₹1.1L / mo",
  },
];

export default function FacultyTrendsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Field Filter & 1v1 Compare State
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>("all");
  const [fieldAId, setFieldAId] = useState<string>("ai_data");
  const [fieldBId, setFieldBId] = useState<string>("vlsi_semiconductors");
  const [trajectoryMetric, setTrajectoryMetric] = useState<"grants" | "index">("grants");

  // Minimalist View Toggles: "More to Know About"
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  /**
   * @description Fetch verified faculty profile
   * @returns {Promise<void>}
   * @throws {Error} Logged on network failure
   */
  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/profile/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((profData) => {
        if (profData?.success && profData?.profile) {
          if (profData.profile.accountType !== "faculty") {
            navigate("/trends");
            return;
          }
          setProfile(profData.profile);
        }
      })
      .catch((err) => console.error("Faculty profile load error:", err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  // Focused Field Profile if a specific field is selected
  const focusedField = useMemo(() => {
    if (selectedFieldFilter === "all" || selectedFieldFilter === "compare") return null;
    return FACULTY_FIELDS.find((f) => f.id === selectedFieldFilter) || null;
  }, [selectedFieldFilter]);

  // Selected Field Profiles for Head-to-Head Comparison
  const fieldA = useMemo(() => {
    return FACULTY_FIELDS.find((f) => f.id === fieldAId) || FACULTY_FIELDS[0];
  }, [fieldAId]);

  const fieldB = useMemo(() => {
    return FACULTY_FIELDS.find((f) => f.id === fieldBId) || FACULTY_FIELDS[1];
  }, [fieldBId]);

  // Time-series data combining ALL fields for multi-stream AreaChart
  const allFieldsTrajectoryData = useMemo(() => {
    const quarters = FACULTY_FIELDS[0].quarterlyData.map((q) => q.quarter);
    return quarters.map((quarter, qIdx) => {
      const row: Record<string, string | number> = { quarter };
      FACULTY_FIELDS.forEach((field) => {
        const pt = field.quarterlyData[qIdx];
        if (pt) {
          row[field.shortTitle] = trajectoryMetric === "grants" ? pt.avgGrantLakhs : pt.grantIndex;
        }
      });
      return row;
    });
  }, [trajectoryMetric]);

  // Time-series data for single focused field
  const singleFieldTrajectoryData = useMemo(() => {
    if (!focusedField) return [];
    return focusedField.quarterlyData.map((pt) => ({
      quarter: pt.quarter,
      [focusedField.shortTitle]: trajectoryMetric === "grants" ? pt.avgGrantLakhs : pt.grantIndex,
    }));
  }, [focusedField, trajectoryMetric]);

  // Merged time-series data for 1v1 AreaChart
  const mergedTrajectoryData = useMemo(() => {
    return fieldA.quarterlyData.map((pointA, index) => {
      const pointB = fieldB.quarterlyData[index] || { grantIndex: 0, avgGrantLakhs: 0 };
      return {
        quarter: pointA.quarter,
        [fieldA.shortTitle]: trajectoryMetric === "grants" ? pointA.avgGrantLakhs : pointA.grantIndex,
        [fieldB.shortTitle]: trajectoryMetric === "grants" ? pointB.avgGrantLakhs : pointB.grantIndex,
      };
    });
  }, [fieldA, fieldB, trajectoryMetric]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading faculty academic research & R&D intelligence…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar userName={profile?.name} profileId={profile?._id} userRole={profile?.accountType || "faculty"} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 lg:space-y-10">
        
        {/* ============================================================ */}
        {/* Navigation & Header with Clear Visual Controls */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard/faculty")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Faculty Dashboard</span>
              </button>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty Academic Observatory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Faculty Academic & R&D Market Trends
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
              Real-time insights on government R&D grant funding, high-growth research fields, corporate sabbaticals, and CAS career advancement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto pt-1 md:pt-0">
            {/* 1. Field Filter Dropdown */}
            <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs hover:border-primary/40 transition-colors">
              <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground font-mono text-[11px] uppercase">Domain:</span>
              <select
                value={selectedFieldFilter}
                onChange={(e) => setSelectedFieldFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">All Domains (Comparative)</option>
                {FACULTY_FIELDS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-card text-foreground">
                    {f.title}
                  </option>
                ))}
                <option value="compare" className="bg-card text-foreground">1v1 Compare</option>
              </select>
            </div>

            {/* 2. CAS Promotion Calculator Button */}
            <button
              type="button"
              onClick={() => {
                setExpandedSection("cas_matrix");
                const el = document.getElementById("more-to-know-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-all cursor-pointer shadow-2xs group"
            >
              <Award className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span>CAS Promotion Guide</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                UGC 2018
              </span>
            </button>

            {/* 3. Ask Academic AI Advisor */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/ai-guide?q=${encodeURIComponent(
                    "What research grants from DST-SERB, MeitY, and DRDO are best suited for computer science and engineering faculty in 2026?"
                  )}`
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Academic AI</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Top 4 Stat Cards: Clear, Intuitive High-Level Numbers */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Top Funded Domain
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  +84% YoY
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">AI & VLSI</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Highest government funding pool via MeitY C2S and IndiaAI Mission initiatives.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Avg Faculty Grant Pool
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  3 Years
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">₹52 Lakhs</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Average funding allocated per sponsored faculty Principal Investigator (PI).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  Corporate Sabbaticals
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  Paid Residencies
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">₹1.2L / mo</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Monthly fellowship stipend for 2-month summer faculty residencies at Intel, Tata, Microsoft.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
                  UGC CAS Promotion
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                  Up to 25 Pts
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">Fast-Track</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Each approved grant or Scopus publication directly advances your Associate / Professor promotion.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Core Visual Feature: Academic Research Trajectory Observatory */}
        {/* ============================================================ */}
        <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
          
          {/* Section Header with Live Feed Pill */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                  <Layers className="w-3 h-3" />
                  Academic Research Observatory
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  2023 Q1 – 2026 Q1 Trajectory
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-primary" />
                Research Domain Trajectory & Funding Momentum
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track how national funding, grant sizes, and research demand are evolving across key engineering disciplines.
              </p>
            </div>

            {/* Live Academic Telemetry Signal */}
            <div className="flex items-center gap-2 text-xs bg-secondary/60 border border-border/80 px-3 py-1.5 rounded-lg self-start lg:self-auto">
              <Landmark className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10.5px] font-bold text-foreground">
                    Live Statutory Outlay: ₹2,240 Cr Total Pool
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  AI: <strong className="text-blue-500">32%</strong> | VLSI: <strong className="text-emerald-500">28%</strong> | Quantum & Defense: <strong className="text-purple-500">22%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Discipline Pills & Metric Switch Controls */}
          <div className="flex flex-col gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Domain Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground font-mono uppercase text-[10px] mr-1">
                  Filter Domain:
                </span>

                {/* All Fields (Comparative) */}
                <button
                  type="button"
                  onClick={() => setSelectedFieldFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    selectedFieldFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Domains (Comparative)</span>
                </button>

                {/* Individual Domain Pills */}
                {FACULTY_FIELDS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFieldFilter(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      selectedFieldFilter === f.id
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.colorHex }} />
                    <span>{f.shortTitle}</span>
                  </button>
                ))}

                {/* 1v1 Compare Mode */}
                <button
                  type="button"
                  onClick={() => setSelectedFieldFilter("compare")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    selectedFieldFilter === "compare"
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>1v1 Compare</span>
                </button>
              </div>

              {/* Metric Mode Toggle (Simple and Visual) */}
              <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-md self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setTrajectoryMetric("grants")}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer",
                    trajectoryMetric === "grants"
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Avg Grant (₹ Lakhs)
                </button>
                <button
                  type="button"
                  onClick={() => setTrajectoryMetric("index")}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer",
                    trajectoryMetric === "index"
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Funding Growth Index
                </button>
              </div>
            </div>

            {/* Sub-row: 1v1 Selectors (Shown only when Compare mode is active) */}
            {selectedFieldFilter === "compare" && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 animate-in fade-in duration-200">
                <span className="text-xs font-semibold text-muted-foreground font-mono uppercase text-[10px]">
                  Comparing:
                </span>

                {/* Field A Selector */}
                <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-md">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fieldA.colorHex }} />
                  <select
                    value={fieldAId}
                    onChange={(e) => setFieldAId(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
                  >
                    {FACULTY_FIELDS.map((f) => (
                      <option key={f.id} value={f.id} disabled={f.id === fieldBId} className="bg-card text-foreground">
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-mono font-bold text-primary px-1">VS</span>

                {/* Field B Selector */}
                <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-md">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fieldB.colorHex }} />
                  <select
                    value={fieldBId}
                    onChange={(e) => setFieldBId(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
                  >
                    {FACULTY_FIELDS.map((f) => (
                      <option key={f.id} value={f.id} disabled={f.id === fieldAId} className="bg-card text-foreground">
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Swap Button */}
                <button
                  type="button"
                  onClick={() => {
                    const temp = fieldAId;
                    setFieldAId(fieldBId);
                    setFieldBId(temp);
                  }}
                  className="p-1.5 rounded-md hover:bg-secondary border border-border/70 text-muted-foreground hover:text-foreground cursor-pointer transition-colors text-xs"
                  title="Swap comparison fields"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* AreaChart Graphic */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-muted-foreground">
                {trajectoryMetric === "grants"
                  ? "💰 Average Approved Faculty Grant Amount (in ₹ Lakhs per project)"
                  : "📈 Research Funding Growth Momentum Index (Base 100 = 2024 Average)"}
                {selectedFieldFilter === "all" && " — Comparing All Research Domains"}
                {focusedField && ` — Focused on ${focusedField.title}`}
              </span>

              {/* Dynamic Legend */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                {selectedFieldFilter === "all" ? (
                  FACULTY_FIELDS.map((f) => (
                    <span key={f.id} className="flex items-center gap-1.5 font-bold" style={{ color: f.colorHex }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.colorHex }} />
                      {f.shortTitle}
                    </span>
                  ))
                ) : selectedFieldFilter === "compare" ? (
                  <>
                    <span className="flex items-center gap-1.5 font-bold" style={{ color: fieldA.colorHex }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fieldA.colorHex }} />
                      {fieldA.shortTitle} ({fieldA.yoyGrowth})
                    </span>
                    <span className="flex items-center gap-1.5 font-bold" style={{ color: fieldB.colorHex }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fieldB.colorHex }} />
                      {fieldB.shortTitle} ({fieldB.yoyGrowth})
                    </span>
                  </>
                ) : focusedField ? (
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: focusedField.colorHex }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: focusedField.colorHex }} />
                    {focusedField.title} ({focusedField.yoyGrowth})
                  </span>
                ) : null}
              </div>
            </div>

            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    selectedFieldFilter === "all"
                      ? allFieldsTrajectoryData
                      : selectedFieldFilter === "compare"
                      ? mergedTrajectoryData
                      : singleFieldTrajectoryData
                  }
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    {FACULTY_FIELDS.map((f) => (
                      <linearGradient key={f.id} id={`grad-${f.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={f.colorHex} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={f.colorHex} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    unit={trajectoryMetric === "grants" ? "L" : ""}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(val: unknown, name: unknown) => [
                      trajectoryMetric === "grants" ? `₹${val} Lakhs / project` : `${val} pts`,
                      String(name),
                    ]}
                  />
                  <Legend />

                  {selectedFieldFilter === "all" ? (
                    FACULTY_FIELDS.map((f) => (
                      <Area
                        key={f.id}
                        type="monotone"
                        dataKey={f.shortTitle}
                        stroke={f.colorHex}
                        strokeWidth={2.2}
                        fill={`url(#grad-${f.id})`}
                      />
                    ))
                  ) : selectedFieldFilter === "compare" ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey={fieldA.shortTitle}
                        stroke={fieldA.colorHex}
                        strokeWidth={2.5}
                        fill={`url(#grad-${fieldA.id})`}
                      />
                      <Area
                        type="monotone"
                        dataKey={fieldB.shortTitle}
                        stroke={fieldB.colorHex}
                        strokeWidth={2.5}
                        fill={`url(#grad-${fieldB.id})`}
                      />
                    </>
                  ) : focusedField ? (
                    <Area
                      type="monotone"
                      dataKey={focusedField.shortTitle}
                      stroke={focusedField.colorHex}
                      strokeWidth={3}
                      fill={`url(#grad-${focusedField.id})`}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dynamic Breakdown Views */}
          {selectedFieldFilter === "all" ? (
            /* CASE 1: ALL DOMAINS OVERVIEW GRID */
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  All Research Thrust Areas — At a Glance
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click any card to focus chart and view grant details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {FACULTY_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldFilter(field.id)}
                    className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: field.colorHex }} />
                          <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight">
                            {field.shortTitle}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase shrink-0",
                            field.status === "surging" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                            field.status === "high-demand" && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                            field.status === "steady" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                            field.status === "emerging" && "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
                          )}
                        >
                          {field.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 py-1.5 border-y border-border/50 text-[11px] font-mono">
                        <div>
                          <span className="text-[9.5px] text-muted-foreground block">YoY Growth</span>
                          <span className="font-bold text-foreground flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                            {field.yoyGrowth}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-muted-foreground block">Avg Grant</span>
                          <span className="font-bold text-foreground">{field.avgGrantDisplay.split(" ")[0]}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {field.teacherVerdict}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-border/40">
                      <div className="flex flex-wrap gap-1">
                        {field.coreTools.slice(0, 2).map((tool) => (
                          <span key={tool} className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-card border border-border text-foreground">
                            {tool}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10.5px] font-semibold text-primary flex items-center justify-between group-hover:underline">
                        <span>Inspect Field Dossier</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : focusedField ? (
            /* CASE 2: FOCUSED FIELD INTELLIGENCE DOSSIER */
            <div className="p-5 rounded-xl border border-border/80 bg-secondary/20 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: focusedField.colorHex }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{focusedField.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        {focusedField.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{focusedField.teacherVerdict}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedFieldFilter("all")}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-card border border-border text-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Compare All Domains</span>
                  </button>
                  <a
                    href={focusedField.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{focusedField.portalLabel}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* 4 Clean Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] text-muted-foreground block uppercase">YoY Funding Growth</span>
                  <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    {focusedField.yoyGrowth}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] text-muted-foreground block uppercase">Average Grant Size</span>
                  <span className="font-bold text-base text-primary">
                    {focusedField.avgGrantDisplay}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] text-muted-foreground block uppercase">Active Projects</span>
                  <span className="font-bold text-base text-foreground">
                    {focusedField.activeProjectsDisplay}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] text-muted-foreground block uppercase">UGC CAS Value</span>
                  <span className="font-bold text-base text-purple-600 dark:text-purple-400">
                    20 – 25 API Pts
                  </span>
                </div>
              </div>

              {/* Teacher-Friendly Narrative & Sponsoring Agencies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                  <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider block">
                    Why This Domain Matters to Teachers:
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {focusedField.whyThisMatters}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                  <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider block">
                    Recommended Action Steps for Faculty:
                  </span>
                  <ul className="space-y-1.5 text-xs text-foreground/90">
                    {focusedField.recommendedActions.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Core Tools & Grantors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Primary Sponsoring Grantors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {focusedField.primaryGrantors.map((grantor) => (
                      <span key={grantor} className="text-xs font-mono px-2 py-0.5 rounded bg-card border border-border text-foreground font-semibold">
                        {grantor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Core Lab Tools & Technologies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {focusedField.coreTools.map((tool) => (
                      <span key={tool} className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 3: 1v1 HEAD-TO-HEAD COMPARISON */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Field A Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: fieldA.colorHex }} />
                      <h3 className="font-bold text-sm text-foreground">{fieldA.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {fieldA.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">YoY Growth</span>
                      <span className="font-bold text-foreground flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {fieldA.yoyGrowth}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Avg Grant</span>
                      <span className="font-bold text-foreground">{fieldA.avgGrantDisplay.split(" ")[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Projects</span>
                      <span className="font-bold text-foreground">{fieldA.activeProjectsDisplay.split(" ")[0]}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {fieldA.whyThisMatters}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                      Core Tools:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {fieldA.coreTools.map((t) => (
                        <span key={t} className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-card border border-border text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <a
                  href={fieldA.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary group-hover:rotate-45 transition-transform" />
                    <span>Open {fieldA.portalLabel}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>

              {/* Field B Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: fieldB.colorHex }} />
                      <h3 className="font-bold text-sm text-foreground">{fieldB.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {fieldB.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">YoY Growth</span>
                      <span className="font-bold text-foreground flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {fieldB.yoyGrowth}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Avg Grant</span>
                      <span className="font-bold text-foreground">{fieldB.avgGrantDisplay.split(" ")[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Projects</span>
                      <span className="font-bold text-foreground">{fieldB.activeProjectsDisplay.split(" ")[0]}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {fieldB.whyThisMatters}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                      Core Tools:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {fieldB.coreTools.map((t) => (
                        <span key={t} className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-card border border-border text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <a
                  href={fieldB.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary group-hover:rotate-45 transition-transform" />
                    <span>Open {fieldB.portalLabel}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* Visual Charts: Grant Pools BarChart & Corporate Sabbaticals PieChart */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statutory Grants Pool BarChart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  Statutory Government & Industry Grant Pools (₹ Crores)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Total annual outlay available for university professors and Principal Investigators.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                Statutory Outlay
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STATUTORY_GRANT_POOLS} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="agency" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(val: unknown) => [`₹${val} Crores`, "Total Allocation Pool"]}
                  />
                  <Bar dataKey="allocationCr" radius={[4, 4, 0, 0]} name="Allocation Pool">
                    {STATUTORY_GRANT_POOLS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Corporate Sabbaticals Breakdown PieChart */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  Corporate Sabbaticals
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  Paid Residencies
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Industry sectors granting 2-month summer faculty fellowships.
              </p>
            </div>

            <div className="h-44 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SABBATICAL_SECTORS}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {SABBATICAL_SECTORS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [`${val}% Share`, "Industry Sector"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 text-[10.5px] border-t border-border/60 pt-2 font-mono">
              {SABBATICAL_SECTORS.map((sec) => (
                <div key={sec.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                    <span className="truncate">{sec.name}</span>
                  </span>
                  <span className="font-bold text-foreground">{sec.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Dedicated Gateway: CAS Career Advancement Scheme Calculator */}
        {/* ============================================================ */}
        <section className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Statutory UGC 2018 Standards
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-mono font-bold text-foreground">
                Career Advancement Scheme (CAS)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Ready to Compute Your CAS Promotion API Credits & Research Grant Match?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Evaluate your verified publications, research projects, and corporate immersion credits against UGC Regulations 2018 Table 2 benchmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard/faculty")}
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs group"
            >
              <Award className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Open Faculty Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/ai-guide?q=${encodeURIComponent(
                    "Explain the UGC Regulations 2018 Table 2 API score requirements for promotion from Assistant Professor to Associate Professor."
                  )}`
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-all cursor-pointer shadow-2xs group"
            >
              <Bot className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Ask HelpBot</span>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Minimalist Expandable: "More to Know About" (Accordion Style) */}
        {/* ============================================================ */}
        <section id="more-to-know-section" className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                More to Know About
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore deep-dive statutory CAS score rules, regional academic research hubs, and official grant guidelines on demand.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-bold uppercase border border-border self-start sm:self-auto">
              Minimalist Discovery
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: CAS Promotion Matrix */}
            <div
              onClick={() => setExpandedSection(expandedSection === "cas_matrix" ? null : "cas_matrix")}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group",
                expandedSection === "cas_matrix"
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-secondary/20 border-border hover:bg-secondary/40 hover:border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      UGC 2018 CAS Promotion Rules
                    </h4>
                    <p className="text-[10.5px] text-muted-foreground">API points table for Assistant/Associate Prof</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform shrink-0 mt-1",
                    expandedSection === "cas_matrix" && "rotate-180 text-primary"
                  )}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold text-primary">
                {expandedSection === "cas_matrix" ? "Tap to Collapse" : "Tap to View API Points"}
              </span>
            </div>

            {/* Card 2: Regional Research Clusters */}
            <div
              onClick={() => setExpandedSection(expandedSection === "regional" ? null : "regional")}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group",
                expandedSection === "regional"
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-secondary/20 border-border hover:bg-secondary/40 hover:border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      Regional Research Clusters
                    </h4>
                    <p className="text-[10.5px] text-muted-foreground">Bengaluru, NCR, Hyderabad, Pune, Chennai</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform shrink-0 mt-1",
                    expandedSection === "regional" && "rotate-180 text-primary"
                  )}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold text-primary">
                {expandedSection === "regional" ? "Tap to Collapse" : "Tap to View Regional Hubs"}
              </span>
            </div>

            {/* Card 3: Statutory Grant Reference Provenance */}
            <div
              onClick={() => setExpandedSection(expandedSection === "provenance" ? null : "provenance")}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group",
                expandedSection === "provenance"
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-secondary/20 border-border hover:bg-secondary/40 hover:border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      Verified Grant Sources & Gazettes
                    </h4>
                    <p className="text-[10.5px] text-muted-foreground">MeitY, DST-SERB, DRDO, UGC-CARE</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform shrink-0 mt-1",
                    expandedSection === "provenance" && "rotate-180 text-primary"
                  )}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold text-primary">
                {expandedSection === "provenance" ? "Tap to Collapse" : "Tap to View Provenance"}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Expanded Drawer 1: CAS Promotion Points */}
          {/* ============================================================ */}
          {expandedSection === "cas_matrix" && (
            <div className="p-5 rounded-xl border border-border/80 bg-secondary/10 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    UGC 2018 & AICTE 7th CPC Career Advancement Scheme (CAS) Matrix
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    How research grants, publications, and corporate sabbaticals convert directly into career promotion points.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  Statutory Rule Table 2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {CAS_PROMOTION_POINTS.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-card border border-border space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {item.points}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.hint}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span>{item.category}</span>
                      <span className="text-primary font-semibold">{item.rule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Expanded Drawer 2: Regional Research Clusters */}
          {/* ============================================================ */}
          {expandedSection === "regional" && (
            <div className="p-5 rounded-xl border border-border/80 bg-secondary/10 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Key Academic & Industrial Research Clusters in India
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Regional concentrations of research labs, corporate sabbaticals, and funded university projects.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  Active Ecosystems
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {REGIONAL_CLUSTERS.map((hub, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{hub.city}</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {hub.stipend}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-primary block">{hub.title}</span>
                    <p className="text-[10.5px] text-muted-foreground">{hub.ecosystem}</p>
                    <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      Active Grants: <strong className="text-foreground">{hub.activeGrants}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Expanded Drawer 3: Verified Data Provenance */}
          {/* ============================================================ */}
          {expandedSection === "provenance" && (
            <div className="p-5 rounded-xl border border-border/80 bg-secondary/10 space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Statutory R&D and Industry Benchmark References</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All metrics, funding allocations, and sabbatical figures are benchmarked against official Government of India gazettes and corporate partnership programs:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-[10.5px]">
                <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                  <strong className="text-foreground block font-bold">MeitY C2S Scheme</strong>
                  <span className="text-muted-foreground">Chips to Startup (C2S) & ISM MPW guidelines</span>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                  <strong className="text-foreground block font-bold">DST-SERB (CRG)</strong>
                  <span className="text-muted-foreground">Core Research Grants statutory framework</span>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                  <strong className="text-foreground block font-bold">AICTE 7th CPC</strong>
                  <span className="text-muted-foreground">Faculty sabbatical immersion guidelines</span>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                  <strong className="text-foreground block font-bold">UGC Regulations 2018</strong>
                  <span className="text-muted-foreground">Table 2 Career Advancement Scheme (CAS)</span>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
