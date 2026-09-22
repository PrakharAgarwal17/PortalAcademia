import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Award,
  Check,
  ArrowRight,
  CheckCheck,
  GraduationCap,
  Search,
  Mail,
  Users,
  UserCheck,
  TrendingUp,
  X,
  Briefcase,
  MapPin,
  Megaphone,
  MessageSquare,
  Send,
  Plus,
  Radio,
  Clock,
  Volume2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { API_BASE } from "@/lib/api";
import CommunityChatView from "@/components/CommunityChatView";

interface InstitutionProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
  institutionName?: string;
  aisheCode?: string;
  officialEmail?: string;
  contact?: string;
  location?: string;
  accountType: string;
  bio?: string;
}

export interface EnrolledStudent {
  _id: string;
  userId: string;
  name: string;
  headline?: string;
  profileImage?: string;
  institution: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  skills: string[];
  education: Array<{
    institution?: string;
    education?: string;
    course?: string;
    start?: string;
    end?: string;
  }>;
  academicYear: string;
  graduationBatch: string;
  graduationYear?: number;
  isAlumni?: boolean;
  currentCompany?: string;
  currentRole?: string;
  primaryDegree: string;
  verifiedCertsCount: number;
  totalCertsCount: number;
  experienceCount: number;
  bio?: string;
  createdAt?: string;
}

interface CohortTelemetry {
  totalStudents: number;
  averageReadinessScore: number;
  avgSkills?: number;
  verificationRate: number;
  totalCertificationsSubmitted: number;
  totalVerifiedCredentials: number;
  topSkillsDistribution: Array<{ skill: string; studentCount: number; percentage: number }>;
  curriculumDeficits: Array<{
    skill: string;
    marketDemandIndex: number;
    cohortProficiencyCount: number;
    curriculumDeficitPercent: number;
  }>;
}

interface CampusBroadcast {
  title: string;
  message: string;
  targetAudience: string;
  createdAt: string;
  recipientCount: number;
}

interface CommunitySpaceItem {
  _id: string;
  name: string;
  description: string;
  industry: string;
  focus?: string;
  memberCount: number;
  isJoined?: boolean;
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
  targetAudience?: "student" | "faculty" | "both";
  recommendedByColleges?: string[];
  recommendedToStudentsBy?: string[];
  recommendedToFacultyBy?: string[];
}

export type DeskTab = "students" | "cohort" | "endorsement" | "announcements" | "community";

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [telemetry, setTelemetry] = useState<CohortTelemetry | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Desk Tabs synchronized with URL search params (?tab=students)
  const tabFromUrl = searchParams.get("tab") as DeskTab | null;
  const activeTab: DeskTab =
    tabFromUrl && ["students", "cohort", "endorsement", "announcements", "community"].includes(tabFromUrl)
      ? tabFromUrl
      : "students";

  const setActiveTab = (tab: DeskTab) => {
    setSearchParams({ tab });
  };

  // Enrolled Students Directory state
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");

  // Announcements state
  const [broadcasts, setBroadcasts] = useState<CampusBroadcast[]>([]);
  const [isBroadcastsLoading, setIsBroadcastsLoading] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "students" | "faculty">("all");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);
  const [broadcastErrorMsg, setBroadcastErrorMsg] = useState<string | null>(null);

  // Community Spaces state
  const [spaces, setSpaces] = useState<CommunitySpaceItem[]>([]);
  const [isSpacesLoading, setIsSpacesLoading] = useState(false);
  const [isJoiningSpaceId, setIsJoiningSpaceId] = useState<string | null>(null);
  const [activeChatSpace, setActiveChatSpace] = useState<{ id: string; name: string; focus?: string } | null>(null);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceForm, setNewSpaceForm] = useState({ name: "", description: "", industry: "", focus: "" });
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Endorsement Desk filter & confirmation modal
  const [oppAudienceFilter, setOppAudienceFilter] = useState<"all" | "student" | "faculty">("all");
  const [oppCategoryFilter, setOppCategoryFilter] = useState<string>("all");
  const [oppSearchQuery, setOppSearchQuery] = useState<string>("");
  const [confirmRecommendModal, setConfirmRecommendModal] = useState<{
    oppId: string;
    oppTitle: string;
    organization: string;
    target: "students" | "faculty";
  } | null>(null);

  // In-flight actions
  const [recommendingId, setRecommendingId] = useState<string | null>(null);
  const [verifiedSuccessMessage, setVerifiedSuccessMessage] = useState<string | null>(null);

  /**
   * @description Fetch verified institution profile
   * @returns {Promise<void>}
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
      console.error("Failed to fetch institution profile:", err);
    }
  }, []);

  /**
   * @description Fetch cohort readiness telemetry via MongoDB Aggregation Pipelines
   * @returns {Promise<void>}
   */
  const fetchCohortTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/institution/cohort`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setTelemetry(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cohort telemetry:", err);
    }
  }, []);

  /**
   * @description Fetch campus broadcast history
   */
  const fetchBroadcasts = useCallback(async () => {
    setIsBroadcastsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/broadcast-history`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.error("Failed to fetch broadcast history:", err);
    } finally {
      setIsBroadcastsLoading(false);
    }
  }, []);

  /**
   * @description Fetch enterprise and campus community spaces
   */
  const fetchSpaces = useCallback(async () => {
    setIsSpacesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/spaces`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSpaces(data.spaces || []);
      }
    } catch (err) {
      console.error("Failed to fetch community spaces:", err);
    } finally {
      setIsSpacesLoading(false);
    }
  }, []);

  /**
   * @description Fetch active opportunities to endorse to students or faculty
   * @returns {Promise<void>}
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
    }
  }, []);

  /**
   * @description Fetch enrolled students for this institution from profile DB
   */
  const fetchEnrolledStudents = useCallback(async (year = selectedYearFilter, search = studentSearchQuery) => {
    setIsStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (year && year === "Alumni") {
        params.append("status", "alumni");
      } else if (year && year === "enrolled") {
        params.append("status", "enrolled");
      } else if (year && year !== "all") {
        params.append("year", year);
      }
      if (search && search.trim()) params.append("search", search.trim());
      const res = await fetch(`${API_BASE}/api/verification/institution-students?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const studentList = Array.isArray(data.students)
          ? data.students
          : (Array.isArray(data.data) ? data.data : []);
        setEnrolledStudents(studentList);
      }
    } catch (err) {
      console.error("Failed to fetch enrolled students:", err);
    } finally {
      setIsStudentsLoading(false);
    }
  }, [selectedYearFilter, studentSearchQuery]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchProfile(),
      fetchCohortTelemetry(),
      fetchOpportunities(),
      fetchEnrolledStudents(),
      fetchBroadcasts(),
      fetchSpaces(),
    ]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchCohortTelemetry, fetchOpportunities, fetchEnrolledStudents, fetchBroadcasts, fetchSpaces]);

  // Re-fetch students on filter or search changes
  useEffect(() => {
    if (activeTab === "students") {
      const handler = setTimeout(() => {
        fetchEnrolledStudents(selectedYearFilter, studentSearchQuery);
      }, 250);
      return () => clearTimeout(handler);
    }
  }, [selectedYearFilter, studentSearchQuery, activeTab, fetchEnrolledStudents]);

  /**
   * @description Dispatch official announcement to students & faculty
   */
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setBroadcastSuccessMsg(null);
    setBroadcastErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetAudience: broadcastAudience,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccessMsg(
          data.message || `Announcement successfully dispatched to ${data.recipientCount} campus member(s)!`
        );
        setBroadcastTitle("");
        setBroadcastMessage("");
        await fetchBroadcasts();
      } else {
        setBroadcastErrorMsg(data.message || "Failed to broadcast announcement.");
      }
    } catch (err: any) {
      setBroadcastErrorMsg(err.message || "Failed to broadcast announcement.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  /**
   * @description Join technical/campus community space
   */
  const handleJoinSpace = async (spaceId: string) => {
    setIsJoiningSpaceId(spaceId);
    try {
      const res = await fetch(`${API_BASE}/api/community/spaces/${spaceId}/join`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchSpaces();
      }
    } catch (err) {
      console.error("Failed to join space:", err);
    } finally {
      setIsJoiningSpaceId(null);
    }
  };

  /**
   * @description Create new campus/department community space
   */
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceForm.name.trim() || !newSpaceForm.description.trim() || !newSpaceForm.industry.trim()) return;
    setIsCreatingSpace(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSpaceForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateSpaceModal(false);
        setNewSpaceForm({ name: "", description: "", industry: "", focus: "" });
        await fetchSpaces();
      }
    } catch (err) {
      console.error("Failed to create community space:", err);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  /**
   * @description Endorse opportunity to candidate students or faculty
   * @param {string} opportunityId - Target opportunity ID
   * @param {"students" | "faculty"} target - Target cohort
   * @returns {Promise<void>}
   */
  const handleRecommend = async (opportunityId: string, target: "students" | "faculty") => {
    setRecommendingId(opportunityId);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${opportunityId}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifiedSuccessMessage(
          `Opportunity successfully endorsed to all affiliated ${target === "students" ? "enrolled students" : "faculty members"}!`
        );
        await fetchOpportunities();
      }
    } catch (err) {
      console.error("Failed to recommend opportunity:", err);
    } finally {
      setRecommendingId(null);
    }
  };

  // Filtered opportunities based on posted audience, category, and search query
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Audience filter
      if (oppAudienceFilter === "student") {
        const matchAudience = opp.targetAudience === "student" || opp.targetAudience === "both" || !opp.targetAudience;
        if (!matchAudience) return false;
      } else if (oppAudienceFilter === "faculty") {
        const matchAudience = opp.targetAudience === "faculty" || opp.targetAudience === "both";
        if (!matchAudience) return false;
      }

      // Category filter
      if (oppCategoryFilter !== "all") {
        if (opp.category?.toLowerCase() !== oppCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      if (oppSearchQuery && oppSearchQuery.trim()) {
        const q = oppSearchQuery.toLowerCase().trim();
        const matchesTitle = opp.title?.toLowerCase().includes(q);
        const matchesOrg = opp.organization?.toLowerCase().includes(q);
        const matchesDomain = opp.domain?.toLowerCase().includes(q);
        const matchesSkills = (opp.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesOrg && !matchesDomain && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, oppAudienceFilter, oppCategoryFilter, oppSearchQuery]);

  const initials = profile?.institutionName || profile?.name
    ? (profile.institutionName || profile.name)
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase()
    : "INS";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading institutional cohort telemetry & governance desk…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 1. Global Stakeholder Navigation Bar */}
      <Navbar userName={profile?.name} profileId={profile?._id} userRole="institution" />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Institutional Profile & Accreditation Strip */}
        <section className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div
                onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-muted border-2 border-primary/30 flex items-center justify-center font-bold text-base text-foreground cursor-pointer hover:border-primary transition-all duration-300 overflow-hidden shadow-md group shrink-0"
                title="View Institution Profile"
              >
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="group-hover:text-primary transition-colors font-mono font-extrabold text-sm">
                    {initials}
                  </span>
                )}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
                    title="View Institution Profile"
                  >
                    {profile?.institutionName || profile?.name || "Affiliated Academic Institution"}
                  </h1>
                  <span
                    className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 text-[11px] font-bold"
                    title="AISHE Code Registered"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {profile?.aisheCode ? `AISHE: ${profile.aisheCode}` : "Affiliated Institute"}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-[11px] font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Training & Placement Office • {profile?.officialEmail || profile?.contact || "Verified Institutional Registry"} • {profile?.location || "National Academic Zone"}
                </p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Cohort Tracked
                </span>
                <span className="font-bold text-foreground tabular-nums text-base">
                  {telemetry?.totalStudents ?? 0}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Average Readiness
                </span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {telemetry?.averageReadinessScore ?? 0}%
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Student Credentials
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-base">
                  {telemetry?.totalCertificationsSubmitted ?? telemetry?.totalVerifiedCredentials ?? 0}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                <span className="text-primary block text-[10px] uppercase tracking-wider font-bold">
                  Announcements
                </span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {broadcasts.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Success toast notification */}
        {verifiedSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>{verifiedSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/institution/directory")}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/40 text-foreground transition-all cursor-pointer shadow-2xs group"
            >
              <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Full Faculty & Student Directory</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                Roster
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/trends/institution")}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/40 text-foreground transition-all cursor-pointer shadow-2xs group"
            >
              <TrendingUp className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Macro Market Trends</span>
            </button>
          </div>
        </div>

        {/* 3. Desk Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-secondary/50 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "students"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Enrolled Students</span>
            <span
              className={cn(
                "ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === "students"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {enrolledStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cohort")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "cohort"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Cohort Readiness & Deficits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("endorsement")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "endorsement"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Posted Opportunities</span>
            <span
              className={cn(
                "ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === "endorsement"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {opportunities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "announcements"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campus Announcements</span>
            <span
              className={cn(
                "ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === "announcements"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {broadcasts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("community")}
            className={cn(
              "text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "community"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Campus Community</span>
            <span
              className={cn(
                "ml-1 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === "community"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {spaces.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DESK: ENROLLED STUDENTS & COHORT DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === "students" && (
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs animate-in fade-in duration-300">
            {/* Header with Title and Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Enrolled Students Directory & Academic Cohorts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse verified students currently enrolled at your institution. Filter by academic year, search talent by skills or name, and click any profile to inspect detailed academic credentials.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                  {enrolledStudents.length} Students Showing
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
              {/* Year Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground font-mono uppercase text-[10px] mr-1">
                  Academic Year:
                </span>
                {[
                  { id: "all", label: "All Members" },
                  { id: "enrolled", label: "Currently Enrolled" },
                  { id: "1st Year", label: "1st Year" },
                  { id: "2nd Year", label: "2nd Year" },
                  { id: "3rd Year", label: "3rd Year" },
                  { id: "4th Year", label: "4th Year" },
                  { id: "Alumni", label: "Alumni Network" },
                ].map((yr) => (
                  <button
                    key={yr.id}
                    type="button"
                    onClick={() => setSelectedYearFilter(yr.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      selectedYearFilter === yr.id
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {yr.label}
                  </button>
                ))}
              </div>

              {/* Search Bar Input */}
              <div className="relative min-w-[240px] md:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search name, email, or skill..."
                  className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Students List or Loading or Empty State */}
            {isStudentsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-xs font-mono text-muted-foreground">
                  Fetching institutional student roster from database…
                </p>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-border rounded-xl space-y-2.5 bg-secondary/10">
                <Users className="w-8 h-8 text-muted-foreground mx-auto opacity-70" />
                <p className="text-xs font-bold text-foreground">No Enrolled Students Found</p>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                  {studentSearchQuery || selectedYearFilter !== "all"
                    ? "No students match the current filters. Try resetting the academic year filter or search term."
                    : "No students currently specify this institution in their profile education record."}
                </p>
                {(studentSearchQuery || selectedYearFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYearFilter("all");
                      setStudentSearchQuery("");
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer pt-1"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledStudents.map((student) => {
                  const studentInitials = student.name
                    ? student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "ST";

                  return (
                    <div
                      key={student._id}
                      onClick={() => navigate(`/profile/${student.userId || student._id}`)}
                      className="group p-4 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-xs hover:shadow-md"
                    >
                      {/* Top Row: Avatar + Name + Academic Year Badge */}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 via-secondary to-muted border border-border flex items-center justify-center font-bold text-xs text-foreground overflow-hidden shrink-0 group-hover:border-primary transition-colors">
                              {student.profileImage ? (
                                <img
                                  src={student.profileImage}
                                  alt={student.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <span className="font-mono">{studentInitials}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                                <span className="truncate">{student.name}</span>
                                {student.isEmailVerified && (
                                  <span title="Verified Student">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {student.headline || student.primaryDegree}
                              </p>
                            </div>
                          </div>

                          {/* Academic Year Tag */}
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 uppercase",
                              student.academicYear === "1st Year" && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                              student.academicYear === "2nd Year" && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                              student.academicYear === "3rd Year" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              student.academicYear === "4th Year" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                              student.academicYear.includes("Alumni") && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            )}
                          >
                            {student.academicYear}
                          </span>
                        </div>

                        {/* Batch & Degree Row */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono text-muted-foreground">
                          <span className="px-1.5 py-0.5 rounded bg-card border border-border/80 text-foreground font-semibold">
                            {student.graduationBatch}
                          </span>
                          <span>•</span>
                          <span className="truncate text-foreground/80">
                            {student.primaryDegree}
                          </span>
                        </div>

                        {/* Current Placement / Company for Alumni */}
                        {student.isAlumni && (student.currentCompany || student.currentRole) && (
                          <div className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                            <Briefcase className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">
                              {[student.currentRole, student.currentCompany].filter(Boolean).join(" @ ")}
                            </span>
                          </div>
                        )}

                        {/* Verification & Experience Stats */}
                        <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/50 text-[11px] font-mono">
                          <div>
                            <span className="text-[9.5px] text-muted-foreground block uppercase">Verified Credentials</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {student.verifiedCertsCount} / {student.totalCertsCount || student.verifiedCertsCount} verified
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-muted-foreground block uppercase">Industry Experience</span>
                            <span className="font-bold text-foreground">
                              {student.experienceCount > 0 ? `${student.experienceCount} roles` : "Entry-level"}
                            </span>
                          </div>
                        </div>

                        {/* Skills Chips */}
                        {student.skills && student.skills.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-mono text-muted-foreground uppercase tracking-wider block">
                              Verified Skills & Competencies:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {student.skills.slice(0, 4).map((sk) => (
                                <span
                                  key={sk}
                                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border text-foreground"
                                >
                                  {sk}
                                </span>
                              ))}
                              {student.skills.length > 4 && (
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-bold">
                                  +{student.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Email + View Profile Link */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-[10.5px] font-mono text-muted-foreground flex items-center gap-1 truncate max-w-[65%]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.institutionEmail || "Verified Campus Registry"}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-primary flex items-center gap-1 group-hover:underline shrink-0">
                          <span>View Profile</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* DESK 2: COHORT READINESS & CURRICULUM DEFICITS */}
        {/* ========================================================================= */}
        {activeTab === "cohort" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider block">
                    Total Cohort Tracked
                  </span>
                  <Users className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {telemetry?.totalStudents ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Active AISHE institutional candidates</p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider block">
                    Average Readiness Rating
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-primary font-mono tabular-nums">
                  {telemetry?.averageReadinessScore ?? 0}%
                </p>
                <p className="text-[11px] text-muted-foreground">Synthesized from competency profiles</p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider block">
                    Student Credentials
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {telemetry?.totalCertificationsSubmitted ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Certifications & licenses uploaded by cohort</p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider block">
                    Avg Skills Per Scholar
                  </span>
                  <Award className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {telemetry?.avgSkills ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Verified engineering competencies per candidate</p>
              </div>
            </div>

            {/* Two Column Grid: Top Skills Distribution + Curriculum Deficit Aggregation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort Skill Breakdown */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-2 uppercase font-mono">
                    <PieChart className="w-4 h-4 text-primary" />
                    Cohort Competency Distribution
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-bold border border-primary/20">
                    Live Aggregation
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {!telemetry?.topSkillsDistribution || telemetry.topSkillsDistribution.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No cohort skill data aggregated yet.
                    </div>
                  ) : (
                    telemetry.topSkillsDistribution.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-secondary/20 border border-border/60 hover:border-border transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-muted/60 border border-border text-foreground uppercase tracking-wide">
                            {item.skill}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs tabular-nums">
                            <strong className="text-foreground">{item.studentCount}</strong>{" "}
                            {item.studentCount === 1 ? "student" : "students"}{" "}
                            <span className="text-muted-foreground/80 font-semibold">({item.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-sm bg-muted/40 border border-border/40 overflow-hidden">
                          <div
                            className="h-full bg-primary/85 rounded-sm transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Curriculum Deficits vs Market Trends */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-2 uppercase font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Curriculum Deficits vs Live Industry Demand
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                    Remediation Target
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {!telemetry?.curriculumDeficits || telemetry.curriculumDeficits.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No curriculum deficits detected across active market opportunities.
                    </div>
                  ) : (
                    telemetry.curriculumDeficits.map((item, idx) => {
                      const isZeroDeficit = item.curriculumDeficitPercent === 0;
                      const isModerate = item.curriculumDeficitPercent > 0 && item.curriculumDeficitPercent <= 50;
                      const coveragePercent = Math.max(0, 100 - item.curriculumDeficitPercent);

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-md border space-y-2 transition-colors",
                            isZeroDeficit
                              ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40"
                              : isModerate
                              ? "bg-amber-500/[0.03] border-amber-500/20 hover:border-amber-500/40"
                              : "bg-rose-500/[0.03] border-rose-500/20 hover:border-rose-500/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-muted/60 border border-border text-foreground uppercase tracking-wide">
                              {item.skill}
                            </span>
                            {isZeroDeficit ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Fully Covered (0% Gap)
                              </span>
                            ) : isModerate ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3" /> Moderate Gap ({item.curriculumDeficitPercent}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-3 h-3" /> Critical Deficit ({item.curriculumDeficitPercent}%)
                              </span>
                            )}
                          </div>

                          {/* Dual-tone Coverage vs Gap bar */}
                          <div className="w-full h-2 rounded-sm bg-muted/40 border border-border/40 overflow-hidden flex">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                isZeroDeficit
                                  ? "bg-emerald-500 dark:bg-emerald-400"
                                  : coveragePercent > 0
                                  ? "bg-primary/80"
                                  : "bg-transparent"
                              )}
                              style={{ width: `${coveragePercent}%` }}
                              title={`Cohort Proficiency: ${coveragePercent}%`}
                            />
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                isZeroDeficit
                                  ? "bg-transparent"
                                  : "bg-rose-500/40 dark:bg-rose-500/50"
                              )}
                              style={{ width: `${item.curriculumDeficitPercent}%` }}
                              title={`Curriculum Gap: ${item.curriculumDeficitPercent}%`}
                            />
                          </div>

                          <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono pt-0.5 tabular-nums">
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3 text-muted-foreground/70" />
                              Market Demand:{" "}
                              <strong className="text-foreground font-semibold">
                                {item.marketDemandIndex} {item.marketDemandIndex === 1 ? "posting" : "postings"}
                              </strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-muted-foreground/70" />
                              Cohort:{" "}
                              <strong className="text-foreground font-semibold">
                                {item.cohortProficiencyCount} {item.cohortProficiencyCount === 1 ? "student" : "students"}
                              </strong>{" "}
                              proficient ({coveragePercent}%)
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DESK 3: POSTED OPPORTUNITIES & ENDORSEMENT DESK */}
        {/* ========================================================================= */}
        {activeTab === "endorsement" && (
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            {/* Header with Title & Audience Filter Pills */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Posted Opportunities & Institutional Endorsement Desk</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse live opportunities posted by industry partners. Endorse them to enrolled students or faculty with official university verified recognition.
                </p>
              </div>

              {/* Posted Audience Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-xl border border-border text-xs font-semibold self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setOppAudienceFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                    oppAudienceFilter === "all"
                      ? "bg-card text-foreground font-bold shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({opportunities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOppAudienceFilter("student")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    oppAudienceFilter === "student"
                      ? "bg-card text-foreground font-bold shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  <span>For Students</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOppAudienceFilter("faculty")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    oppAudienceFilter === "faculty"
                      ? "bg-card text-foreground font-bold shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                  <span>For Faculty</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={oppSearchQuery}
                  onChange={(e) => setOppSearchQuery(e.target.value)}
                  placeholder="Search opportunities by title, company, skills..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-secondary/40 border border-border text-xs focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                />
                {oppSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOppSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["all", "internship", "job", "hackathon", "workshop", "research", "fdp", "sabbatical"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOppCategoryFilter(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer capitalize whitespace-nowrap",
                      oppCategoryFilter === cat
                        ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                        : "bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
                    )}
                  >
                    {cat === "all" ? "All Categories" : cat === "fdp" ? "FDP" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Opportunities Cards Grid */}
            {filteredOpportunities.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No opportunities found.</p>
                <p>
                  {opportunities.length === 0
                    ? "No live opportunities posted on the platform yet."
                    : "No opportunities match the current audience, category, or search filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {filteredOpportunities.map((opp) => {
                  const isEndorsedStudents = (opp.recommendedToStudentsBy?.length || 0) > 0;
                  const isEndorsedFaculty = (opp.recommendedToFacultyBy?.length || 0) > 0;

                  return (
                    <div
                      key={opp._id}
                      className="bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold border border-primary/20">
                              {opp.category}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground font-semibold border border-border">
                              Target: {opp.targetAudience === "faculty" ? "Faculty" : opp.targetAudience === "both" ? "Students & Faculty" : "Students"}
                            </span>
                          </div>
                          {opp.stipendOrPrize && (
                            <span className="text-[11px] font-mono font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border">
                              {opp.stipendOrPrize}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-foreground tracking-tight leading-snug">
                            {opp.title}
                          </h3>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{opp.organization}</span>
                            {opp.location && (
                              <>
                                <span>•</span>
                                <span className="font-mono flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  {opp.location}
                                </span>
                              </>
                            )}
                            {opp.mode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-muted-foreground border border-border">
                                {opp.mode}
                              </span>
                            )}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {opp.description}
                        </p>

                        {/* Required Skills Chips */}
                        {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {opp.requiredSkills.slice(0, 4).map((sk, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border"
                              >
                                {sk}
                              </span>
                            ))}
                            {opp.requiredSkills.length > 4 && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                +{opp.requiredSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Endorsement Buttons */}
                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmRecommendModal({
                              oppId: opp._id,
                              oppTitle: opp.title,
                              organization: opp.organization,
                              target: "students",
                            })
                          }
                          disabled={recommendingId === opp._id}
                          className={cn(
                            "flex-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5",
                            isEndorsedStudents
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {isEndorsedStudents && <Check className="w-3.5 h-3.5" />}
                          <span>{isEndorsedStudents ? "Endorsed to Students" : "Endorse to Students"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmRecommendModal({
                              oppId: opp._id,
                              oppTitle: opp.title,
                              organization: opp.organization,
                              target: "faculty",
                            })
                          }
                          disabled={recommendingId === opp._id}
                          className={cn(
                            "flex-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                            isEndorsedFaculty
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                          )}
                        >
                          {isEndorsedFaculty && <Check className="w-3.5 h-3.5" />}
                          <span>{isEndorsedFaculty ? "Endorsed to Faculty" : "Endorse to Faculty"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* DESK: CAMPUS ANNOUNCEMENTS & BROADCASTS */}
        {/* ========================================================================= */}
        {activeTab === "announcements" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-2 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Campus Announcements & Official Broadcasts
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Broadcast communications directly into the notification feeds of verified enrolled students and affiliated faculty members.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20 shrink-0 self-start sm:self-auto">
                  {broadcasts.length} Broadcasts Dispatched
                </span>
              </div>

              {/* Feedback Toasts */}
              {broadcastSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{broadcastSuccessMsg}</span>
                </div>
              )}
              {broadcastErrorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>{broadcastErrorMsg}</span>
                </div>
              )}

              {/* Compose Announcement Form */}
              <form onSubmit={handleSendBroadcast} className="pt-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Announcement Title *
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Fall 2026 Campus Placement Registration Now Open"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/30 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Target Audience *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border">
                      <button
                        type="button"
                        onClick={() => setBroadcastAudience("all")}
                        className={cn(
                          "text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center",
                          broadcastAudience === "all"
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setBroadcastAudience("students")}
                        className={cn(
                          "text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center",
                          broadcastAudience === "students"
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Students
                      </button>
                      <button
                        type="button"
                        onClick={() => setBroadcastAudience("faculty")}
                        className={cn(
                          "text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center",
                          broadcastAudience === "faculty"
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Faculty
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Announcement Message *
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {broadcastMessage.length}/2000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter detailed notice, schedules, deadlines, or department instructions..."
                    required
                    maxLength={2000}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/30 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Notice will be dispatched to all verified{" "}
                    <strong className="text-foreground">
                      {broadcastAudience === "all"
                        ? "students & faculty"
                        : broadcastAudience === "students"
                        ? "enrolled students"
                        : "affiliated faculty"}
                    </strong>{" "}
                    under {profile?.institutionName || "your institution"}.
                  </p>
                  <button
                    type="submit"
                    disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {isBroadcasting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Broadcast Notice</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Broadcast History List */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Recent Campus Broadcasts
                </h3>
                <button
                  type="button"
                  onClick={fetchBroadcasts}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {isBroadcastsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs font-mono text-muted-foreground">Fetching broadcast history…</p>
                </div>
              ) : broadcasts.length === 0 ? (
                <div className="py-14 text-center border border-dashed border-border rounded-xl space-y-2 bg-secondary/10">
                  <Megaphone className="w-8 h-8 text-muted-foreground mx-auto opacity-70" />
                  <p className="text-xs font-bold text-foreground">No Campus Broadcasts Dispatched Yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Use the compose box above to announce deadlines, academic notices, or placement drives.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/80 border border-border rounded-xl overflow-hidden bg-background">
                  {broadcasts.map((b, idx) => (
                    <div key={idx} className="p-4 space-y-2 hover:bg-secondary/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-foreground">{b.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold capitalize">
                            Audience: {b.targetAudience === "all" ? "Students & Faculty" : b.targetAudience}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-bold text-foreground border border-border">
                            {b.recipientCount} recipient{b.recipientCount === 1 ? "" : "s"}
                          </span>
                          <span>•</span>
                          <span>{new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {b.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* DESK: CAMPUS & TECHNICAL COMMUNITY SPACES */}
        {/* ========================================================================= */}
        {activeTab === "community" && (
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Campus & Technical Enterprise Community Spaces
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Engage with your students, faculty, and industry partners in specialized technical chat rooms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateSpaceModal(true)}
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Community Space</span>
              </button>
            </div>

            {isSpacesLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-xs font-mono text-muted-foreground">Loading community channels…</p>
              </div>
            ) : spaces.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-border rounded-xl space-y-2.5 bg-secondary/10">
                <Users className="w-8 h-8 text-muted-foreground mx-auto opacity-70" />
                <p className="text-xs font-bold text-foreground">No Community Spaces Created Yet</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Click the button above to launch an institutional research channel or domain-specific study group.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {spaces.map((space) => (
                  <div
                    key={space._id}
                    className="p-4 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3.5 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                          {space.industry}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3 text-primary" />
                          <span>{space.memberCount} members</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-foreground tracking-tight">{space.name}</h3>
                      {space.focus && (
                        <p className="text-[11px] text-primary font-medium">Focus: {space.focus}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {space.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                      {space.isJoined ? (
                        <button
                          type="button"
                          onClick={() => setActiveChatSpace({ id: space._id, name: space.name, focus: space.focus })}
                          className="flex-1 text-xs font-bold py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Discussion</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinSpace(space._id)}
                          disabled={isJoiningSpaceId === space._id}
                          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isJoiningSpaceId === space._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Join Space</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Modal: Create Community Space */}
        {showCreateSpaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Create Campus Community Space
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSpace} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Space Name *</label>
                  <input
                    type="text"
                    value={newSpaceForm.name}
                    onChange={(e) => setNewSpaceForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Distributed Systems & Cloud Lab"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Industry / Domain *</label>
                    <input
                      type="text"
                      value={newSpaceForm.industry}
                      onChange={(e) => setNewSpaceForm((p) => ({ ...p, industry: e.target.value }))}
                      placeholder="e.g. Cloud Computing"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Focus Area</label>
                    <input
                      type="text"
                      value={newSpaceForm.focus}
                      onChange={(e) => setNewSpaceForm((p) => ({ ...p, focus: e.target.value }))}
                      placeholder="e.g. Kubernetes & Microservices"
                      className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Description *</label>
                  <textarea
                    rows={3}
                    value={newSpaceForm.description}
                    onChange={(e) => setNewSpaceForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the mandate, faculty leads, and topic scope of this technical group..."
                    required
                    className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateSpaceModal(false)}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSpace || !newSpaceForm.name.trim() || !newSpaceForm.description.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isCreatingSpace ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Create Channel</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Real-time Community Chat View */}
        {activeChatSpace && (
          <CommunityChatView
            spaceId={activeChatSpace.id}
            spaceName={activeChatSpace.name}
            focus={activeChatSpace.focus}
            currentUserId={profile?._id || "institution"}
            onClose={() => setActiveChatSpace(null)}
          />
        )}


        {/* Confirmation Modal for Recommending Opportunities */}
        {confirmRecommendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Confirm Institutional Endorsement
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Audience: {confirmRecommendModal.target === "students" ? "All Enrolled Students" : "All Affiliated Faculty"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRecommendModal(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  {confirmRecommendModal.oppTitle}
                </span>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>{confirmRecommendModal.organization}</span>
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to endorse this opportunity to all{" "}
                <strong className="text-foreground">
                  {confirmRecommendModal.target === "students" ? "enrolled students" : "faculty members"}
                </strong>{" "}
                affiliated with <strong>{profile?.institutionName || profile?.name || "your institution"}</strong>?
                Once confirmed, this opportunity will immediately appear with an official verified badge in their{" "}
                <strong className="text-primary">"Recommended by College"</strong> feed.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmRecommendModal(null)}
                  className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { oppId, target } = confirmRecommendModal;
                    setConfirmRecommendModal(null);
                    await handleRecommend(oppId, target);
                  }}
                  disabled={recommendingId === confirmRecommendModal.oppId}
                  className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                >
                  {recommendingId === confirmRecommendModal.oppId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Confirm & Endorse</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
