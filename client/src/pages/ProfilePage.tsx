import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
  MapPin,
  Mail,
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Edit3,
  Camera,
  GraduationCap,
  Briefcase,
  Award,
  Check,
  Share2,
  RefreshCw,
  Palette,
  ShieldCheck,
} from "lucide-react";
import SkillBadge from "@/components/SkillBadge";
import SkillInput from "@/components/SkillInput";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/context/store";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

// Predefined high-quality Unsplash cover presets for academic/professional portfolios
const BANNER_PRESETS = [
  {
    name: "Modern Tech & Design",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Architectural Minimalist",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Deep Gradient Workspace",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Abstract Neon Circuits",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "University Quad & Campus",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Clean Geometric Dark",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
  },
];

export const HEADLINE_SUGGESTIONS: Record<string, string[]> = {
  student: [
    "Computer Science Scholar | Full-Stack Web & App Developer",
    "AI & Machine Learning Enthusiast | Python & PyTorch",
    "Aspiring Software Development Engineer | Open Source Contributor",
    "Data Science & Analytics Explorer | SQL, Python & Tableau",
    "Cloud & DevOps Enthusiast | Docker, Kubernetes & AWS",
  ],
  faculty: [
    "Assistant Professor | Computer Science & Engineering",
    "Academic Researcher & Mentor | Artificial Intelligence & NLP",
    "Associate Professor & Department Research Coordinator",
    "Senior Faculty Scholar | Data Structures & Algorithms",
  ],
  industry: [
    "Technical Talent Acquisition Partner | Campus Hiring",
    "Engineering Manager & University Relations Partner",
    "Senior HR Business Partner | Early Career Programs",
  ],
  institution: [
    "Center for Academic Excellence & Research Innovation",
    "Leading Autonomous Engineering & Research Institution",
  ],
};

export interface ProfileData {
  _id?: string;
  userId?: string;
  name?: string;
  headline?: string;
  category?: "individual" | "organization" | string;
  accountType?: "student" | "faculty" | "institution" | "industry" | string;
  profileImage?: string;
  bannerImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;

  // Individual fields
  institution?: string;
  institutionName?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  skills?: string[];
  education?: Array<{
    education: string;
    course?: string;
    description?: string;
    timeline?: string;
  }>;
  certifications?: Array<{
    _id?: string;
    title: string;
    description?: string;
    issuer?: string;
    credentialUrl?: string;
    upload?: string;
    isVerified?: boolean;
    verificationNotes?: string;
  }>;
  pastExperience?: Array<{
    _id?: string;
    title: string;
    organization?: string;
    timeline?: string;
    description?: string;
    isVerified?: boolean;
  }>;

  // Faculty specific
  designation?: string;
  department?: string;
  expertise?: string[];
  researchInterests?: string[];

  // Institution specific
  aisheCode?: string;
  officialEmail?: string;
  contact?: string;

  // Industry specific
  companyName?: string;
  industryType?: string;
  officialWebsite?: string;
  workEmail?: string;
  employees?: string;

  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);

  // Tab: overview, skills, edit
  const initialTab = searchParams.get("edit") === "true" ? "edit" : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "edit">(initialTab);

  // Sub-items draft state for Add Education, Experience, Certification
  const [newEdu, setNewEdu] = useState({ education: "", course: "", timeline: "", description: "" });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const [newExp, setNewExp] = useState({ title: "", organization: "", timeline: "", description: "" });
  const [showAddExp, setShowAddExp] = useState(false);

  const [newCert, setNewCert] = useState({ title: "", issuer: "", credentialUrl: "", description: "" });
  const [showAddCert, setShowAddCert] = useState(false);

  // Quick inline headline editor state
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState("");
  const [isSavingHeadline, setIsSavingHeadline] = useState(false);

  // Quick save headline directly to database
  const handleSaveHeadline = async (newHeadline: string) => {
    setIsSavingHeadline(true);
    try {
      const updated = { ...formData, headline: newHeadline.trim() };
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok && data.success && data.profile) {
        setProfile(data.profile);
        setFormData(data.profile);
        setIsEditingHeadline(false);
        setSaveFeedback({ type: "success", text: "Headline saved to database!" });
        setTimeout(() => setSaveFeedback(null), 3000);
      } else {
        setSaveFeedback({ type: "error", text: data.message || "Failed to update headline." });
      }
    } catch (err: any) {
      setSaveFeedback({ type: "error", text: err.message || "Network error while saving headline." });
    } finally {
      setIsSavingHeadline(false);
    }
  };

  // Sync tab with query param
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setActiveTab("edit");
    }
  }, [searchParams]);

  // Determine if this profile belongs to current logged-in user
  const isOwnProfile = useMemo(() => {
    if (!profile) return false;
    if (id === "me") return true;
    const currentUserId = user?.id || user?._id;
    if (currentUserId && (profile.userId === currentUserId || profile._id === currentUserId)) {
      return true;
    }
    return false;
  }, [profile, id, user]);

  // Fetch profile from database (MongoDB)
  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      // If route is /profile or /profile/me or has specific id
      const targetId = id || "me";
      const endpoint = targetId === "me" ? `${API_BASE}/api/profile/me` : `${API_BASE}/api/profile/${targetId}`;

      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success && data.profile) {
        setProfile(data.profile);
        setFormData({
          ...data.profile,
          skills: data.profile.skills ? [...data.profile.skills] : [],
          education: data.profile.education ? [...data.profile.education] : [],
          certifications: data.profile.certifications ? [...data.profile.certifications] : [],
          pastExperience: data.profile.pastExperience ? [...data.profile.pastExperience] : [],
        });

        // If visited /profile or /profile/me directly, update route URL to display the unique ID
        if ((!id || id === "me") && data.profile._id) {
          navigate(`/profile/${data.profile._id}`, { replace: true });
        }
      } else {
        // Fallback: If not found by custom ID, attempt /api/profile/me if it's the current user
        if (targetId !== "me") {
          const fallbackRes = await fetch(`${API_BASE}/api/profile/me`, {
            method: "GET",
            credentials: "include",
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok && fallbackData.success && fallbackData.profile) {
            setProfile(fallbackData.profile);
            setFormData(fallbackData.profile);
            navigate(`/profile/${fallbackData.profile._id}`, { replace: true });
            return;
          }
        }
        setFetchError(data.message || "Could not find profile in database");
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to communicate with database");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Completeness checklist
  const role = profile?.accountType || formData.accountType || "student";
  const isIndividual = role === "student" || role === "faculty";

  interface ChecklistItem {
    id: string;
    label: string;
    isFilled: boolean;
    helper: string;
  }

  const checklist: ChecklistItem[] = [
    {
      id: "name",
      label: "Full Name / Organization Name",
      isFilled: Boolean(formData.name || formData.companyName || formData.institutionName),
      helper: "Primary identity on credentials and records",
    },
    {
      id: "headline",
      label: "Professional Headline",
      isFilled: Boolean(formData.headline && formData.headline.trim().length > 3),
      helper: "Highlights your specialty or role under your name",
    },
    {
      id: "email",
      label: "Institutional / Official Email",
      isFilled: Boolean(formData.institutionEmail || formData.officialEmail || formData.workEmail),
      helper: "Required for verified domain authenticity",
    },
    {
      id: "email_verified",
      label: "Domain Verification",
      isFilled: Boolean(formData.isEmailVerified),
      helper: formData.isEmailVerified ? "Verified with OTP" : "Pending institutional OTP",
    },
    {
      id: "bio",
      label: "Bio / Summary",
      isFilled: Boolean(formData.bio && formData.bio.trim().length > 10),
      helper: "Introduces your background and interests",
    },
    {
      id: "location",
      label: "Location",
      isFilled: Boolean(formData.location && formData.location.trim()),
      helper: "Assists in matching local opportunities",
    },
  ];

  if (isIndividual) {
    checklist.push(
      {
        id: "skills",
        label: "Skills & Simple Icons",
        isFilled: Boolean(formData.skills && formData.skills.length >= 3),
        helper: `${formData.skills?.length || 0} skills registered`,
      },
      {
        id: "education",
        label: "Education Timeline",
        isFilled: Boolean(formData.education && formData.education.length > 0),
        helper: `${formData.education?.length || 0} degrees/courses recorded`,
      },
      {
        id: "certifications",
        label: "Certifications",
        isFilled: Boolean(formData.certifications && formData.certifications.length > 0),
        helper: `${formData.certifications?.length || 0} credentials added`,
      },
      {
        id: "experience",
        label: "Work / Projects",
        isFilled: Boolean(formData.pastExperience && formData.pastExperience.length > 0),
        helper: `${formData.pastExperience?.length || 0} experiences listed`,
      }
    );
  }

  checklist.push({
    id: "social",
    label: "LinkedIn / GitHub Presence",
    isFilled: Boolean(formData.linkedin || formData.github || formData.website || formData.officialWebsite),
    helper: "Enables public proof of work",
  });

  const filledCount = checklist.filter((item) => item.isFilled).length;
  const completionPercentage = Math.round((filledCount / checklist.length) * 100);
  const pendingItems = checklist.filter((item) => !item.isFilled);

  // Save changes to Database (PUT /api/profile)
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.profile) {
        setProfile(data.profile);
        setFormData(data.profile);
        setSaveFeedback({ type: "success", text: "Database updated successfully! All changes are live." });
        setSearchParams({}); // remove ?edit=true
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        setSaveFeedback({ type: "error", text: data.message || "Failed to update profile in database." });
      }
    } catch (err: any) {
      setSaveFeedback({ type: "error", text: err.message || "Network error while saving profile." });
    } finally {
      setIsSaving(false);
    }
  };

  // Skill Add / Remove
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (formData.skills?.includes(trimmed)) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), trimmed],
    }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  // Copy Profile Link
  const handleCopyProfileLink = () => {
    const url = window.location.href.split("?")[0];
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const defaultBanner =
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80";
  const activeBanner = (formData.bannerImage || profile?.bannerImage)?.trim() || defaultBanner;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-primary" />
          <p className="text-sm font-mono text-muted-foreground">
            Connecting to database and retrieving profile details…
          </p>
        </div>
      </div>
    );
  }

  if (fetchError || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {fetchError || "The requested profile unique ID does not exist or has been removed from the database."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={fetchProfileData}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 text-foreground pb-16">
      {/* ============================================================ */}
      {/* TOP HEADER NAVIGATION BAR */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            <span className="text-border">|</span>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="hidden sm:inline">PortalAcademia</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-xs">
                {profile.name || "Profile"}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                ID: {profile._id?.slice(-6)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share / Copy Profile URL */}
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
              title="Copy public profile link"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Share Profile</span>
                </>
              )}
            </button>

            {/* Edit / View Toggle */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "edit") {
                    setActiveTab("overview");
                    setSearchParams({});
                  } else {
                    setActiveTab("edit");
                    setSearchParams({ edit: "true" });
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs",
                  activeTab === "edit"
                    ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{activeTab === "edit" ? "View Profile" : "Edit Profile"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER */}
      {/* ============================================================ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Save Feedback Banner */}
        {saveFeedback && (
          <div
            className={cn(
              "p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-300",
              saveFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}
          >
            <div className="flex items-center gap-2">
              {saveFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              )}
              <span>{saveFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* LINKEDIN-STYLE HERO CARD (Cover + Overlapping Avatar + Info) */}
        {/* ============================================================ */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
          {/* Cover Banner */}
          <div className="relative w-full h-44 sm:h-64 bg-muted overflow-hidden group">
            <img
              src={activeBanner}
              alt="Profile Cover Banner"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Change Cover Photo Trigger */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBannerPicker(!showBannerPicker)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Curated Banners</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("edit");
                    setSearchParams({ edit: "true" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Custom Banner URL</span>
                </button>
              </div>
            )}

            {/* Banner Quick Picker Dropdown */}
            {showBannerPicker && isOwnProfile && (
              <div className="absolute top-14 right-4 z-30 w-80 bg-card border border-border rounded-xl shadow-2xl p-3 space-y-2 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Select Unsplash Cover
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBannerPicker(false)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                  {BANNER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, bannerImage: preset.url }));
                        setShowBannerPicker(false);
                      }}
                      className="group/item relative h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-all text-left"
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform"
                      />
                      <span className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] font-semibold text-white leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center">
                  Tip: Remember to click &quot;Save Changes&quot; to persist in MongoDB.
                </p>
              </div>
            )}
          </div>

          {/* Hero Content Section */}
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
              {/* Overlapping Avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-card bg-card overflow-hidden shadow-2xl flex items-center justify-center border-2 border-border/80">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt={formData.name || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 flex items-center justify-center font-bold text-3xl sm:text-4xl text-primary font-mono select-none">
                      {formData.name
                        ? formData.name.slice(0, 2).toUpperCase()
                        : role.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("edit");
                      setSearchParams({ edit: "true" });
                    }}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons on Hero Right */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("edit");
                        setSearchParams({ edit: "true" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("skills")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Manage Skills</span>
                    </button>
                  </>
                ) : (
                  <div className="text-xs font-mono px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                    Public Verified Profile
                  </div>
                )}
              </div>
            </div>

            {/* Profile Identity & Headline */}
            <div className="mt-4 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {formData.name ||
                    formData.companyName ||
                    formData.institutionName ||
                    "PortalAcademia Member"}
                </h1>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("edit");
                      setSearchParams({ edit: "true" });
                    }}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                  {role}
                </span>
                {formData.isEmailVerified && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Stakeholder
                  </span>
                )}
              </div>

              {/* Headline */}
              {isOwnProfile && isEditingHeadline ? (
                <div className="p-3.5 rounded-xl bg-card border-2 border-primary/40 shadow-md space-y-3 mt-2 max-w-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      {formData.headline ? "Edit Professional Headline" : "Add Professional Headline"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {headlineDraft.length}/120
                    </span>
                  </div>

                  <input
                    type="text"
                    value={headlineDraft}
                    onChange={(e) => setHeadlineDraft(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Computer Science Student | React & Python Developer | Aspiring SDE"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    autoFocus
                  />

                  {/* Suggestion Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold block">
                      Quick Suggestions (Click to apply):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(HEADLINE_SUGGESTIONS[role] || HEADLINE_SUGGESTIONS.student).map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHeadlineDraft(sug)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border transition-colors text-left text-muted-foreground cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsEditingHeadline(false)}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveHeadline(headlineDraft)}
                      disabled={isSavingHeadline}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSavingHeadline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Headline</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 pt-0.5 group/head">
                  <p className="text-sm sm:text-base font-medium text-foreground/90 max-w-3xl leading-relaxed">
                    {formData.headline ? (
                      formData.headline
                    ) : isOwnProfile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHeadlineDraft(formData.headline || "");
                          setIsEditingHeadline(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add professional headline</span>
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {role === "student"
                          ? "Aspiring Engineer | Tech Explorer | Student at PortalAcademia"
                          : role === "faculty"
                          ? "Academic Scholar, Mentor & Institutional Researcher"
                          : role === "industry"
                          ? "Industry Innovator & Talent Partner"
                          : "Higher Education Leader"}
                      </span>
                    )}
                  </p>

                  {isOwnProfile && formData.headline && (
                    <button
                      type="button"
                      onClick={() => {
                        setHeadlineDraft(formData.headline || "");
                        setIsEditingHeadline(true);
                      }}
                      className="opacity-70 group-hover/head:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary cursor-pointer shrink-0"
                      title="Edit headline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Metadata strip */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1.5">
                {(formData.institution ||
                  formData.institutionName ||
                  formData.companyName) && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">
                      {formData.institution ||
                        formData.institutionName ||
                        formData.companyName}
                    </span>
                  </div>
                )}

                {formData.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{formData.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[220px]">
                    {formData.institutionEmail ||
                      formData.workEmail ||
                      formData.officialEmail ||
                      "Institutional email unrecorded"}
                  </span>
                </div>

                {formData.linkedin && (
                  <a
                    href={formData.linkedin.startsWith("http") ? formData.linkedin : `https://${formData.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    LinkedIn
                  </a>
                )}

                {formData.github && (
                  <a
                    href={formData.github.startsWith("http") ? formData.github : `https://${formData.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    GitHub
                  </a>
                )}

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("edit");
                      setSearchParams({ edit: "true" });
                    }}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
                    title="Edit Location, Institution & Social Links"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Metadata</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completeness Strip */}
          <div className="px-5 sm:px-8 py-3 bg-secondary/30 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Profile Completeness Score
                </span>
                <span className="font-mono font-bold text-primary">
                  {completionPercentage}% ({filledCount}/{checklist.length} completed)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {isOwnProfile && pendingItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                  setSearchParams({ edit: "true" });
                }}
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingItems.length} items missing • Complete now</span>
              </button>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* TABS HEADER */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "text-xs sm:text-sm font-semibold px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-4 h-4" />
            <span>Overview</span>
          </button>

          {isIndividual && (
            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={cn(
                "text-xs sm:text-sm font-semibold px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
                activeTab === "skills"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>Skills ({formData.skills?.length || 0})</span>
            </button>
          )}

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={cn(
                "text-xs sm:text-sm font-semibold px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
                activeTab === "edit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Edit3 className="w-4 h-4" />
              <span>Update Profile &amp; Cover</span>
              {pendingItems.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB CONTENT: 1. OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Missing Info Alert for Own Profile */}
            {isOwnProfile && pendingItems.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Pending Profile Information
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Complete In Editor →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About / Summary */}
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
                  <User className="w-4 h-4 text-primary" />
                  About
                </h3>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Edit Bio
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {formData.bio || (
                  <span className="italic text-muted-foreground">
                    No bio provided yet. Add an overview of your academic background, special projects, and passions.
                  </span>
                )}
              </p>
            </div>

            {/* Skills Showcase */}
            {isIndividual && (
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Skills &amp; Simple Icons ({formData.skills?.length || 0})
                  </h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("skills")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Manage All Skills →
                    </button>
                  )}
                </div>
                {formData.skills && formData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.skills.map((skill, idx) => (
                      <SkillBadge key={idx} skill={skill} size="md" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No verified skills listed yet. Head to the Skills tab to pick from over 3,000 brand icons!
                  </p>
                )}
              </div>
            )}

            {/* Education Timeline */}
            {isIndividual && (
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Education ({formData.education?.length || 0})
                  </h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add Education
                    </button>
                  )}
                </div>
                {formData.education && formData.education.length > 0 ? (
                  <div className="space-y-4 divide-y divide-border/60">
                    {formData.education.map((edu, idx) => (
                      <div key={idx} className={cn("text-xs space-y-1.5", idx > 0 && "pt-4")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{edu.education}</h4>
                            {edu.course && <p className="text-muted-foreground text-xs font-medium">{edu.course}</p>}
                          </div>
                          {edu.timeline && (
                            <span className="font-mono text-muted-foreground text-[11px] px-2.5 py-1 rounded-md bg-secondary shrink-0 border border-border">
                              {edu.timeline}
                            </span>
                          )}
                        </div>
                        {edu.description && (
                          <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No education entries recorded.</p>
                )}
              </div>
            )}

            {/* Past Experience Timeline */}
            {isIndividual && (
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Experience &amp; Industry Internships ({formData.pastExperience?.length || 0})
                  </h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add Experience
                    </button>
                  )}
                </div>
                {formData.pastExperience && formData.pastExperience.length > 0 ? (
                  <div className="space-y-4 divide-y divide-border/60">
                    {formData.pastExperience.map((exp, idx) => (
                      <div key={idx} className={cn("text-xs space-y-1.5", idx > 0 && "pt-4")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{exp.title}</h4>
                            {exp.organization && (
                              <p className="text-muted-foreground text-xs font-medium">{exp.organization}</p>
                            )}
                          </div>
                          {exp.timeline && (
                            <span className="font-mono text-muted-foreground text-[11px] px-2.5 py-1 rounded-md bg-secondary shrink-0 border border-border">
                              {exp.timeline}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No work or research experiences added yet.</p>
                )}
              </div>
            )}

            {/* Certifications Card */}
            {isIndividual && (
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
                    <Award className="w-4 h-4 text-primary" />
                    Certifications &amp; Licenses ({formData.certifications?.length || 0})
                  </h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add Certificate
                    </button>
                  )}
                </div>
                {formData.certifications && formData.certifications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-secondary/30 border border-border flex flex-col justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-foreground text-xs leading-snug">{cert.title}</h4>
                            {cert.isVerified && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          {cert.issuer && (
                            <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                          )}
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={
                              cert.credentialUrl.startsWith("http")
                                ? cert.credentialUrl
                                : `https://${cert.credentialUrl}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold pt-1"
                          >
                            <ExternalLink className="w-3 h-3" /> View Credential
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No verified certificates uploaded yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT: 2. SKILLS (SIMPLE ICONS) */}
        {/* ============================================================ */}
        {activeTab === "skills" && isIndividual && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Verified Skills Catalog (Powered by Simple Icons)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Search from over 3,000 official brand SVG icons with authentic brand colors and tags.
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Skills to Database</span>
                  </button>
                )}
              </div>

              {/* Skill Input Component with live Simple Icons Autocomplete */}
              {isOwnProfile && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    Search &amp; Add New Skill
                  </label>
                  <SkillInput
                    skills={formData.skills || []}
                    onAddSkill={handleAddSkill}
                    onRemoveSkill={handleRemoveSkill}
                    placeholder="Search e.g. Python, Docker, Next.js, TensorFlow, Kubernetes…"
                    showPopularSuggestions={true}
                  />
                </div>
              )}

              {/* Current Active Skills */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    Your Registered Skills ({formData.skills?.length || 0})
                  </h4>
                  {isOwnProfile && formData.skills && formData.skills.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Click the &times; on any badge to remove
                    </span>
                  )}
                </div>

                {formData.skills && formData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 p-4 rounded-xl bg-secondary/20 border border-border min-h-[80px]">
                    {formData.skills.map((skill, idx) => (
                      <SkillBadge
                        key={idx}
                        skill={skill}
                        size="md"
                        onRemove={isOwnProfile ? () => handleRemoveSkill(skill) : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-secondary/20 border border-dashed border-border text-muted-foreground text-xs">
                    No skills added yet. Type in the search box above to add your first skill!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT: 3. EDIT & UPDATE PROFILE */}
        {/* ============================================================ */}
        {activeTab === "edit" && isOwnProfile && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-6 shadow-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    Update Profile Details
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All inputs below are validated and synchronized directly with your MongoDB document.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save All Changes to DB</span>
                </button>
              </div>

              {/* 1. Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                  1. Identity &amp; Headline
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Account Role</label>
                    <input
                      type="text"
                      disabled
                      value={formData.accountType || role}
                      className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground cursor-not-allowed font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Professional Headline
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(formData.headline || "").length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={formData.headline || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, headline: e.target.value }))}
                    placeholder="e.g. Computer Science Undergrad | React & Node.js Developer | Open Source Contributor"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {/* Suggestion Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold block">
                      Quick Suggestions (Click to insert):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(HEADLINE_SUGGESTIONS[role] || HEADLINE_SUGGESTIONS.student).map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, headline: sug }))}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border transition-colors text-left text-muted-foreground cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Appears directly under your name on profile searches, certificates, and proposals.
                  </p>
                </div>
              </div>

              {/* 2. Visual Assets (Banner & Avatar) */}
              <div className="space-y-4 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                  2. Visual Assets (Cover Banner &amp; Avatar)
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Banner / Cover Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.bannerImage || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, bannerImage: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBannerPicker(true)}
                      className="px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 border border-border cursor-pointer shrink-0"
                    >
                      Presets
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Profile Picture / Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.profileImage || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, profileImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-... or Cloudinary link"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* 3. Bio & Location */}
              <div className="space-y-4 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                  3. About Summary &amp; Location
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">About / Bio</label>
                  <textarea
                    rows={4}
                    value={formData.bio || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Write a comprehensive summary of your strengths, academic milestones, and future aspirations…"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Location</label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Bengaluru, Karnataka, India"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Personal / Portfolio Website</label>
                    <input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                      placeholder="https://yourportfolio.dev"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={formData.linkedin || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">GitHub Profile URL</label>
                    <input
                      type="text"
                      value={formData.github || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, github: e.target.value }))}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Education Manager */}
              {isIndividual && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                      4. Education Entries ({formData.education?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddEdu(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Degree / Course
                    </button>
                  </div>

                  {showAddEdu && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                      <h5 className="text-xs font-bold text-foreground">New Education Record</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Institution / University *"
                          value={newEdu.education}
                          onChange={(e) => setNewEdu((p) => ({ ...p, education: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Degree / Course (e.g. B.Tech CSE)"
                          value={newEdu.course}
                          onChange={(e) => setNewEdu((p) => ({ ...p, course: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Timeline (e.g. 2022 - 2026)"
                          value={newEdu.timeline}
                          onChange={(e) => setNewEdu((p) => ({ ...p, timeline: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Relevant coursework or academic honors…"
                        value={newEdu.description}
                        onChange={(e) => setNewEdu((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewEdu({ education: "", course: "", timeline: "", description: "" });
                            setShowAddEdu(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newEdu.education.trim()) return;
                            setFormData((prev) => ({
                              ...prev,
                              education: [...(prev.education || []), { ...newEdu }],
                            }));
                            setNewEdu({ education: "", course: "", timeline: "", description: "" });
                            setShowAddEdu(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                        >
                          Add to List
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.education && formData.education.length > 0 ? (
                    <div className="space-y-2">
                      {formData.education.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{item.education}</span>
                            {item.course && <span className="text-muted-foreground"> — {item.course}</span>}
                            {item.timeline && (
                              <span className="font-mono text-muted-foreground ml-2">({item.timeline})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                education: prev.education?.filter((_, i) => i !== idx),
                              }))
                            }
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No education records added yet.</p>
                  )}
                </div>
              )}

              {/* 5. Experience Manager */}
              {isIndividual && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                      5. Work Experience &amp; Projects ({formData.pastExperience?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddExp(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Experience
                    </button>
                  </div>

                  {showAddExp && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                      <h5 className="text-xs font-bold text-foreground">New Experience / Project</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Role / Title *"
                          value={newExp.title}
                          onChange={(e) => setNewExp((p) => ({ ...p, title: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Organization / Company"
                          value={newExp.organization}
                          onChange={(e) => setNewExp((p) => ({ ...p, organization: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Timeline (e.g. Jun 2024 - Present)"
                          value={newExp.timeline}
                          onChange={(e) => setNewExp((p) => ({ ...p, timeline: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Key responsibilities and achievements…"
                        value={newExp.description}
                        onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewExp({ title: "", organization: "", timeline: "", description: "" });
                            setShowAddExp(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newExp.title.trim()) return;
                            setFormData((prev) => ({
                              ...prev,
                              pastExperience: [...(prev.pastExperience || []), { ...newExp }],
                            }));
                            setNewExp({ title: "", organization: "", timeline: "", description: "" });
                            setShowAddExp(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                        >
                          Add to List
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.pastExperience && formData.pastExperience.length > 0 ? (
                    <div className="space-y-2">
                      {formData.pastExperience.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{item.title}</span>
                            {item.organization && (
                              <span className="text-muted-foreground"> — {item.organization}</span>
                            )}
                            {item.timeline && (
                              <span className="font-mono text-muted-foreground ml-2">({item.timeline})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                pastExperience: prev.pastExperience?.filter((_, i) => i !== idx),
                              }))
                            }
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No experience records added yet.</p>
                  )}
                </div>
              )}

              {/* 6. Certifications Manager */}
              {isIndividual && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                      6. Certifications &amp; Credentials ({formData.certifications?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddCert(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Certificate
                    </button>
                  </div>

                  {showAddCert && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                      <h5 className="text-xs font-bold text-foreground">New Certification</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Certificate Title *"
                          value={newCert.title}
                          onChange={(e) => setNewCert((p) => ({ ...p, title: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Issuer (e.g. AWS, Coursera)"
                          value={newCert.issuer}
                          onChange={(e) => setNewCert((p) => ({ ...p, issuer: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                        <input
                          type="url"
                          placeholder="Credential Verification URL"
                          value={newCert.credentialUrl}
                          onChange={(e) => setNewCert((p) => ({ ...p, credentialUrl: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewCert({ title: "", issuer: "", credentialUrl: "", description: "" });
                            setShowAddCert(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCert.title.trim()) return;
                            setFormData((prev) => ({
                              ...prev,
                              certifications: [...(prev.certifications || []), { ...newCert }],
                            }));
                            setNewCert({ title: "", issuer: "", credentialUrl: "", description: "" });
                            setShowAddCert(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                        >
                          Add to List
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.certifications && formData.certifications.length > 0 ? (
                    <div className="space-y-2">
                      {formData.certifications.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{item.title}</span>
                            {item.issuer && <span className="text-muted-foreground"> — {item.issuer}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                certifications: prev.certifications?.filter((_, i) => i !== idx),
                              }))
                            }
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No certifications added yet.</p>
                  )}
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    setSearchParams({});
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save All Changes to MongoDB</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
