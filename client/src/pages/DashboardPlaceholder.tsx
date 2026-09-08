import { useState, useEffect } from "react";
import {
  LogOut,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  BookOpenCheck,
  Building2,
  Briefcase,
  Sun,
  Moon,
  Search,
  TrendingUp,
  Bot,
  PieChart,
  Plus,
  Send,
  Award,
  Calendar,
  Clock,
  MapPin,
  X,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

// ============================================================
// Constants & Types
// ============================================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

type StakeholderRole = "student" | "faculty" | "institution" | "industry";

interface UserProfile {
  _id?: string;
  name: string;
  category?: "individual" | "organization";
  accountType: StakeholderRole;
  profileImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  institution?: string;
  institutionName?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  companyName?: string;
  industryType?: string;
  aisheCode?: string;
  skills?: string[];
  education?: Array<{ education: string; course?: string; timeline?: string }>;
  certifications?: Array<{ title: string; description?: string }>;
  pastExperience?: Array<{ title: string; timeline?: string }>;
}

interface ProfileApiResponse {
  success: boolean;
  profile: UserProfile;
}

interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  category: "internship" | "hackathon" | "workshop" | "fdp" | "research" | "sabbatical";
  domain: string;
  location: string;
  mode: "Remote" | "On-site" | "Hybrid";
  duration: string;
  stipendOrPrize: string;
  requiredSkills: string[];
  matchScore: number;
  deadline: string;
  recommendedByCollege?: boolean;
  status?: "Available" | "Applied" | "Under Review" | "Shortlisted";
}

interface ApplicantItem {
  id: string;
  name: string;
  roleApplied: string;
  institution: string;
  matchedSkills: string[];
  competencyScore: number;
  status: "Review Pending" | "Shortlisted" | "Technical Interview" | "Offered";
}

// Initial default opportunities dataset
const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-1",
    title: "AI & Distributed Systems Engineering Intern",
    organization: "Tata Consultancy Services // Corporate R&D",
    category: "internship",
    domain: "Machine Learning & Cloud",
    location: "Bengaluru, Karnataka",
    mode: "Hybrid",
    duration: "6 Months",
    stipendOrPrize: "₹45,000 / month",
    requiredSkills: ["React", "TypeScript", "Python", "Docker", "Node.js"],
    matchScore: 94,
    deadline: "Oct 15, 2026",
    recommendedByCollege: true,
    status: "Available",
  },
  {
    id: "opp-2",
    title: "Smart India Hackathon 2026 // Ayush Sprint",
    organization: "Ministry of Ayush & AICTE National Sandbox",
    category: "hackathon",
    domain: "Gov-Tech & Telemetry",
    location: "New Delhi (Grand Finale)",
    mode: "On-site",
    duration: "36-Hour Sprint",
    stipendOrPrize: "₹1,50,000 Prize Pool",
    requiredSkills: ["React", "Python", "API Design", "TypeScript"],
    matchScore: 88,
    deadline: "Nov 02, 2026",
    recommendedByCollege: true,
    status: "Available",
  },
  {
    id: "opp-3",
    title: "Industrial Sabbatical: Edge AI & Embedded Microkernels",
    organization: "DRDO Electronics & Radar R&D Wing",
    category: "sabbatical",
    domain: "Defense & Autonomous Systems",
    location: "Hyderabad, Telangana",
    mode: "On-site",
    duration: "3 Months",
    stipendOrPrize: "Honorarium & Grant Co-PI",
    requiredSkills: ["Embedded C", "Distributed Systems", "Signal Processing"],
    matchScore: 91,
    deadline: "Oct 28, 2026",
    recommendedByCollege: false,
    status: "Available",
  },
  {
    id: "opp-4",
    title: "FDP: Enterprise Cloud Architecture & Kubernetes",
    organization: "AWS Education Academy & IIT Bombay",
    category: "fdp",
    domain: "Cloud Computing & DevOps",
    location: "Online Masterclass",
    mode: "Remote",
    duration: "2 Weeks",
    stipendOrPrize: "Certified AICTE-NEAT Accreditation",
    requiredSkills: ["Cloud Systems", "Docker", "Kubernetes"],
    matchScore: 86,
    deadline: "Oct 10, 2026",
    recommendedByCollege: true,
    status: "Available",
  },
  {
    id: "opp-5",
    title: "Full-Stack WebAssembly & Micro-Frontends Workshop",
    organization: "Mozilla Developer Network & Infosys",
    category: "workshop",
    domain: "Web Standards & Compilers",
    location: "Virtual Classroom",
    mode: "Remote",
    duration: "3 Days Intensive",
    stipendOrPrize: "Verified Digital Badge",
    requiredSkills: ["TypeScript", "React", "Rust"],
    matchScore: 82,
    deadline: "Sep 30, 2026",
    recommendedByCollege: false,
    status: "Available",
  },
];

const INITIAL_APPLICANTS: ApplicantItem[] = [
  {
    id: "app-1",
    name: "Priya Sharma",
    roleApplied: "AI & Distributed Systems Engineering Intern",
    institution: "Indian Institute of Technology Bombay",
    matchedSkills: ["React", "TypeScript", "Python", "Docker"],
    competencyScore: 94,
    status: "Shortlisted",
  },
  {
    id: "app-2",
    name: "Rahul Kulkarni",
    roleApplied: "AI & Distributed Systems Engineering Intern",
    institution: "National Institute of Technology Surathkal",
    matchedSkills: ["Python", "Docker", "Node.js"],
    competencyScore: 86,
    status: "Review Pending",
  },
  {
    id: "app-3",
    name: "Ananya Deshmukh",
    roleApplied: "Full-Stack React Engineer",
    institution: "Birla Institute of Technology and Science, Pilani",
    matchedSkills: ["React", "TypeScript", "Node.js"],
    competencyScore: 91,
    status: "Technical Interview",
  },
];

export default function DashboardPlaceholder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  // Profile data from backend
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Active Stakeholder Workspace mode (can toggle to preview other pillars)
  const [activeRoleView, setActiveRoleView] = useState<StakeholderRole>("student");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<string>("all");

  // Dynamic Opportunities & Applicants State
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [applicants, setApplicants] = useState<ApplicantItem[]>(INITIAL_APPLICANTS);

  // Recommendation counter for Institution
  const [recommendedCount, setRecommendedCount] = useState<number>(42);

  // Modals & Slide-out Drawers
  const [isHelpBotOpen, setIsHelpBotOpen] = useState<boolean>(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isPostOpportunityOpen, setIsPostOpportunityOpen] = useState<boolean>(false);

  // HelpBot chat messages
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "Welcome to the PortalAcademia Assistant. I can help orient your academic profile, explain skill gap benchmarks, or locate verified internships.",
    },
  ]);

  // Skill Editor
  const [newSkillInput, setNewSkillInput] = useState<string>("");

  // Post Opportunity Form (Industry)
  const [newOppTitle, setNewOppTitle] = useState<string>("");
  const [newOppCategory, setNewOppCategory] = useState<"internship" | "hackathon" | "workshop">("internship");
  const [newOppDuration, setNewOppDuration] = useState<string>("6 Months");
  const [newOppStipend, setNewOppStipend] = useState<string>("₹35,000 / mo");
  const [newOppSkills, setNewOppSkills] = useState<string>("Python, Docker, SQL");

  // ============================================================
  // Network Call: Fetch Authenticated User Profile
  // ============================================================

  /**
   * @description Fetches the authenticated user's verified profile data from the database
   * @param {void} _ - No parameter required; session verified via httpOnly cookie
   * @returns {Promise<UserProfile | null>} The persisted user profile or null
   * @throws {Error} Network error or unauthorized status
   */
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.isOnboarded) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const response = await fetch(`${API_BASE}/api/profile/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = (await response.json()) as ProfileApiResponse;
          if (isMounted && data.profile) {
            setProfile(data.profile);
            if (data.profile.accountType) {
              setActiveRoleView(data.profile.accountType);
            }
          }
        }
      } catch {
        // Fallback silently if offline
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ============================================================
  // Network Call: Add New Skill to Profile
  // ============================================================

  /**
   * @description Updates user skills dynamically via backend PUT /api/profile
   * @param {string[]} updatedSkills - Array of skills
   * @returns {Promise<void>}
   * @throws {Error} Update failure
   */
  const handleAddSkillToProfile = async (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed || !profile) return;
    const currentSkills = profile.skills || [];
    if (currentSkills.includes(trimmed)) return;

    const newSkills = [...currentSkills, trimmed];

    // Optimistically update UI
    setProfile({ ...profile, skills: newSkills });
    setNewSkillInput("");

    try {
      await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: newSkills }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  const handleSignOut = async () => {
    await dispatch(signOutThunk());
    navigate("/auth", { replace: true });
  };

  const handleApplyToOpportunity = (id: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, status: "Applied" } : opp))
    );
  };

  const handleRecommendToStudents = (id: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, recommendedByCollege: true } : opp))
    );
    setRecommendedCount((prev) => prev + 1);
  };

  const handleUpdateApplicantStatus = (id: string, newStatus: ApplicantItem["status"]) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleSendHelpBotMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    // Realistic contextual bot response
    setTimeout(() => {
      let reply = "I have analyzed your request against the PortalAcademia telemetry registry.";
      const lower = userMsg.toLowerCase();
      if (lower.includes("internship") || lower.includes("job")) {
        reply = "Found 3 verified opportunities matching your skill vector with >85% alignment in the Opportunities feed.";
      } else if (lower.includes("skill") || lower.includes("gap")) {
        reply = "According to Q3 industry benchmarks, adding Docker & Kubernetes or Cloud Microservices will increase candidate discovery by +38%.";
      } else if (lower.includes("faculty") || lower.includes("sabbatical")) {
        reply = "Faculty sabbaticals at DRDO and corporate partners are accepting Q4 proposals under the Research Immersion desk.";
      } else if (lower.includes("aishe") || lower.includes("verify")) {
        reply = "Official domain validation requires an academic .edu or .ac.in inbox code verified by institutional cryptographic tokens.";
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 600);
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle.trim()) return;

    const newOpp: OpportunityItem = {
      id: `opp-${Date.now()}`,
      title: newOppTitle.trim(),
      organization: profile?.companyName || profile?.name || "Corporate Partner",
      category: newOppCategory,
      domain: profile?.industryType || "Technology",
      location: profile?.location || "Bengaluru",
      mode: "Hybrid",
      duration: newOppDuration,
      stipendOrPrize: newOppStipend,
      requiredSkills: newOppSkills.split(",").map((s) => s.trim()).filter(Boolean),
      matchScore: 92,
      deadline: "Nov 30, 2026",
      status: "Available",
    };

    setOpportunities([newOpp, ...opportunities]);
    setNewOppTitle("");
    setIsPostOpportunityOpen(false);
  };

  // Filtered opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategoryTab === "all" ||
      (activeCategoryTab === "internship" && opp.category === "internship") ||
      (activeCategoryTab === "hackathon" && opp.category === "hackathon") ||
      (activeCategoryTab === "workshop" && opp.category === "workshop") ||
      (activeCategoryTab === "fdp" && opp.category === "fdp") ||
      (activeCategoryTab === "sabbatical" && opp.category === "sabbatical");

    const matchesMode = selectedMode === "all" || opp.mode === selectedMode;

    return matchesSearch && matchesCategory && matchesMode;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors pb-16">
      {/* Console Top Navigation */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-white/95 dark:bg-zinc-900/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
            >
              <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground hidden sm:inline">
                PortalAcademia
              </span>
            </Link>
            <span className="text-border font-light">|</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground uppercase hidden md:inline">
              Console // Telemetry Workspace
            </span>
          </div>

          {/* Persona View Switcher */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md border border-border text-xs font-mono">
            {(["student", "faculty", "institution", "industry"] as StakeholderRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRoleView(role)}
                className={cn(
                  "px-2.5 py-1 rounded-sm capitalize transition-all cursor-pointer",
                  activeRoleView === role
                    ? "bg-white dark:bg-zinc-900 text-foreground font-semibold shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Quick Telemetry & Utility Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Market Trends Button */}
            <button
              type="button"
              onClick={() => setIsTrendsModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              title="Market Demand Trends"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Trends</span>
            </button>

            {/* Self Analysis Button */}
            <button
              type="button"
              onClick={() => setIsAnalysisModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              title="Skill Gap Quantification"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Analysis</span>
            </button>

            {/* AI HelpBOT Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsHelpBotOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer shadow-sm"
              title="AI HelpBot Assistant"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>HelpBOT</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Un-onboarded User Warning Banner */}
        {!user?.isOnboarded && !isLoadingProfile && (
          <div className="p-4 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Your stakeholder onboarding is incomplete. Profile parameters must be validated before full portal features unlock.
              </span>
            </div>
            <Link
              to="/onboarding/select-type"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-80 shrink-0"
            >
              Initialize Account Now &rarr;
            </Link>
          </div>
        )}

        {/* Dynamic Stakeholder Header Card */}
        <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Stakeholder Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : activeRoleView === "student" ? (
                  <GraduationCap className="w-7 h-7 text-foreground" />
                ) : activeRoleView === "faculty" ? (
                  <BookOpenCheck className="w-7 h-7 text-foreground" />
                ) : activeRoleView === "institution" ? (
                  <Building2 className="w-7 h-7 text-foreground" />
                ) : (
                  <Briefcase className="w-7 h-7 text-foreground" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                    {activeRoleView === "institution"
                      ? profile?.institutionName || "Higher Education Governance Console"
                      : activeRoleView === "industry"
                      ? profile?.companyName || "Industry & Talent Acquisition Console"
                      : profile?.name || user?.email || "Academic Stakeholder"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Domain
                  </span>
                </div>

                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Active Domain:{" "}
                  <span className="text-foreground uppercase font-bold">
                    {activeRoleView}
                  </span>{" "}
                  &bull;{" "}
                  {profile?.institution ||
                    profile?.location ||
                    "AISHE Node // Ministry of Education Federation"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/onboarding/select-type"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <span>Edit Profile</span>
              </Link>
              {activeRoleView === "industry" && (
                <button
                  type="button"
                  onClick={() => setIsPostOpportunityOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Opportunity</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            PILLAR 1: STUDENT VIEW
            ============================================================ */}
        {activeRoleView === "student" && (
          <div className="space-y-6">
            {/* Student Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Verified Skill Vector
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {profile?.skills?.length || 5} Skills
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  100% Tamper Evident
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Applications Tracked
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {opportunities.filter((o) => o.status === "Applied").length + 2} Active
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  1 Interview Scheduled
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Industry Match Index
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  92.4%
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Top 8th percentile
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Target Career Path
                </span>
                <span className="text-sm font-semibold text-foreground truncate block">
                  Full-Stack AI Engineer
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Dynamic ATS Ready
                </span>
              </div>
            </div>

            {/* Verified Skills Interactive Console */}
            <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                  Verified Competencies & Vector Tags
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Cosign Verified by Placement Cell
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(profile?.skills || ["React", "TypeScript", "Python", "Docker", "Node.js"]).map(
                  (skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-muted text-foreground border border-border text-xs font-mono font-medium"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {skill}
                    </span>
                  )
                )}

                {/* Quick Add Skill Input */}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkillToProfile(newSkillInput);
                      }
                    }}
                    placeholder="+ Add Skill"
                    className="h-7 px-2 text-xs font-mono rounded-sm border border-dashed border-input bg-background text-foreground focus-ring w-28"
                  />
                  {newSkillInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddSkillToProfile(newSkillInput)}
                      className="h-7 px-2 text-xs font-medium rounded-sm bg-foreground text-background"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            PILLAR 2: FACULTY VIEW
            ============================================================ */}
        {activeRoleView === "faculty" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Active FDP Registry
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  4 Programs
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  AICTE-NEAT Certified
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Industrial Sabbaticals
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  8 Available
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Corporate R&D Partners
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Research Collaborations
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  2 Ongoing
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Joint Patent Pipeline
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Classroom Case Studies
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  14 Live Feeds
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Syllabus Co-Developed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            PILLAR 3: INSTITUTION VIEW
            ============================================================ */}
        {activeRoleView === "institution" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Enrolled Students
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  8,212
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Cohort Telemetry Live
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Active Faculty Staff
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  342
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  88% FDP Accredited
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  College Endorsements
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {recommendedCount} Dispatched
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Direct to Student Desk
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Placement Conversion
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  86.8%
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Avg CTC ₹8.4 LPA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            PILLAR 4: INDUSTRY VIEW
            ============================================================ */}
        {activeRoleView === "industry" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Active Opportunities
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {opportunities.length}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Live in Candidate Feed
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Total Applicants
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {applicants.length * 14}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Algorithm Shortlisted
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Shortlisted Candidates
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {applicants.filter((a) => a.status === "Shortlisted").length}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Verified Skill Vectors
                </span>
              </div>

              <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-3.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Talent Discovery Pool
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  70,800+
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Across AISHE Colleges
                </span>
              </div>
            </div>

            {/* Candidate Shortlisting Desk Table */}
            <div className="rounded-md border border-border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                  Algorithmic Candidate Shortlisting Desk
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Cosine Similarity Weighted
                </span>
              </div>

              <div className="divide-y divide-border text-xs">
                {applicants.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{app.name}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          {app.competencyScore}% Match Score
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Applied for: <span className="font-medium text-foreground">{app.roleApplied}</span> &bull; {app.institution}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleUpdateApplicantStatus(app.id, e.target.value as ApplicantItem["status"])
                        }
                        className="h-8 px-2 rounded-sm border border-input bg-background text-xs font-mono"
                      >
                        <option value="Review Pending">Review Pending</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Technical Interview">Technical Interview</option>
                        <option value="Offered">Offered</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            OPPORTUNITY & ACTIVITY HUB (FOR ALL ROLES)
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Collaborative Opportunities & Activity Hub
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vetted industrial internships, hackathons, and certified faculty immersion programs.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by skill, title..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
              />
            </div>
          </div>

          {/* Categories Tab Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex flex-wrap gap-1 text-xs">
              {[
                { id: "all", label: "All Hub Activities" },
                { id: "internship", label: "Internships" },
                { id: "hackathon", label: "Hackathons" },
                { id: "workshop", label: "Workshops" },
                { id: "fdp", label: "Faculty FDPs" },
                { id: "sabbatical", label: "Sabbaticals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer",
                    activeCategoryTab === tab.id
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Mode:</span>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="h-7 px-2 rounded-sm border border-input bg-background text-xs font-mono text-foreground"
              >
                <option value="all">All Modes</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>

          {/* Opportunity Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-md border border-border bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono uppercase bg-muted text-muted-foreground border border-border mb-1">
                        {opp.category} &bull; {opp.mode}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opp.organization}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      {opp.matchScore}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground py-2 my-2 border-y border-border">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-foreground" />
                      <span>{opp.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3 h-3 text-foreground" />
                      <span>{opp.stipendOrPrize}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-foreground" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-foreground" />
                      <span>Due: {opp.deadline}</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {opp.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded-sm bg-muted text-foreground border border-border text-[10px] font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Desk */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  {opp.recommendedByCollege && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3 h-3" />
                      College Recommended
                    </span>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {activeRoleView === "institution" ? (
                      <button
                        type="button"
                        onClick={() => handleRecommendToStudents(opp.id)}
                        className="h-7 px-3 text-xs font-medium rounded-sm border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                      >
                        Recommend to Students
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyToOpportunity(opp.id)}
                        disabled={opp.status === "Applied"}
                        className={cn(
                          "h-7 px-3 text-xs font-medium rounded-sm transition-colors cursor-pointer shadow-sm",
                          opp.status === "Applied"
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        )}
                      >
                        {opp.status === "Applied" ? "Applied ✓" : "Apply to Desk"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ============================================================
          SLIDE-OVER DRAWER: AI HELPBOT ASSISTANT
          ============================================================ */}
      {isHelpBotOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none">
          <div className="w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-border flex flex-col shadow-xl">
            {/* HelpBot Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-foreground text-background flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    PortalAcademia AI HelpBOT
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Autonomous Career & Telemetry Orientation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpBotOpen(false)}
                className="w-7 h-7 rounded-sm border border-border flex items-center justify-center hover:bg-muted text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-md max-w-[85%] leading-relaxed",
                    msg.sender === "user"
                      ? "ml-auto bg-foreground text-background"
                      : "mr-auto bg-muted text-foreground border border-border"
                  )}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Prompt Input */}
            <div className="p-3 border-t border-border bg-background">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendHelpBotMessage();
                    }
                  }}
                  placeholder="Ask about internships, FDPs, skill gap roadmaps..."
                  className="flex-1 h-9 px-3 text-xs rounded-md border border-input bg-card text-foreground focus-ring"
                />
                <button
                  type="button"
                  onClick={handleSendHelpBotMessage}
                  className="h-9 px-3 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: MARKET DEMAND TRENDS
          ============================================================ */}
      {isTrendsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Live Industry Market Demand Telemetry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTrendsModalOpen(false)}
                className="w-6 h-6 rounded-sm border border-border flex items-center justify-center hover:bg-muted text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time hiring telemetry aggregated from verified partner postings, internship applications, and curriculum demand curves across 70,800+ institutions.
            </p>

            <div className="divide-y divide-border border border-border rounded-md text-xs font-mono">
              {[
                { domain: "Generative AI & LLM Systems", growth: "+42% demand", index: 94 },
                { domain: "Distributed Cloud Architecture (Docker/K8s)", growth: "+36% demand", index: 88 },
                { domain: "Cyber-Physical & Embedded Microkernels", growth: "+28% demand", index: 76 },
                { domain: "Full-Stack TypeScript & React Ecosystem", growth: "+24% demand", index: 82 },
              ].map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground font-sans block">
                      {item.domain}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {item.growth}
                    </span>
                  </div>
                  <span className="font-bold text-foreground tabular-nums">
                    Score: {item.index}/100
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsTrendsModalOpen(false)}
                className="h-8 px-4 text-xs font-medium rounded-md bg-foreground text-background"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: SELF ANALYSIS & SKILL GAP QUANTIFICATION
          ============================================================ */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Skill Gap Quantification Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(false)}
                className="w-6 h-6 rounded-sm border border-border flex items-center justify-center hover:bg-muted text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-md bg-muted/40 border border-border text-xs leading-relaxed">
              <span className="font-semibold text-foreground block mb-1">
                Candidate Competency Vector Evaluation:
              </span>
              Your profile is verified for{" "}
              <span className="font-mono font-bold text-foreground">
                {(profile?.skills || ["React", "TypeScript", "Python"]).join(", ")}
              </span>
              . Matching against top quartile enterprise requirements:
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>Frontend & Client Architecture:</span>
                <span className="text-emerald-600 font-bold">96% (Strong)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Backend Distributed Services:</span>
                <span className="text-emerald-600 font-bold">88% (Proficient)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cloud Orchestration & CI/CD:</span>
                <span className="text-amber-600 font-bold">64% (Gap Identified)</span>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block font-mono mb-1.5">
                Recommended Remediation Roadmap:
              </span>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Enroll in Cloud Native Foundation Workshop (2-week sprint)</li>
                <li>Implement Kubernetes container ingress for live portfolio project</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(false)}
                className="h-8 px-4 text-xs font-medium rounded-md bg-foreground text-background"
              >
                Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: PUBLISH OPPORTUNITY (INDUSTRY ROLE)
          ============================================================ */}
      {isPostOpportunityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
          <form
            onSubmit={handleCreateOpportunity}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Publish New Opportunity to Candidate Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPostOpportunityOpen(false)}
                className="w-6 h-6 rounded-sm border border-border flex items-center justify-center hover:bg-muted text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Opportunity Title
              </label>
              <input
                type="text"
                required
                value={newOppTitle}
                onChange={(e) => setNewOppTitle(e.target.value)}
                placeholder="e.g. Machine Learning Research Fellow"
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Classification
                </label>
                <select
                  value={newOppCategory}
                  onChange={(e) =>
                    setNewOppCategory(e.target.value as "internship" | "hackathon" | "workshop")
                  }
                  className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
                >
                  <option value="internship">Industry Internship</option>
                  <option value="hackathon">Hackathon Challenge</option>
                  <option value="workshop">Certified Workshop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={newOppDuration}
                  onChange={(e) => setNewOppDuration(e.target.value)}
                  placeholder="e.g. 6 Months"
                  className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Stipend / Award
                </label>
                <input
                  type="text"
                  value={newOppStipend}
                  onChange={(e) => setNewOppStipend(e.target.value)}
                  placeholder="e.g. ₹40,000 / month"
                  className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Prerequisite Skills
                </label>
                <input
                  type="text"
                  value={newOppSkills}
                  onChange={(e) => setNewOppSkills(e.target.value)}
                  placeholder="Comma separated (e.g. React, Python)"
                  className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsPostOpportunityOpen(false)}
                className="h-8 px-3 text-xs font-medium rounded-md border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90"
              >
                Publish to Network
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
