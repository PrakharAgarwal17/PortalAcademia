import { useState, useEffect, useCallback, useRef } from "react";
import {
  Briefcase,
  X,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Plus,
  Users,
  Search,
  Filter,
  Bot,
  Send,
  Edit3,
  Trash2,
  ChevronDown,
  Sparkles,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";
import SkillInput from "@/components/SkillInput";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface IndustryProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
  companyName?: string;
  industryType?: string;
  workEmail?: string;
  officialWebsite?: string;
  location?: string;
  employees?: string;
  accountType: string;
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
  status: string;
  applicantCount: number;
  createdAt: string;
  targetAudience?: string;
}

interface CandidateApplication {
  _id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantInstitution: string;
  applicantSkills: string[];
  matchScore: number;
  status: string;
  appliedAt: string;
  notes?: string;
  reviewerNotes?: string;
}

interface AiChatMessage {
  sender: "user" | "bot";
  text: string;
}

export default function IndustryDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [publishedListings, setPublishedListings] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [applicants, setApplicants] = useState<CandidateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  // Navigation state: "dashboard" | "opportunities" | "review"
  const [activeNavTab, setActiveNavTab] = useState<"dashboard" | "opportunities" | "review">("dashboard");

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll Display Count
  const [visibleCount, setVisibleCount] = useState(6);
  const observerRef = useRef<HTMLDivElement>(null);

  // AI HelpBOT Drawer state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I am your AI Recruitment & Skill Matching Assistant. How can I help you optimize your published opportunities, source candidate pipelines, or format job descriptions today?",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Opportunity Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    category: "internship",
    domain: "Software Engineering & Cloud Systems",
    location: "Bengaluru, KA",
    mode: "Hybrid",
    duration: "6 Months",
    stipendOrPrize: "₹45,000 / mo",
    requiredSkills: "React, Node.js, TypeScript",
    eligibility: "Pre-final and final year B.Tech / M.Tech students.",
    deadline: "2026-11-30",
    targetAudience: "both",
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Manage/Edit Opportunity Modal State
  const [managingOpportunity, setManagingOpportunity] = useState<Opportunity | null>(null);
  const [manageForm, setManageForm] = useState({
    title: "",
    description: "",
    category: "internship",
    mode: "Hybrid",
    location: "",
    stipendOrPrize: "",
    duration: "",
    requiredSkills: "",
    status: "Active",
  });
  const [isSavingManage, setIsSavingManage] = useState(false);
  const [manageFeedback, setManageFeedback] = useState<string | null>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * @description Fetch industry recruiter profile
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
      console.error("Failed to fetch recruiter profile:", err);
    }
  }, []);

  /**
   * @description Fetch listings published by this recruiter
   */
  const fetchPublishedListings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/my-published`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const listings: Opportunity[] = data.data || [];
        setPublishedListings(listings);
        if (listings.length > 0 && !selectedOpportunity) {
          setSelectedOpportunity(listings[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch published listings:", err);
    }
  }, [selectedOpportunity]);

  /**
   * @description Fetch applicants for currently selected opportunity
   */
  const fetchApplicants = useCallback(async (oppId: string) => {
    setIsLoadingApplicants(true);
    try {
      const res = await fetch(`${API_BASE}/api/applications/opportunity/${oppId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
    } finally {
      setIsLoadingApplicants(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchPublishedListings()]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchPublishedListings]);

  useEffect(() => {
    if (selectedOpportunity) {
      fetchApplicants(selectedOpportunity._id);
    }
  }, [selectedOpportunity, fetchApplicants]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 4);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [publishedListings]);

  /**
   * @description Publish a new opportunity
   */
  const handlePublishOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setPublishFeedback(null);

    const skillsArray = publishForm.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...publishForm,
          requiredSkills: skillsArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishFeedback("Opportunity successfully published!");
        await fetchPublishedListings();
        setTimeout(() => {
          setIsPublishModalOpen(false);
          setPublishFeedback(null);
          setPublishForm({
            title: "",
            description: "",
            category: "internship",
            domain: "Software Engineering & Cloud Systems",
            location: "Bengaluru, KA",
            mode: "Hybrid",
            duration: "6 Months",
            stipendOrPrize: "₹45,000 / mo",
            requiredSkills: "React, Node.js, TypeScript",
            eligibility: "Pre-final and final year B.Tech / M.Tech students.",
            deadline: "2026-11-30",
            targetAudience: "both",
          });
        }, 1000);
      } else {
        setPublishFeedback(data.message || "Failed to publish listing.");
      }
    } catch (err: any) {
      setPublishFeedback(err.message || "Network error occurred.");
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * @description Open Manage/Edit modal for opportunity
   */
  const openManageModal = (opp: Opportunity) => {
    setManagingOpportunity(opp);
    setManageForm({
      title: opp.title,
      description: opp.description || "",
      category: opp.category || "internship",
      mode: opp.mode || "Hybrid",
      location: opp.location || "",
      stipendOrPrize: opp.stipendOrPrize || "",
      duration: opp.duration || "",
      requiredSkills: opp.requiredSkills ? opp.requiredSkills.join(", ") : "",
      status: opp.status || "Active",
    });
    setManageFeedback(null);
  };

  /**
   * @description Save edits to opportunity via PUT /api/opportunities/:id
   */
  const handleSaveManage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingOpportunity) return;
    setIsSavingManage(true);
    setManageFeedback(null);

    const skillsArray = manageForm.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${managingOpportunity._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...manageForm,
          requiredSkills: skillsArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setManageFeedback("Opportunity updated successfully!");
        await fetchPublishedListings();
        setTimeout(() => {
          setManagingOpportunity(null);
          setManageFeedback(null);
        }, 1000);
      } else {
        setManageFeedback(data.message || "Failed to update opportunity.");
      }
    } catch (err: any) {
      setManageFeedback(err.message || "Network error occurred.");
    } finally {
      setIsSavingManage(false);
    }
  };

  /**
   * @description Delete/Close opportunity
   */
  const handleDeleteOpportunity = async (oppId: string) => {
    if (!window.confirm("Are you sure you want to remove this opportunity?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${oppId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchPublishedListings();
        setManagingOpportunity(null);
      }
    } catch (err) {
      console.error("Failed to delete opportunity:", err);
    }
  };

  /**
   * @description Transition candidate stage progression in pipeline
   */
  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplicants((prev) =>
          prev.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  /**
   * @description Submit query to AI HelpBOT
   */
  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = aiQuery.trim();
    if (!query || isAiLoading) return;

    setAiChatHistory((prev) => [...prev, { sender: "user", text: query }]);
    setAiQuery("");
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: query }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || "I am currently processing corporate metrics. How else can I assist your talent sourcing?";
      setAiChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Here are recommendations based on industry trends: Focus on verified skill badges in React, Python, and Cloud Architecture for high candidate match scores.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter listings based on search & filter state
  const filteredListings = publishedListings.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.requiredSkills && opp.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      categoryFilter === "all" || opp.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesMode =
      modeFilter === "all" || opp.mode.toLowerCase() === modeFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesMode;
  });

  const visibleListings = filteredListings.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading corporate talent pipeline & recruiter dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 1. Header Layout (Avatar Circle + Search Bar on Left | Nav Links on Right) */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-6 lg:px-10 py-3.5 flex items-center justify-between gap-6">
        {/* Left Side: Avatar Circle & Search Input Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {/* Profile Circle Avatar */}
          <div
            onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
            className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground cursor-pointer hover:border-primary transition-colors overflow-hidden shrink-0 shadow-sm"
            title="View Corporate Profile"
          >
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-primary" />
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities by title, category, or skills..."
              className="w-full text-xs pl-10 pr-9 py-2 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Navigation Links & Controls */}
        <div className="flex items-center gap-2 md:gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveNavTab("dashboard")}
            className={cn(
              "px-3.5 py-2 rounded-lg font-semibold transition-all",
              activeNavTab === "dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab("opportunities")}
            className={cn(
              "px-3.5 py-2 rounded-lg font-semibold transition-all",
              activeNavTab === "opportunities"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Opportunities
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab("review")}
            className={cn(
              "px-3.5 py-2 rounded-lg font-semibold transition-all relative",
              activeNavTab === "review"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Review
            {applicants.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono font-bold">
                {applicants.length}
              </span>
            )}
          </button>

          {/* AI HelpBOT Button */}
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4" />
            <span>AI HelpBOT</span>
          </button>

          <div className="h-5 w-px bg-border my-auto mx-1" />

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* LogOut Button */}
          <button
            type="button"
            onClick={() => dispatch(signOutThunk()).then(() => navigate("/auth"))}
            className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary border border-border font-medium"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">LogOut</span>
          </button>
        </div>
      </header>

      {/* Main Container with extra spacing & width */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-8">
        {/* 2. Top Action Controls Row: [+] Publish Opportunity + ( Filter ) Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            {/* [+] Button (Publish Opportunity) */}
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Opportunity</span>
            </button>

            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              Post internships, hackathons, workshops, or FDPs for corporate recruitment
            </span>
          </div>

          {/* ( Filter ) Dropdown Button */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-secondary transition-all shadow-sm",
                (categoryFilter !== "all" || modeFilter !== "all") && "border-primary text-primary font-bold"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-xl shadow-xl p-4 z-20 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Filter Opportunities</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("all");
                      setModeFilter("all");
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Reset All
                  </button>
                </div>

                {/* Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="internship">Internships</option>
                    <option value="hackathon">Hackathons</option>
                    <option value="workshop">Workshops</option>
                    <option value="fdp">FDPs</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                {/* Mode Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block">Work Mode</label>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="all">All Modes</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Combined 3-Section Metrics Card (Spacious 3-Section Box) */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Section 1: Active Opportunities */}
            <div className="p-6 lg:p-7 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Active Opportunities</span>
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-3xl lg:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                  {publishedListings.filter((o) => o.status !== "Closed").length}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {publishedListings.length} Total Listings
                </span>
              </div>
            </div>

            {/* Section 2: Total Applicants */}
            <div className="p-6 lg:p-7 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Applicants</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-3xl lg:text-4xl font-extrabold text-primary tabular-nums tracking-tight">
                  {publishedListings.reduce((sum, o) => sum + (o.applicantCount || 0), 0)}
                </span>
                <span className="text-xs font-mono text-muted-foreground">Across all postings</span>
              </div>
            </div>

            {/* Section 3: Shortlisted Candidates */}
            <div className="p-6 lg:p-7 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Shortlisted Candidates</span>
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-3xl lg:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                  {applicants.filter((a) => a.status === "Shortlisted").length}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Qualified Vector Match
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Tab Views: Opportunities Feed vs Candidate Review Pipeline */}
        {activeNavTab !== "review" ? (
          /* Main Opportunities Feed Grid (Spacious 2-column cards) */
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Published Opportunity Feed
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                Showing {visibleListings.length} of {filteredListings.length} listings
              </span>
            </div>

            {filteredListings.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center space-y-4">
                <p className="text-sm font-medium text-muted-foreground">No published opportunities found matching your filters.</p>
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Publish Your First Opportunity
                </button>
              </div>
            ) : (
              /* Spacious 2 opportunity cards per row */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {visibleListings.map((opp) => (
                  <div
                    key={opp._id}
                    className="bg-card border border-border/90 rounded-xl p-6 lg:p-7 flex flex-col justify-between space-y-6 hover:border-primary/60 transition-all shadow-sm hover:shadow-md group min-h-[300px]"
                  >
                    <div className="space-y-4">
                      {/* Top Category & Status Badges */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {opp.category}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-mono font-bold px-3 py-1 rounded-md border",
                            opp.status === "Closed"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {opp.status || "Active"}
                        </span>
                      </div>

                      {/* Header Title & Organization */}
                      <div>
                        <h3 className="text-base lg:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {opp.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          {opp.organization || profile?.companyName || "Corporate Recruiter"} • {opp.location || "Remote"}
                        </p>
                      </div>

                      {/* Details Box */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-mono bg-secondary/40 p-3.5 rounded-lg border border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Stipend / Prize</span>
                          <span className="font-bold text-foreground">{opp.stipendOrPrize || "Unspecified"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Mode</span>
                          <span className="font-bold text-foreground">{opp.mode}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Duration</span>
                          <span className="font-bold text-foreground">{opp.duration || "N/A"}</span>
                        </div>
                      </div>

                      {/* Required Skills Badges */}
                      {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {opp.requiredSkills.map((sk, idx) => (
                            <SkillBadge key={idx} skill={sk} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        <strong className="text-foreground text-sm">{opp.applicantCount || 0}</strong> Applicants
                      </span>

                      {/* Bottom Action Buttons: [Manage] & [View Applicants] */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => openManageModal(opp)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-foreground shadow-sm"
                          title="Manage & Edit Opportunity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOpportunity(opp);
                            setActiveNavTab("review");
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <span>View Applicants</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={observerRef} className="py-6 text-center">
              {visibleCount < filteredListings.length ? (
                <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading more opportunities...
                </div>
              ) : (
                <p className="text-xs font-mono text-muted-foreground">End of published listings</p>
              )}
            </div>
          </section>
        ) : (
          /* Review Candidate Pipeline View */
          <section className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Candidate Review Pipeline
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Evaluate and shortlist applicants based on verified skill benchmarks & vector match scores.
                </p>
              </div>

              {/* Opportunity Selector Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">Posting:</span>
                <select
                  value={selectedOpportunity?._id || ""}
                  onChange={(e) => {
                    const opp = publishedListings.find((o) => o._id === e.target.value);
                    if (opp) setSelectedOpportunity(opp);
                  }}
                  className="text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary max-w-xs shadow-sm"
                >
                  {publishedListings.map((opp) => (
                    <option key={opp._id} value={opp._id}>
                      {opp.title} ({opp.applicantCount} applicants)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingApplicants ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-mono text-muted-foreground">Computing candidate vector match scores…</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border rounded-xl space-y-3">
                <p className="text-sm font-semibold text-foreground">No applications received yet</p>
                <p className="text-xs text-muted-foreground">
                  Applications submitted for "{selectedOpportunity?.title}" will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-background shadow-sm">
                {applicants.map((cand) => (
                  <div key={cand._id} className="p-5 space-y-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-bold text-foreground">{cand.applicantName}</h4>
                          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            {cand.matchScore}% Match Score
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cand.applicantInstitution} • {cand.applicantEmail}
                        </p>
                      </div>

                      {/* Candidate Status Selector */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground font-medium">Pipeline Stage:</span>
                        <select
                          value={cand.status}
                          onChange={(e) => handleUpdateStatus(cand._id, e.target.value)}
                          className="text-xs px-3 py-2 rounded-lg bg-card border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary font-mono shadow-sm"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Technical Interview">Technical Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Candidate Skills */}
                    {cand.applicantSkills && cand.applicantSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-muted-foreground mr-1 font-medium">Skills:</span>
                        {cand.applicantSkills.map((sk, idx) => (
                          <SkillBadge key={idx} skill={sk} size="xs" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* 5. AI HelpBOT Drawer (Slide-out Panel) */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">AI Recruitment HelpBOT</h3>
                  <p className="text-[10px] text-muted-foreground">Antigravity AI Talent Sourcing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {aiChatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] text-xs rounded-xl p-3.5 space-y-1 shadow-sm",
                    msg.sender === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-secondary text-secondary-foreground border border-border"
                  )}
                >
                  <span className="text-[9px] opacity-75 font-mono font-bold">
                    {msg.sender === "user" ? "You" : "AI HelpBOT"}
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isAiLoading && (
                <div className="mr-auto bg-secondary border border-border text-secondary-foreground rounded-xl p-3.5 flex items-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Analyzing talent metrics...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAiSubmit} className="p-4 border-t border-border bg-card flex items-center gap-2.5">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask AI about candidate matching..."
                className="flex-1 text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiQuery.trim()}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Publish Opportunity Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Publish Marketplace Opportunity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Post internships, hackathons, workshops, or apprenticeships</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishOpportunity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Position Title</label>
                <input
                  type="text"
                  required
                  value={publishForm.title}
                  onChange={(e) => setPublishForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Cloud & Distributed Systems Engineering Intern"
                  className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
                  <select
                    value={publishForm.category}
                    onChange={(e) => setPublishForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="fdp">FDP</option>
                    <option value="research">Joint Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Target Audience</label>
                  <select
                    value={publishForm.targetAudience}
                    onChange={(e) => setPublishForm((p) => ({ ...p, targetAudience: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none font-semibold text-primary"
                  >
                    <option value="both">Both (Students &amp; Faculty)</option>
                    <option value="student">For Students Only</option>
                    <option value="faculty">For Faculty Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Work Mode</label>
                  <select
                    value={publishForm.mode}
                    onChange={(e) => setPublishForm((p) => ({ ...p, mode: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Stipend / Prize Pool</label>
                  <input
                    type="text"
                    required
                    value={publishForm.stipendOrPrize}
                    onChange={(e) => setPublishForm((p) => ({ ...p, stipendOrPrize: e.target.value }))}
                    placeholder="e.g. ₹50,000 / mo"
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Duration</label>
                  <input
                    type="text"
                    required
                    value={publishForm.duration}
                    onChange={(e) => setPublishForm((p) => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 6 Months"
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <SkillInput
                label="Required Skill Vectors"
                skills={
                  publishForm.requiredSkills
                    ? publishForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : []
                }
                onAddSkill={(skill) => {
                  const current = publishForm.requiredSkills
                    ? publishForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  if (!current.includes(skill)) {
                    setPublishForm((p) => ({ ...p, requiredSkills: [...current, skill].join(", ") }));
                  }
                }}
                onRemoveSkill={(skill) => {
                  const current = publishForm.requiredSkills
                    ? publishForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  setPublishForm((p) => ({
                    ...p,
                    requiredSkills: current.filter((s) => s !== skill).join(", "),
                  }));
                }}
                placeholder="Type/Search skill (e.g. React, Python, Docker) & select from dropdown…"
              />

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Description & Scope</label>
                <textarea
                  required
                  rows={3}
                  value={publishForm.description}
                  onChange={(e) => setPublishForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe candidate responsibilities, project objectives, and mentorship details…"
                  className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                />
              </div>

              {publishFeedback && (
                <p className="text-xs font-mono text-primary text-center font-semibold">{publishFeedback}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={isPublishing}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="text-xs font-semibold px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                >
                  {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Manage / Edit Opportunity Modal */}
      {managingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Manage Published Opportunity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Update listing details, status, or remove</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingOpportunity(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={manageForm.title}
                  onChange={(e) => setManageForm((m) => ({ ...m, title: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
                  <select
                    value={manageForm.category}
                    onChange={(e) => setManageForm((m) => ({ ...m, category: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="fdp">FDP</option>
                    <option value="research">Joint Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Status</label>
                  <select
                    value={manageForm.status}
                    onChange={(e) => setManageForm((m) => ({ ...m, status: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Stipend / Prize</label>
                  <input
                    type="text"
                    value={manageForm.stipendOrPrize}
                    onChange={(e) => setManageForm((m) => ({ ...m, stipendOrPrize: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Work Mode</label>
                  <select
                    value={manageForm.mode}
                    onChange={(e) => setManageForm((m) => ({ ...m, mode: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <SkillInput
                label="Required Skills"
                skills={
                  manageForm.requiredSkills
                    ? manageForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : []
                }
                onAddSkill={(skill) => {
                  const current = manageForm.requiredSkills
                    ? manageForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  if (!current.includes(skill)) {
                    setManageForm((m) => ({ ...m, requiredSkills: [...current, skill].join(", ") }));
                  }
                }}
                onRemoveSkill={(skill) => {
                  const current = manageForm.requiredSkills
                    ? manageForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  setManageForm((m) => ({
                    ...m,
                    requiredSkills: current.filter((s) => s !== skill).join(", "),
                  }));
                }}
                placeholder="Type/Search skill (e.g. React, Python, Docker) & select from dropdown…"
              />

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={manageForm.description}
                  onChange={(e) => setManageForm((m) => ({ ...m, description: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                />
              </div>

              {manageFeedback && (
                <p className="text-xs font-mono text-primary text-center font-semibold">{manageFeedback}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDeleteOpportunity(managingOpportunity._id)}
                  className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Listing</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setManagingOpportunity(null)}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingManage}
                    className="text-xs font-semibold px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                  >
                    {isSavingManage && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
