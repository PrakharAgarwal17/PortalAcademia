import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
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
  ShieldCheck,
  ShieldAlert,
  Check,
  Camera,
  GraduationCap,
  Briefcase,
  Award,
} from "lucide-react";
import SkillBadge from "./SkillBadge";
import SkillInput from "./SkillInput";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export interface UserProfileData {
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

  // Individual
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
    issuer?: string;
    credentialUrl?: string;
    upload?: string;
    isVerified?: boolean;
  }>;
  pastExperience?: Array<{
    _id?: string;
    title: string;
    organization?: string;
    timeline?: string;
    description?: string;
  }>;

  // Faculty specific
  designation?: string;
  department?: string;

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
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onProfileUpdated: (updatedProfile: any) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: UserProfileModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "edit">("overview");

  // Editable form state initialized from profile
  const [formData, setFormData] = useState<UserProfileData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Temporary item inputs for adding new education / experience / cert
  const [newEdu, setNewEdu] = useState({ education: "", course: "", timeline: "", description: "" });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const [newExp, setNewExp] = useState({ title: "", organization: "", timeline: "", description: "" });
  const [showAddExp, setShowAddExp] = useState(false);

  const [newCert, setNewCert] = useState({ title: "", issuer: "", credentialUrl: "" });
  const [showAddCert, setShowAddCert] = useState(false);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        ...profile,
        skills: profile.skills ? [...profile.skills] : [],
        education: profile.education ? [...profile.education] : [],
        certifications: profile.certifications ? [...profile.certifications] : [],
        pastExperience: profile.pastExperience ? [...profile.pastExperience] : [],
      });
    }
  }, [profile, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  const role = profile.accountType || "student";
  const isIndividual = role === "student" || role === "faculty";

  // ============================================================
  // Profile Completeness Calculation & Checklist
  // ============================================================
  interface ChecklistItem {
    id: string;
    label: string;
    isFilled: boolean;
    helper: string;
  }

  const checklist: ChecklistItem[] = [];

  checklist.push({
    id: "name",
    label: "Full Name / Organization Name",
    isFilled: Boolean(formData.name || formData.companyName || formData.institutionName),
    helper: "Primary identity on certificates and proposals",
  });

  checklist.push({
    id: "headline",
    label: "Professional Headline",
    isFilled: Boolean(formData.headline && formData.headline.trim().length > 3),
    helper: "Summarizes your current role or aspiration (e.g. 'Software Engineer | AI & Cloud')",
  });

  checklist.push({
    id: "email",
    label: "Institutional / Work Email",
    isFilled: Boolean(formData.institutionEmail || formData.officialEmail || formData.workEmail),
    helper: "Required for official domain verification",
  });

  checklist.push({
    id: "email_verified",
    label: "Email Domain Verification",
    isFilled: Boolean(formData.isEmailVerified),
    helper: formData.isEmailVerified ? "Verified with institutional OTP" : "Pending OTP validation",
  });

  checklist.push({
    id: "bio",
    label: "Bio / Professional Summary",
    isFilled: Boolean(formData.bio && formData.bio.trim().length > 10),
    helper: "Introduces your strengths to recruiters & peers",
  });

  checklist.push({
    id: "location",
    label: "Location (State / City)",
    isFilled: Boolean(formData.location && formData.location.trim()),
    helper: "Matches localized opportunities & hybrid roles",
  });

  if (isIndividual) {
    checklist.push({
      id: "skills",
      label: "Technical & Professional Skills",
      isFilled: Boolean(formData.skills && formData.skills.length >= 3),
      helper: `${formData.skills?.length || 0} skills added (3+ recommended)`,
    });

    checklist.push({
      id: "education",
      label: "Education Details",
      isFilled: Boolean(formData.education && formData.education.length > 0),
      helper: `${formData.education?.length || 0} degrees/courses recorded`,
    });

    checklist.push({
      id: "certifications",
      label: "Certifications & Credentials",
      isFilled: Boolean(formData.certifications && formData.certifications.length > 0),
      helper: `${formData.certifications?.length || 0} certifications listed`,
    });

    checklist.push({
      id: "experience",
      label: "Work / Internship Experience",
      isFilled: Boolean(formData.pastExperience && formData.pastExperience.length > 0),
      helper: `${formData.pastExperience?.length || 0} experiences listed`,
    });
  }

  checklist.push({
    id: "social",
    label: "LinkedIn / GitHub / Web Links",
    isFilled: Boolean(formData.linkedin || formData.github || formData.website || formData.officialWebsite),
    helper: "Allows external proof of work verification",
  });

  const filledCount = checklist.filter((item) => item.isFilled).length;
  const completionPercentage = Math.round((filledCount / checklist.length) * 100);
  const pendingItems = checklist.filter((item) => !item.isFilled);

  // ============================================================
  // Save Handler (PUT /api/profile)
  // ============================================================
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
      if (res.ok && data.success) {
        setSaveFeedback({ type: "success", text: "Profile details updated successfully!" });
        onProfileUpdated(data.profile || formData);
        setTimeout(() => setSaveFeedback(null), 3000);
      } else {
        setSaveFeedback({ type: "error", text: data.message || "Failed to update profile." });
      }
    } catch (err: any) {
      setSaveFeedback({ type: "error", text: err.message || "Network error while saving profile." });
    } finally {
      setIsSaving(false);
    }
  };

  // Skill Add / Remove helpers
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

  const defaultBanner =
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80";
  const activeBanner = formData.bannerImage?.trim() || defaultBanner;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* LINKEDIN-STYLE HERO SECTION (Banner + Overlapping PFP + Info) */}
        {/* ============================================================ */}
        <div className="relative bg-card border-b border-border">
          {/* 1. Cover / Banner Image */}
          <div className="relative w-full h-36 sm:h-48 bg-muted overflow-hidden group">
            <img
              src={activeBanner}
              alt="Profile Cover Banner"
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle Gradient Overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Close Button top-right */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer z-10 shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Quick Edit Banner trigger button on banner */}
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer z-10 shadow-md"
              title="Change cover photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Banner</span>
            </button>
          </div>

          {/* 2. Hero Content Bar: Overlapping Circular PFP + Action Buttons */}
          <div className="px-5 sm:px-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 gap-3">
              {/* Overlapping Circular PFP */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-card bg-card overflow-hidden shadow-xl flex items-center justify-center border border-border">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt={formData.name || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-2xl sm:text-3xl text-primary font-mono select-none">
                      {formData.name
                        ? formData.name.slice(0, 2).toUpperCase()
                        : role.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Edit PFP camera badge */}
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="absolute bottom-1 right-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title="Update profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons on Hero Right */}
              <div className="flex items-center gap-2 self-start sm:self-auto pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${formData._id || profile?._id || "me"}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
                  title="Open Dedicated Full Profile Page with Unique Route"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">Open Full Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                {formData.linkedin && (
                  <a
                    href={
                      formData.linkedin.startsWith("http")
                        ? formData.linkedin
                        : `https://${formData.linkedin}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                    title="Open LinkedIn"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                )}
              </div>
            </div>

            {/* 3. Primary Bio / Headline Metadata */}
            <div className="mt-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {formData.name ||
                    formData.companyName ||
                    formData.institutionName ||
                    "User Profile"}
                </h2>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-bold">
                  {role}
                </span>
                {formData.isEmailVerified ? (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 font-medium">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    Unverified
                  </span>
                )}
              </div>

              {/* Professional Headline */}
              <div className="flex items-center gap-2 group/modalhead">
                <p className="text-xs sm:text-sm font-medium text-foreground/90 leading-snug">
                  {formData.headline ? (
                    formData.headline
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add professional headline</span>
                    </button>
                  )}
                </p>
                {formData.headline && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="opacity-60 group-hover/modalhead:opacity-100 transition-opacity text-muted-foreground hover:text-primary cursor-pointer"
                    title="Edit headline"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Location & Organization Subtitle */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground pt-1">
                {(formData.institution ||
                  formData.institutionName ||
                  formData.companyName) && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {formData.institution ||
                        formData.institutionName ||
                        formData.companyName}
                    </span>
                  </div>
                )}

                {formData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{formData.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {formData.institutionEmail ||
                      formData.workEmail ||
                      formData.officialEmail ||
                      "Email pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completeness Strip */}
        <div className="px-5 sm:px-6 py-2.5 bg-secondary/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Profile Completeness
              </span>
              <span className="font-mono font-bold text-primary">
                {completionPercentage}% ({filledCount} of {checklist.length} items complete)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {pendingItems.length > 0 && (
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <AlertCircle className="w-3 h-3" />
              <span>{pendingItems.length} items missing</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-2 border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "text-xs font-semibold px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Overview</span>
          </button>

          {isIndividual && (
            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={cn(
                "text-xs font-semibold px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
                activeTab === "skills"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills ({formData.skills?.length || 0})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={cn(
              "text-xs font-semibold px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile &amp; Cover</span>
            {pendingItems.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {saveFeedback && (
          <div
            className={cn(
              "mx-4 sm:mx-5 mt-3 p-2.5 rounded-md text-xs font-medium flex items-center gap-2",
              saveFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}
          >
            {saveFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* TAB 1: OVERVIEW / FILLED DETAILS */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Missing Details Banner */}
              {pendingItems.length > 0 && (
                <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pending Profile Information
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Fill Now →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                    {pendingItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About / Summary Card */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5 text-primary" />
                    About / Professional Summary
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                  {formData.bio || (
                    <span className="italic text-muted-foreground">
                      No professional summary provided yet. Click &quot;Edit Profile &amp; Cover&quot; to highlight your skills, goals, and experiences.
                    </span>
                  )}
                </p>
              </div>

              {/* Basic Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Organization / Institution
                  </span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{formData.institution || formData.institutionName || formData.companyName || "Not set"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Location
                  </span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{formData.location || "Not specified"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Official Email
                  </span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{formData.institutionEmail || formData.officialEmail || formData.workEmail || "Not specified"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Portfolio &amp; External Presence
                  </span>
                  <div className="flex items-center gap-3 pt-0.5 text-foreground">
                    {formData.linkedin && (
                      <a
                        href={formData.linkedin.startsWith("http") ? formData.linkedin : `https://${formData.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> LinkedIn
                      </a>
                    )}
                    {formData.github && (
                      <a
                        href={formData.github.startsWith("http") ? formData.github : `https://${formData.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> GitHub
                      </a>
                    )}
                    {!formData.linkedin && !formData.github && (
                      <span className="text-muted-foreground italic text-xs">No external links added</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Preview Card */}
              {isIndividual && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Skills &amp; Technical Competencies ({formData.skills?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("skills")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Manage Skills →
                    </button>
                  </div>
                  {formData.skills && formData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.map((skill, idx) => (
                        <SkillBadge key={idx} skill={skill} size="sm" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No skills added yet. Use Simple Icons search in the Skills tab to add verified tags.
                    </p>
                  )}
                </div>
              )}

              {/* Education List Card */}
              {isIndividual && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      Education ({formData.education?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.education && formData.education.length > 0 ? (
                    <div className="space-y-3 divide-y divide-border/60">
                      {formData.education.map((edu, idx) => (
                        <div key={idx} className={cn("text-xs space-y-1", idx > 0 && "pt-3")}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{edu.education}</h4>
                              {edu.course && <p className="text-muted-foreground text-xs">{edu.course}</p>}
                            </div>
                            {edu.timeline && (
                              <span className="font-mono text-muted-foreground text-[11px] px-2 py-0.5 rounded bg-secondary shrink-0">
                                {edu.timeline}
                              </span>
                            )}
                          </div>
                          {edu.description && (
                            <p className="text-xs text-foreground/80 leading-relaxed pt-0.5">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No formal education records listed yet.</p>
                  )}
                </div>
              )}

              {/* Experience List Card */}
              {isIndividual && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Experience &amp; Sabbaticals ({formData.pastExperience?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.pastExperience && formData.pastExperience.length > 0 ? (
                    <div className="space-y-3 divide-y divide-border/60">
                      {formData.pastExperience.map((exp, idx) => (
                        <div key={idx} className={cn("text-xs space-y-1", idx > 0 && "pt-3")}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{exp.title}</h4>
                              {exp.organization && (
                                <p className="text-muted-foreground text-xs">
                                  {exp.organization}
                                </p>
                              )}
                            </div>
                            {exp.timeline && (
                              <span className="font-mono text-muted-foreground text-[11px] px-2 py-0.5 rounded bg-secondary shrink-0">
                                {exp.timeline}
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-xs text-foreground/80 leading-relaxed pt-0.5">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No past work experience recorded yet.</p>
                  )}
                </div>
              )}

              {/* Certifications List Card */}
              {isIndividual && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono">
                      <Award className="w-4 h-4 text-primary" />
                      Licenses &amp; Certifications ({formData.certifications?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.certifications && formData.certifications.length > 0 ? (
                    <div className="space-y-2.5">
                      {formData.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-secondary/30 border border-border text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 font-bold text-foreground text-sm">
                              <span>{cert.title}</span>
                              {cert.isVerified && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <ShieldCheck className="w-3 h-3" /> AISHE Verified
                                </span>
                              )}
                            </div>
                            {cert.issuer && (
                              <p className="text-muted-foreground text-xs mt-0.5">{cert.issuer}</p>
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
                              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 font-mono shrink-0 px-2.5 py-1 rounded-md bg-background border border-border hover:bg-secondary transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Show Credential</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No certifications uploaded yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SKILLS (WITH SIMPLE ICONS LIVE AUTOCOMPLETE) */}
          {activeTab === "skills" && isIndividual && (
            <div className="space-y-4">
              <div className="p-3.5 bg-secondary/30 rounded-lg border border-border space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Simple Icons Verified Skill Tagging
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search from over 3,450+ official technology brand logos. Selected skills display authentic brand icons, colors, and feed directly into PortalAcademia&apos;s candidate shortlisting match scores!
                </p>
              </div>

              <SkillInput
                skills={formData.skills || []}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                label="Manage Profile Skills"
                placeholder="Type skill name (e.g. React, Python, Docker, Node.js) and select…"
              />
            </div>
          )}

          {/* TAB 3: EDIT & FILL MISSING DETAILS */}
          {activeTab === "edit" && (
            <div className="space-y-5">
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Primary Identity, Headline &amp; Visuals
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Location (City, State)
                    </label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Professional Headline / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.headline || ""}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Full-Stack Developer | AI & Cloud Computing Enthusiast | IIT Bombay"
                    className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "🎓 CS Scholar | Full-Stack & Cloud Developer",
                      "🤖 AI & Deep Learning Researcher",
                      "💻 Open Source Contributor | MERN & Python",
                      "🚀 Aspiring Software Development Engineer",
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, headline: sug })}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border transition-colors text-left text-muted-foreground cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Appears directly under your name across searches, certificates, and LinkedIn-style card.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Profile Photo URL (PFP)
                    </label>
                    <input
                      type="text"
                      value={formData.profileImage || ""}
                      onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                      placeholder="https://images.unsplash.com/... or image link"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Banner Background Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.bannerImage || ""}
                      onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Quick Unsplash Banner Preset selector */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground block uppercase font-mono">
                    Popular Unsplash Desk Banners (Click to Apply):
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      {
                        name: "Minimalist Clean Desk",
                        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
                      },
                      {
                        name: "Modern Tech Workspace",
                        url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
                      },
                      {
                        name: "Deep Focus Navy Gradient",
                        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
                      },
                      {
                        name: "Coding Coffee Setup",
                        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerImage: preset.url })}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer",
                          formData.bannerImage === preset.url
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-secondary border-border text-foreground"
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Bio / Professional Summary
                  </label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Write a concise overview of your academic background, research interests, or technical aspirations…"
                    rows={3}
                    className="w-full text-xs p-3 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={formData.linkedin || ""}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={formData.github || ""}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Education Section */}
              {isIndividual && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Education History ({formData.education?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddEdu(!showAddEdu)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddEdu ? "Cancel" : "Add Education"}
                    </button>
                  </div>

                  {showAddEdu && (
                    <div className="p-3.5 rounded-lg border border-border bg-secondary/40 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newEdu.education}
                          onChange={(e) => setNewEdu({ ...newEdu, education: e.target.value })}
                          placeholder="Degree / Institution (e.g. B.Tech CSE, IIT Bombay)"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                        <input
                          type="text"
                          value={newEdu.timeline}
                          onChange={(e) => setNewEdu({ ...newEdu, timeline: e.target.value })}
                          placeholder="Timeline (e.g. 2022 - 2026)"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={newEdu.description}
                        onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })}
                        placeholder="Relevant coursework or academic honors"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newEdu.education.trim()) return;
                          setFormData({
                            ...formData,
                            education: [...(formData.education || []), newEdu],
                          });
                          setNewEdu({ education: "", course: "", timeline: "", description: "" });
                          setShowAddEdu(false);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      >
                        Save Education Entry
                      </button>
                    </div>
                  )}

                  {formData.education?.map((edu, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-secondary/30 border border-border text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{edu.education}</span>
                        {edu.timeline && <span className="font-mono text-muted-foreground ml-2 text-[10px]">({edu.timeline})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            education: formData.education?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience Section */}
              {isIndividual && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Experience &amp; Internships ({formData.pastExperience?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddExp(!showAddExp)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddExp ? "Cancel" : "Add Experience"}
                    </button>
                  </div>

                  {showAddExp && (
                    <div className="p-3.5 rounded-lg border border-border bg-secondary/40 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newExp.title}
                          onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                          placeholder="Role / Title (e.g. Machine Learning Intern)"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                        <input
                          type="text"
                          value={newExp.organization}
                          onChange={(e) => setNewExp({ ...newExp, organization: e.target.value })}
                          placeholder="Organization / Company"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={newExp.timeline}
                        onChange={(e) => setNewExp({ ...newExp, timeline: e.target.value })}
                        placeholder="Timeline (e.g. May 2024 - July 2024)"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                      />
                      <textarea
                        value={newExp.description}
                        onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                        placeholder="Key contributions and achievements"
                        rows={2}
                        className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newExp.title.trim()) return;
                          setFormData({
                            ...formData,
                            pastExperience: [...(formData.pastExperience || []), newExp],
                          });
                          setNewExp({ title: "", organization: "", timeline: "", description: "" });
                          setShowAddExp(false);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      >
                        Save Experience Entry
                      </button>
                    </div>
                  )}

                  {formData.pastExperience?.map((exp, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-secondary/30 border border-border text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{exp.title}</span>
                        {exp.organization && <span className="text-muted-foreground ml-2">at {exp.organization}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            pastExperience: formData.pastExperience?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications Section */}
              {isIndividual && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Certifications ({formData.certifications?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddCert(!showAddCert)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddCert ? "Cancel" : "Add Certificate"}
                    </button>
                  </div>

                  {showAddCert && (
                    <div className="p-3.5 rounded-lg border border-border bg-secondary/40 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newCert.title}
                          onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                          placeholder="Certificate Title (e.g. AWS Certified Cloud Practitioner)"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                        <input
                          type="text"
                          value={newCert.issuer}
                          onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                          placeholder="Issuing Authority (e.g. Amazon Web Services)"
                          className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={newCert.credentialUrl}
                        onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                        placeholder="Credential Verification URL"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCert.title.trim()) return;
                          setFormData({
                            ...formData,
                            certifications: [
                              ...(formData.certifications || []),
                              { ...newCert, isVerified: false },
                            ],
                          });
                          setNewCert({ title: "", issuer: "", credentialUrl: "" });
                          setShowAddCert(false);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      >
                        Save Certificate Entry
                      </button>
                    </div>
                  )}

                  {formData.certifications?.map((cert, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-secondary/30 border border-border text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{cert.title}</span>
                        {cert.issuer && <span className="text-muted-foreground ml-2">({cert.issuer})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            certifications: formData.certifications?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Details…</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
