import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  FileText,
  Printer,
  Download,
  GitMerge,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";
import SkillInput from "@/components/SkillInput";
import { API_BASE } from "@/lib/api";

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
  atsScore?: number;
  resumeUrl?: string;
  resumeData?: any;
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

  // Navigation state: "dashboard" | "opportunities" | "review" | "opensource"
  const [activeNavTab, setActiveNavTab] = useState<"dashboard" | "opportunities" | "review" | "opensource">("dashboard");

  // Applicant Filtering & Sorting State
  const [applicantSearch, setApplicantSearch] = useState("");
  const [minSkillMatchFilter, setMinSkillMatchFilter] = useState<number>(0);
  const [minAtsScoreFilter, setMinAtsScoreFilter] = useState<number>(0);
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<string>("all");
  const [applicantSortBy, setApplicantSortBy] = useState<"atsScore" | "matchScore" | "appliedAt">("atsScore");
  const [selectedResumeViewer, setSelectedResumeViewer] = useState<CandidateApplication | null>(null);

  // Compute Filtered & Sorted Applicants
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((cand) => {
        // Search Filter
        const searchLower = applicantSearch.toLowerCase().trim();
        const matchSearch =
          !searchLower ||
          cand.applicantName.toLowerCase().includes(searchLower) ||
          cand.applicantEmail.toLowerCase().includes(searchLower) ||
          cand.applicantInstitution.toLowerCase().includes(searchLower) ||
          (cand.applicantSkills || []).some((s) => s.toLowerCase().includes(searchLower));

        // Skill Match Filter
        const matchSkill = (cand.matchScore || 0) >= minSkillMatchFilter;

        // ATS Score Filter
        const matchATS = (cand.atsScore || 0) >= minAtsScoreFilter;

        // Status Filter
        const matchStatus = applicantStatusFilter === "all" || cand.status === applicantStatusFilter;

        return matchSearch && matchSkill && matchATS && matchStatus;
      })
      .sort((a, b) => {
        if (applicantSortBy === "atsScore") {
          return (b.atsScore || 0) - (a.atsScore || 0);
        } else if (applicantSortBy === "matchScore") {
          return (b.matchScore || 0) - (a.matchScore || 0);
        } else {
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        }
      });
  }, [applicants, applicantSearch, minSkillMatchFilter, minAtsScoreFilter, applicantStatusFilter, applicantSortBy]);

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

  // Open Source State
  const [ossProjects, setOssProjects] = useState<any[]>([]);
  const [isOssModalOpen, setIsOssModalOpen] = useState(false);
  const [isPostingOss, setIsPostingOss] = useState(false);
  const [ossForm, setOssForm] = useState({
    title: "",
    description: "",
    repoUrl: "",
    techStack: "React, TypeScript, Node.js",
    difficulty: "intermediate",
  });
  const [curatedIssuesDraft, setCuratedIssuesDraft] = useState<
    Array<{ title: string; url: string; difficulty: string }>
  >([]);

  const [createdOssSetup, setCreatedOssSetup] = useState<any | null>(null);
  const [selectedOssProject, setSelectedOssProject] = useState<any | null>(null);
  const [ossContributors, setOssContributors] = useState<any[]>([]);
  const [isLoadingContributors, setIsLoadingContributors] = useState(false);
  const [issuingCertId, setIssuingCertId] = useState<string | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchOssProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opensource/projects/mine`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOssProjects(data.projects || []);
        }
      }
    } catch (err) {
      // silent
    }
  }, []);

  const handlePostOssProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPostingOss(true);
    try {
      const res = await fetch(`${API_BASE}/api/opensource/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...ossForm,
          techStack: ossForm.techStack.split(",").map((s) => s.trim()).filter(Boolean),
          issues: curatedIssuesDraft,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedOssSetup(data.webhookSetup);
        setCuratedIssuesDraft([]);
        fetchOssProjects();
      }
    } catch (err) {
      // silent
    } finally {
      setIsPostingOss(false);
    }
  };

  const fetchProjectContributions = async (projId: string) => {
    setIsLoadingContributors(true);
    try {
      const res = await fetch(`${API_BASE}/api/opensource/projects/${projId}/contributions`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOssContributors(data.contributions || []);
        }
      }
    } catch (err) {
      // silent
    } finally {
      setIsLoadingContributors(false);
    }
  };

  const handleIssueCertificate = async (contributionId: string) => {
    setIssuingCertId(contributionId);
    try {
      const res = await fetch(`${API_BASE}/api/opensource/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contributionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOssContributors((prev) =>
            prev.map((c) => (c._id === contributionId ? { ...c, certificateIssued: true } : c))
          );
        }
      }
    } catch (err) {
      // silent
    } finally {
      setIssuingCertId(null);
    }
  };

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
        body: JSON.stringify({
          query,
          prompt: query,
          history: aiChatHistory.map((h) => ({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text,
          })),
        }),
      });
      const data = await res.json();
      const reply =
        data.data?.response ||
        data.reply ||
        (data.success ? data.message : null) ||
        "I am currently processing corporate metrics. How else can I assist your talent sourcing?";
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

          <button
            type="button"
            onClick={() => {
              setActiveNavTab("opensource");
              fetchOssProjects();
            }}
            className={cn(
              "px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5",
              activeNavTab === "opensource"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Open Source</span>
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
              </div>
            </div>
          </div>
        </section>

        {/* 4. Tab Views: Opportunities Feed vs Candidate Review Pipeline vs Open Source */}
        {activeNavTab === "dashboard" || activeNavTab === "opportunities" ? (
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
        ) : activeNavTab === "review" ? (
          /* Review Candidate Pipeline View */
          <section className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Candidate Review Pipeline
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Evaluate and shortlist applicants based on verified skill benchmarks & ATS match scores.
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

            {/* Candidate Sourcing & ATS Filtering Controls Bar */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    placeholder="Filter by candidate name, email, or skill…"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Min Skill Match Filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px] shrink-0">Min Skill %:</span>
                    <select
                      value={minSkillMatchFilter}
                      onChange={(e) => setMinSkillMatchFilter(Number(e.target.value))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground font-mono shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value={0}>All Matches</option>
                      <option value={40}>&ge; 40% Match</option>
                      <option value={60}>&ge; 60% Match</option>
                      <option value={75}>&ge; 75% Match</option>
                      <option value={90}>&ge; 90% High Match</option>
                    </select>
                  </div>

                  {/* Min ATS Score Filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px] shrink-0">Min ATS Score:</span>
                    <select
                      value={minAtsScoreFilter}
                      onChange={(e) => setMinAtsScoreFilter(Number(e.target.value))}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground font-mono shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value={0}>All ATS Scores</option>
                      <option value={50}>&ge; 50 ATS</option>
                      <option value={70}>&ge; 70 ATS</option>
                      <option value={85}>&ge; 85 High ATS</option>
                    </select>
                  </div>

                  {/* Pipeline Stage Filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px] shrink-0">Stage:</span>
                    <select
                      value={applicantStatusFilter}
                      onChange={(e) => setApplicantStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="all">All Stages</option>
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Technical Interview">Technical Interview</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px] shrink-0">Sort:</span>
                    <select
                      value={applicantSortBy}
                      onChange={(e) => setApplicantSortBy(e.target.value as any)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground font-semibold shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="atsScore">Highest ATS Score</option>
                      <option value="matchScore">Highest Skill Match</option>
                      <option value="appliedAt">Application Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Metrics */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60 font-mono">
                <span>
                  Showing {filteredApplicants.length} of {applicants.length} candidates
                </span>
                {(applicantSearch || minSkillMatchFilter > 0 || minAtsScoreFilter > 0 || applicantStatusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setApplicantSearch("");
                      setMinSkillMatchFilter(0);
                      setMinAtsScoreFilter(0);
                      setApplicantStatusFilter("all");
                    }}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {isLoadingApplicants ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-mono text-muted-foreground">Computing candidate ATS &amp; competency scores…</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border rounded-xl space-y-3">
                <p className="text-sm font-semibold text-foreground">No applications received yet</p>
                <p className="text-xs text-muted-foreground">
                  Applications submitted for &quot;{selectedOpportunity?.title}&quot; will appear here automatically.
                </p>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-xl space-y-3">
                <p className="text-sm font-semibold text-foreground">No candidates match current filter criteria</p>
                <button
                  type="button"
                  onClick={() => {
                    setApplicantSearch("");
                    setMinSkillMatchFilter(0);
                    setMinAtsScoreFilter(0);
                    setApplicantStatusFilter("all");
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Clear filters to view all {applicants.length} applicants
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-background shadow-sm">
                {filteredApplicants.map((cand) => (
                  <div key={cand._id} className="p-5 space-y-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{cand.applicantName}</h4>

                          {/* Skill Match Badge */}
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            {cand.matchScore}% Skill Match
                          </span>

                          {/* ATS Score Badge */}
                          <span
                            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                              (cand.atsScore || 0) >= 80
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                : (cand.atsScore || 0) >= 60
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            ATS Score: {cand.atsScore || Math.round(cand.matchScore * 0.85)}%
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {cand.applicantInstitution} • {cand.applicantEmail}
                        </p>
                      </div>

                      {/* Candidate Action Strip */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* View ATS Resume Button */}
                        {(cand.resumeData || cand.resumeUrl) ? (
                          <button
                            type="button"
                            onClick={() => setSelectedResumeViewer(cand)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View ATS Resume</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-muted-foreground italic px-2">
                            Standard Profile Application
                          </span>
                        )}

                        {/* Candidate Status Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Stage:</span>
                          <select
                            value={cand.status}
                            onChange={(e) => handleUpdateStatus(cand._id, e.target.value)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary font-mono shadow-sm"
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
        ) : (
          /* Open Source Projects Manager View */
          <section className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-primary" />
                  Open Source Projects &amp; Webhook Hub
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Post GitHub repositories for students to contribute. Merged PRs auto-register via webhooks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreatedOssSetup(null);
                  setIsOssModalOpen(true);
                }}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Post Open Source Project</span>
              </button>
            </div>

            {ossProjects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-secondary/20 space-y-3">
                <Code2 className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No open source projects posted yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click &quot;Post Open Source Project&quot; above to link your GitHub repository and start accepting student contributions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ossProjects.map((p) => (
                  <div key={p._id} className="border border-border bg-card rounded-xl p-5 space-y-4 hover:border-primary/40 transition-colors shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-mono hover:underline flex items-center gap-1 mt-0.5"
                        >
                          {p.repoFullName}
                        </a>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground/80 font-mono">
                        {p.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.techStack?.map((t: string) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-foreground/80 border border-border">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        <strong>{p.contributionCount || 0}</strong> merged contributions
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOssProject(p);
                          fetchProjectContributions(p._id);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                      >
                        View Contributors
                      </button>
                    </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Engineering Domain</label>
                  <input
                    type="text"
                    required
                    value={publishForm.domain}
                    onChange={(e) => setPublishForm((p) => ({ ...p, domain: e.target.value }))}
                    placeholder="e.g. Full-Stack Systems, AI/ML, Cloud Infrastructure"
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Location / City</label>
                  <input
                    type="text"
                    required
                    value={publishForm.location}
                    onChange={(e) => setPublishForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Bengaluru, KA or Remote"
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Application Deadline</label>
                  <input
                    type="date"
                    required
                    value={publishForm.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPublishForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none font-mono"
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

      {/* 6. Candidate ATS Resume Viewer Modal */}
      {selectedResumeViewer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedResumeViewer.applicantName}&apos;s ATS Resume
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedResumeViewer.applicantInstitution} • {selectedResumeViewer.applicantEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  ATS Score: {selectedResumeViewer.atsScore || 85}%
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedResumeViewer(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body - Rendered Resume Sheet */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedResumeViewer.resumeData ? (
                <div className="bg-white text-gray-900 p-8 rounded-xl border border-gray-300 shadow-md space-y-5 text-left font-sans">
                  {/* Header */}
                  <div className="border-b-2 border-gray-900 pb-3">
                    <h2 className="text-2xl font-black tracking-tight uppercase">
                      {selectedResumeViewer.resumeData.fullName || selectedResumeViewer.applicantName}
                    </h2>
                    {selectedResumeViewer.resumeData.headline && (
                      <p className="text-xs font-bold text-gray-700 mt-0.5 uppercase tracking-wide">
                        {selectedResumeViewer.resumeData.headline}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-2 font-mono">
                      <span>{selectedResumeViewer.resumeData.email || selectedResumeViewer.applicantEmail}</span>
                      {selectedResumeViewer.resumeData.phone && (
                        <span>• {selectedResumeViewer.resumeData.phone}</span>
                      )}
                      {selectedResumeViewer.resumeData.location && (
                        <span>• {selectedResumeViewer.resumeData.location}</span>
                      )}
                      {selectedResumeViewer.resumeData.linkedin && (
                        <span>
                          •{" "}
                          <a
                            href={selectedResumeViewer.resumeData.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            LinkedIn
                          </a>
                        </span>
                      )}
                      {selectedResumeViewer.resumeData.github && (
                        <span>
                          •{" "}
                          <a
                            href={selectedResumeViewer.resumeData.github}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            GitHub
                          </a>
                        </span>
                      )}
                      {selectedResumeViewer.resumeData.website && (
                        <span>
                          •{" "}
                          <a
                            href={selectedResumeViewer.resumeData.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            Portfolio Website
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedResumeViewer.resumeData.summary && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                        Professional Summary
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {selectedResumeViewer.resumeData.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedResumeViewer.resumeData.skills && selectedResumeViewer.resumeData.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                        Core Competencies &amp; Technical Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedResumeViewer.resumeData.skills.map((sk: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300 font-semibold"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {selectedResumeViewer.resumeData.experience &&
                    selectedResumeViewer.resumeData.experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Experience &amp; Internships
                        </h4>
                        <div className="space-y-3">
                          {selectedResumeViewer.resumeData.experience.map((exp: any, idx: number) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex justify-between items-baseline text-xs font-bold">
                                <span>{exp.title}</span>
                                <span className="font-mono text-[11px] text-gray-600">{exp.timeline}</span>
                              </div>
                              {exp.organization && (
                                <p className="text-xs font-medium text-gray-700">{exp.organization}</p>
                              )}
                              {exp.description && (
                                <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Education */}
                  {selectedResumeViewer.resumeData.education &&
                    selectedResumeViewer.resumeData.education.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Education
                        </h4>
                        <div className="space-y-2">
                          {selectedResumeViewer.resumeData.education.map((edu: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-baseline text-xs">
                              <div>
                                <span className="font-bold">{edu.education}</span>
                                {edu.course && <span className="text-gray-600"> — {edu.course}</span>}
                              </div>
                              <span className="font-mono text-[11px] text-gray-600">{edu.timeline}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Certifications */}
                  {selectedResumeViewer.resumeData.certifications &&
                    selectedResumeViewer.resumeData.certifications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Certifications &amp; Licenses
                        </h4>
                        <div className="space-y-2">
                          {selectedResumeViewer.resumeData.certifications.map((cert: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-baseline text-xs">
                              <div>
                                <span className="font-bold">{cert.title}</span>
                                {cert.issuer && <span className="text-gray-600"> — {cert.issuer}</span>}
                                {cert.summary && (
                                  <p className="text-[11px] text-gray-600 leading-tight pt-0.5">{cert.summary}</p>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-gray-600">{cert.timeline}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Projects & Open Source */}
                  {selectedResumeViewer.resumeData.projects &&
                    selectedResumeViewer.resumeData.projects.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Key Projects &amp; Open Source Contributions
                        </h4>
                        <div className="space-y-2.5">
                          {selectedResumeViewer.resumeData.projects.map((proj: any, idx: number) => (
                            <div key={idx} className="space-y-0.5 text-xs">
                              <div className="flex justify-between items-baseline font-bold">
                                <span className="text-gray-900">{proj.title}</span>
                                {proj.link && (
                                  <a
                                    href={proj.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-[11px] text-primary hover:underline font-normal"
                                  >
                                    {proj.link.replace("https://", "")}
                                  </a>
                                )}
                              </div>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <p className="font-mono text-[11px] text-gray-600">
                                  Tech Stack: {proj.technologies.join(" • ")}
                                </p>
                              )}
                              {proj.description && (
                                <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{proj.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : selectedResumeViewer.resumeUrl ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">Candidate attached an external resume file</p>
                  <a
                    href={selectedResumeViewer.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4" />
                    Open Attached Resume PDF
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-10">
                  No custom resume uploaded. Application was submitted with standard profile benchmarks.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-xs text-muted-foreground font-mono">
                Pipeline Stage: <strong className="text-foreground">{selectedResumeViewer.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>${selectedResumeViewer.applicantName}_Resume</title>
                          <style>
                            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
                            h1 { font-size: 24px; margin-bottom: 4px; text-transform: uppercase; }
                            .contact { font-size: 11px; color: #555; margin-bottom: 20px; border-bottom: 2px solid #222; padding-bottom: 10px; }
                            .section { font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
                            .item { margin-bottom: 10px; }
                            .header { display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; }
                            .sub { font-size: 11px; color: #444; }
                          </style>
                        </head>
                        <body>
                          <h1>${selectedResumeViewer.resumeData?.fullName || selectedResumeViewer.applicantName}</h1>
                          <div class="contact">
                            ${selectedResumeViewer.resumeData?.email || selectedResumeViewer.applicantEmail} | ${selectedResumeViewer.applicantInstitution}
                          </div>
                          ${selectedResumeViewer.resumeData?.summary ? `<div class="section">Summary</div><p style="font-size:11px;">${selectedResumeViewer.resumeData.summary}</p>` : ""}
                          <div class="section">Skills</div>
                          <p style="font-size:11px;">${(selectedResumeViewer.resumeData?.skills || selectedResumeViewer.applicantSkills || []).join(", ")}</p>
                          ${selectedResumeViewer.resumeData?.experience?.length ? `
                            <div class="section">Experience</div>
                            ${selectedResumeViewer.resumeData.experience.map((e: any) => `
                              <div class="item">
                                <div class="header"><span>${e.title} — ${e.organization || ""}</span><span>${e.timeline || ""}</span></div>
                                <div class="sub">${e.description || ""}</div>
                              </div>
                            `).join("")}
                          ` : ""}
                          ${selectedResumeViewer.resumeData?.education?.length ? `
                            <div class="section">Education</div>
                            ${selectedResumeViewer.resumeData.education.map((e: any) => `
                              <div class="item">
                                <div class="header"><span>${e.education} (${e.course || ""})</span><span>${e.timeline || ""}</span></div>
                                <div class="sub">${e.institution || ""} — Grade: ${e.grade || "N/A"}</div>
                              </div>
                            `).join("")}
                          ` : ""}
                          ${selectedResumeViewer.resumeData?.projects?.length ? `
                            <div class="section">Projects</div>
                            ${selectedResumeViewer.resumeData.projects.map((p: any) => `
                              <div class="item">
                                <div class="header"><span>${p.title}</span><span>${p.technologies?.join(", ") || ""}</span></div>
                                <div class="sub">${p.description || ""}</div>
                              </div>
                            `).join("")}
                          ` : ""}
                          <script>window.onload = function() { window.print(); };</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border border-border transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedResumeViewer(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Open Source Project Modal */}
      {isOssModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Post Open Source Project</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Link a GitHub repo for student contributions</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOssModalOpen(false);
                  setCreatedOssSetup(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdOssSetup ? (
              <div className="space-y-4 bg-secondary/30 p-4 rounded-md border border-border">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                  <Check className="w-4 h-4" />
                  <span>Project Created Successfully!</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To auto-track merged pull requests, add this webhook in your GitHub repo settings:
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block">Payload URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdOssSetup.webhookUrl}
                      className="flex-1 text-xs p-2 rounded-md bg-background border border-border text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdOssSetup.webhookUrl);
                        setCopiedWebhookUrl(true);
                        setTimeout(() => setCopiedWebhookUrl(false), 2000);
                      }}
                      className="p-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground"
                    >
                      {copiedWebhookUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block">Webhook Secret</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdOssSetup.webhookSecret}
                      className="flex-1 text-xs p-2 rounded-md bg-background border border-border text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdOssSetup.webhookSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="p-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground"
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-amber-500 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                  Select Content type: application/json and choose &quot;Pull requests&quot; under events.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsOssModalOpen(false);
                    setCreatedOssSetup(null);
                  }}
                  className="w-full text-xs font-semibold py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePostOssProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Project Title</label>
                  <input
                    type="text"
                    required
                    value={ossForm.title}
                    onChange={(e) => setOssForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Distributed Cache Engine"
                    className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">GitHub Repository URL</label>
                  <input
                    type="url"
                    required
                    value={ossForm.repoUrl}
                    onChange={(e) => setOssForm((f) => ({ ...f, repoUrl: e.target.value }))}
                    placeholder="https://github.com/organization/repository"
                    className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Difficulty</label>
                    <select
                      value={ossForm.difficulty}
                      onChange={(e) => setOssForm((f) => ({ ...f, difficulty: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none"
                    >
                      <option value="beginner">Beginner (Good First Issue)</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Tech Stack (comma-sep)</label>
                    <input
                      type="text"
                      value={ossForm.techStack}
                      onChange={(e) => setOssForm((f) => ({ ...f, techStack: e.target.value }))}
                      placeholder="React, TypeScript, Go"
                      className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Description &amp; Guidelines</label>
                  <textarea
                    required
                    rows={3}
                    value={ossForm.description}
                    onChange={(e) => setOssForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the repo, contribution guidelines, or target issues..."
                    className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsOssModalOpen(false)}
                    disabled={isPostingOss}
                    className="text-xs font-semibold px-4 py-2 rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPostingOss}
                    className="text-xs font-semibold px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                  >
                    {isPostingOss && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Generate Webhook &amp; Post</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contributors Modal */}
      {selectedOssProject && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedOssProject.title} — Merged PR Contributors</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Students whose PRs were verified merged by GitHub</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOssProject(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingContributors ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : ossContributors.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No merged contributions received yet for this project.
              </p>
            ) : (
              <div className="space-y-3">
                {ossContributors.map((c) => (
                  <div key={c._id} className="p-4 rounded-md border border-border bg-secondary/20 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">{c.studentName}</p>
                      <a
                        href={c.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline font-mono block"
                      >
                        PR #{c.prNumber}: {c.prTitle}
                      </a>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Merged: {new Date(c.mergedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      {c.certificateIssued ? (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Certificate Issued
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleIssueCertificate(c._id)}
                          disabled={issuingCertId === c._id}
                          className="text-xs font-bold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
                        >
                          {issuingCertId === c._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Generate Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
