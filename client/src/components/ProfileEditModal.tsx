import { useState, useEffect } from "react";
import { X, Check, Loader2, Edit3, ShieldCheck, ShieldAlert, Mail } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { closeEditModal } from "@/context/profileSlice";
import SkillInput from "@/components/SkillInput";
import { HEADLINE_SUGGESTIONS, type ProfileData } from "@/pages/ProfilePage";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

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
    name: "University Quad & Campus",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
  },
];

interface ProfileEditModalProps {
  profileData: ProfileData;
  onSaveSuccess: (updated: ProfileData) => void;
}

export default function ProfileEditModal({ profileData, onSaveSuccess }: ProfileEditModalProps) {
  const dispatch = useAppDispatch();
  const { activeSection, editingIndex, isModalOpen } = useAppSelector((state) => state.profile);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local draft states
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [educationList, setEducationList] = useState<ProfileData["education"]>([]);
  const [eduDraft, setEduDraft] = useState({ education: "", course: "", timeline: "", description: "" });
  const [experienceList, setExperienceList] = useState<ProfileData["pastExperience"]>([]);
  const [expDraft, setExpDraft] = useState({ title: "", organization: "", timeline: "", description: "" });
  const [certificationsList, setCertificationsList] = useState<ProfileData["certifications"]>([]);
  const [certDraft, setCertDraft] = useState({ title: "", issuer: "", credentialUrl: "", description: "" });

  // Role params state
  const [roleParams, setRoleParams] = useState({
    institutionName: "",
    institutionEmail: "",
    designation: "",
    department: "",
    expertise: [] as string[],
    researchInterests: [] as string[],
    companyName: "",
    industryType: "",
    officialWebsite: "",
    workEmail: "",
    employees: "",
    aisheCode: "",
    officialEmail: "",
    contact: "",
  });
  const [newResearchInput, setNewResearchInput] = useState("");

  // OTP Verification state for roleParams
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showOtpWidget, setShowOtpWidget] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(profileData.isEmailVerified));

  useEffect(() => {
    setIsEmailVerified(Boolean(profileData.isEmailVerified));
  }, [profileData.isEmailVerified]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendModalOtp = async (emailToVerify: string) => {
    const trimmed = emailToVerify.trim();
    if (!trimmed) {
      setOtpError("Please enter your college email address first.");
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpError(null);
      setOtpMessage(null);

      const res = await fetch(`${API_BASE}/api/onboarding/send-verification-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, purpose: role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to dispatch verification code");
      }

      setShowOtpWidget(true);
      setOtpCountdown(60);
      setOtpMessage(`Verification OTP sent to ${trimmed}. Enter code below.`);
    } catch (err: any) {
      setOtpError(err.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyModalOtp = async (emailToVerify: string) => {
    const trimmed = emailToVerify.trim();
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);

      const res = await fetch(`${API_BASE}/api/onboarding/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          otp: Number(otpValue.trim()),
          purpose: role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.message || "Invalid OTP entered");
      }

      setIsEmailVerified(true);
      setShowOtpWidget(false);
      setOtpValue("");
      setOtpMessage("Institutional email successfully verified with OTP!");
    } catch (err: any) {
      setOtpError(err.message || "Failed to verify OTP code");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Visuals state
  const [bannerImage, setBannerImage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarModalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setErrorMsg(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("profileImage", file);

      const res = await fetch(`${API_BASE}/api/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.profileImage) {
        setProfileImage(data.profileImage);
        if (data.profile) {
          onSaveSuccess(data.profile);
        }
      } else {
        setErrorMsg(data.message || "Failed to upload avatar to Cloudinary");
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setErrorMsg("Failed to upload avatar image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const role = profileData.accountType || "student";

  // Sync draft state when modal opens
  useEffect(() => {
    if (!isModalOpen || !activeSection) return;

    setErrorMsg(null);
    setHeadline(profileData.headline || "");
    setBio(profileData.bio || "");
    setSkills(profileData.skills ? [...profileData.skills] : []);
    setEducationList(profileData.education ? [...profileData.education] : []);
    setExperienceList(profileData.pastExperience ? [...profileData.pastExperience] : []);
    setCertificationsList(profileData.certifications ? [...profileData.certifications] : []);

    setRoleParams({
      institutionName: profileData.institutionName || profileData.institution || "",
      institutionEmail: profileData.institutionEmail || "",
      designation: profileData.designation || "",
      department: profileData.department || "",
      expertise: profileData.expertise ? [...profileData.expertise] : [],
      researchInterests: profileData.researchInterests ? [...profileData.researchInterests] : [],
      companyName: profileData.companyName || profileData.name || "",
      industryType: profileData.industryType || "",
      officialWebsite: profileData.officialWebsite || profileData.website || "",
      workEmail: profileData.workEmail || "",
      employees: profileData.employees || "",
      aisheCode: profileData.aisheCode || "",
      officialEmail: profileData.officialEmail || "",
      contact: profileData.contact || "",
    });

    setBannerImage(profileData.bannerImage || "");
    setProfileImage(profileData.profileImage || "");

    // If editing specific item index
    if (activeSection === "education" && editingIndex !== null && profileData.education?.[editingIndex]) {
      const item = profileData.education[editingIndex];
      setEduDraft({
        education: item.education || "",
        course: item.course || "",
        timeline: item.timeline || "",
        description: item.description || "",
      });
    } else {
      setEduDraft({ education: "", course: "", timeline: "", description: "" });
    }

    if (activeSection === "experience" && editingIndex !== null && profileData.pastExperience?.[editingIndex]) {
      const item = profileData.pastExperience[editingIndex];
      setExpDraft({
        title: item.title || "",
        organization: item.organization || "",
        timeline: item.timeline || "",
        description: item.description || "",
      });
    } else {
      setExpDraft({ title: "", organization: "", timeline: "", description: "" });
    }

    if (activeSection === "certifications" && editingIndex !== null && profileData.certifications?.[editingIndex]) {
      const item = profileData.certifications[editingIndex];
      setCertDraft({
        title: item.title || "",
        issuer: item.issuer || "",
        credentialUrl: item.credentialUrl || "",
        description: item.description || "",
      });
    } else {
      setCertDraft({ title: "", issuer: "", credentialUrl: "", description: "" });
    }
  }, [isModalOpen, activeSection, editingIndex, profileData]);

  if (!isModalOpen || !activeSection) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    const payload: Partial<ProfileData> = { ...profileData };

    if (activeSection === "headline") {
      payload.headline = headline.trim();
    } else if (activeSection === "bio") {
      payload.bio = bio.trim();
    } else if (activeSection === "skills") {
      payload.skills = skills;
    } else if (activeSection === "education") {
      let updatedEdu = [...(educationList || [])];
      if (eduDraft.education.trim()) {
        if (editingIndex !== null && editingIndex < updatedEdu.length) {
          updatedEdu[editingIndex] = { ...eduDraft };
        } else {
          updatedEdu.push({ ...eduDraft });
        }
      }
      payload.education = updatedEdu;
    } else if (activeSection === "experience") {
      let updatedExp = [...(experienceList || [])];
      if (expDraft.title.trim()) {
        if (editingIndex !== null && editingIndex < updatedExp.length) {
          updatedExp[editingIndex] = { ...expDraft };
        } else {
          updatedExp.push({ ...expDraft });
        }
      }
      payload.pastExperience = updatedExp;
    } else if (activeSection === "certifications") {
      let updatedCert = [...(certificationsList || [])];
      if (certDraft.title.trim()) {
        if (editingIndex !== null && editingIndex < updatedCert.length) {
          updatedCert[editingIndex] = { ...certDraft };
        } else {
          updatedCert.push({ ...certDraft });
        }
      }
      payload.certifications = updatedCert;
    } else if (activeSection === "roleParams") {
      payload.institutionName = roleParams.institutionName;
      payload.institution = roleParams.institutionName;
      payload.institutionEmail = roleParams.institutionEmail;
      payload.isEmailVerified = isEmailVerified;
      payload.designation = roleParams.designation;
      payload.department = roleParams.department;
      payload.expertise = roleParams.expertise;
      payload.researchInterests = roleParams.researchInterests;
      payload.companyName = roleParams.companyName;
      payload.industryType = roleParams.industryType;
      payload.officialWebsite = roleParams.officialWebsite;
      payload.workEmail = roleParams.workEmail;
      payload.employees = roleParams.employees;
      payload.aisheCode = roleParams.aisheCode;
      payload.officialEmail = roleParams.officialEmail;
      payload.contact = roleParams.contact;
    } else if (activeSection === "visuals") {
      payload.bannerImage = bannerImage;
      payload.profileImage = profileImage;
    }

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedProfile = {
          ...payload,
          ...(data.profile || {}),
        } as ProfileData;
        if (payload.headline !== undefined) {
          updatedProfile.headline = payload.headline;
        }
        onSaveSuccess(updatedProfile);
        dispatch(closeEditModal());
      } else {
        setErrorMsg(data.message || "Failed to update profile section.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const getModalTitle = () => {
    switch (activeSection) {
      case "headline":
        return "Update Professional Headline";
      case "bio":
        return "Update Bio / About Summary";
      case "skills":
        return "Manage Verified Skills & Brand Icons";
      case "education":
        return editingIndex !== null ? "Edit Education Record" : "Add New Education Record";
      case "experience":
        return editingIndex !== null ? "Edit Experience Record" : "Add New Experience Record";
      case "certifications":
        return editingIndex !== null ? "Edit Certification Credential" : "Add New Certification Credential";
      case "roleParams":
        return `Edit Dedicated Details (${role.toUpperCase()})`;
      case "visuals":
        return "Update Cover Banner & Profile Picture";
      default:
        return "Update Profile Section";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">{getModalTitle()}</h3>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeEditModal())}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. HEADLINE */}
          {activeSection === "headline" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground">Professional Headline (max 120 chars)</label>
              <input
                type="text"
                maxLength={120}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Computer Science Scholar | Full-Stack Web Developer"
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                autoFocus
              />
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(HEADLINE_SUGGESTIONS[role] || HEADLINE_SUGGESTIONS.student).map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeadline(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary border border-border transition-colors text-left text-muted-foreground cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. BIO */}
          {activeSection === "bio" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">About / Bio Summary</label>
              <textarea
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a concise overview of your background, academic achievements, and goals…"
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none leading-relaxed"
                autoFocus
              />
            </div>
          )}

          {/* 3. SKILLS */}
          {activeSection === "skills" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground">Verified Brand Skills (Powered by Simple Icons)</label>
              <SkillInput
                skills={skills}
                onAddSkill={(s) => setSkills((prev) => (prev.includes(s) ? prev : [...prev, s]))}
                onRemoveSkill={(s) => setSkills((prev) => prev.filter((item) => item !== s))}
                placeholder="Type skill name e.g. Python, Docker, Next.js, TensorFlow…"
                showPopularSuggestions={true}
              />
            </div>
          )}

          {/* 4. EDUCATION */}
          {activeSection === "education" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Institution / University *</label>
                <input
                  type="text"
                  value={eduDraft.education}
                  onChange={(e) => setEduDraft((p) => ({ ...p, education: e.target.value }))}
                  placeholder="e.g. Indian Institute of Technology, Bombay"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Degree / Course</label>
                  <input
                    type="text"
                    value={eduDraft.course}
                    onChange={(e) => setEduDraft((p) => ({ ...p, course: e.target.value }))}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Timeline</label>
                  <input
                    type="text"
                    value={eduDraft.timeline}
                    onChange={(e) => setEduDraft((p) => ({ ...p, timeline: e.target.value }))}
                    placeholder="e.g. 2022 - 2026"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description / Honors</label>
                <textarea
                  rows={3}
                  value={eduDraft.description}
                  onChange={(e) => setEduDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Relevant coursework, GPA, or academic honors…"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 5. EXPERIENCE */}
          {activeSection === "experience" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role Title / Position *</label>
                <input
                  type="text"
                  value={expDraft.title}
                  onChange={(e) => setExpDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Full-Stack Engineering Intern"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Organization / Company</label>
                  <input
                    type="text"
                    value={expDraft.organization}
                    onChange={(e) => setExpDraft((p) => ({ ...p, organization: e.target.value }))}
                    placeholder="e.g. Zerodha / Microsoft"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Timeline</label>
                  <input
                    type="text"
                    value={expDraft.timeline}
                    onChange={(e) => setExpDraft((p) => ({ ...p, timeline: e.target.value }))}
                    placeholder="e.g. Jun 2024 - Present"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Responsibilities &amp; Impact</label>
                <textarea
                  rows={3}
                  value={expDraft.description}
                  onChange={(e) => setExpDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Key contributions and achievements during this role…"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 6. CERTIFICATIONS */}
          {activeSection === "certifications" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Certificate Title *</label>
                <input
                  type="text"
                  value={certDraft.title}
                  onChange={(e) => setCertDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. AWS Certified Solutions Architect Associate"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Issuer / Organization</label>
                  <input
                    type="text"
                    value={certDraft.issuer}
                    onChange={(e) => setCertDraft((p) => ({ ...p, issuer: e.target.value }))}
                    placeholder="e.g. Amazon Web Services / Coursera"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Credential Verification URL</label>
                  <input
                    type="url"
                    value={certDraft.credentialUrl}
                    onChange={(e) => setCertDraft((p) => ({ ...p, credentialUrl: e.target.value }))}
                    placeholder="https://credly.com/verify/..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. ROLE PARAMS */}
          {activeSection === "roleParams" && (
            <div className="space-y-4">
              {role === "student" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Institution / University</label>
                    <input
                      type="text"
                      value={roleParams.institutionName}
                      onChange={(e) => setRoleParams((p) => ({ ...p, institutionName: e.target.value }))}
                      placeholder="e.g. IIT Delhi"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Institutional Student Email</label>
                      {roleParams.institutionEmail && (
                        isEmailVerified ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            Unverified
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={roleParams.institutionEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoleParams((p) => ({ ...p, institutionEmail: val }));
                          setIsEmailVerified(Boolean(profileData.isEmailVerified && profileData.institutionEmail?.toLowerCase() === val.trim().toLowerCase()));
                          setShowOtpWidget(false);
                          setOtpError(null);
                          setOtpMessage(null);
                        }}
                        placeholder="student@iitd.ac.in"
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                      />
                      {!isEmailVerified && roleParams.institutionEmail?.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSendModalOtp(roleParams.institutionEmail)}
                          disabled={isSendingOtp}
                          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{showOtpWidget ? "Resend" : "Verify OTP"}</span>
                        </button>
                      )}
                    </div>

                    {showOtpWidget && (
                      <div className="mt-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                        <p className="text-[11px] text-muted-foreground">
                          Enter 6-digit OTP sent to <span className="font-mono text-foreground font-semibold">{roleParams.institutionEmail}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6-digit OTP"
                            className="w-32 px-3 py-1.5 text-xs font-mono tracking-widest text-center rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyModalOtp(roleParams.institutionEmail)}
                            disabled={isVerifyingOtp || otpValue.trim().length !== 6}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Verify Code</span>
                          </button>
                          {otpCountdown > 0 ? (
                            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                              Resend in {otpCountdown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendModalOtp(roleParams.institutionEmail)}
                              disabled={isSendingOtp}
                              className="text-[11px] text-primary hover:underline ml-auto font-medium cursor-pointer"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                        {otpError && <p className="text-[11px] text-rose-500 font-medium">{otpError}</p>}
                        {otpMessage && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{otpMessage}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {role === "faculty" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Institution / University Name</label>
                    <input
                      type="text"
                      value={roleParams.institutionName}
                      onChange={(e) => setRoleParams((p) => ({ ...p, institutionName: e.target.value }))}
                      placeholder="e.g. Indian Institute of Science"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Faculty Official Email</label>
                      {roleParams.institutionEmail && (
                        isEmailVerified ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            Unverified
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={roleParams.institutionEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoleParams((p) => ({ ...p, institutionEmail: val }));
                          setIsEmailVerified(Boolean(profileData.isEmailVerified && profileData.institutionEmail?.toLowerCase() === val.trim().toLowerCase()));
                          setShowOtpWidget(false);
                          setOtpError(null);
                          setOtpMessage(null);
                        }}
                        placeholder="professor@iisc.ac.in"
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                      />
                      {!isEmailVerified && roleParams.institutionEmail?.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSendModalOtp(roleParams.institutionEmail)}
                          disabled={isSendingOtp}
                          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{showOtpWidget ? "Resend" : "Verify OTP"}</span>
                        </button>
                      )}
                    </div>

                    {showOtpWidget && (
                      <div className="mt-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                        <p className="text-[11px] text-muted-foreground">
                          Enter 6-digit OTP sent to <span className="font-mono text-foreground font-semibold">{roleParams.institutionEmail}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6-digit OTP"
                            className="w-32 px-3 py-1.5 text-xs font-mono tracking-widest text-center rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyModalOtp(roleParams.institutionEmail)}
                            disabled={isVerifyingOtp || otpValue.trim().length !== 6}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Verify Code</span>
                          </button>
                          {otpCountdown > 0 ? (
                            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                              Resend in {otpCountdown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendModalOtp(roleParams.institutionEmail)}
                              disabled={isSendingOtp}
                              className="text-[11px] text-primary hover:underline ml-auto font-medium cursor-pointer"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                        {otpError && <p className="text-[11px] text-rose-500 font-medium">{otpError}</p>}
                        {otpMessage && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{otpMessage}</p>}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Designation</label>
                      <input
                        type="text"
                        value={roleParams.designation}
                        onChange={(e) => setRoleParams((p) => ({ ...p, designation: e.target.value }))}
                        placeholder="Assistant Professor"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Department</label>
                      <input
                        type="text"
                        value={roleParams.department}
                        onChange={(e) => setRoleParams((p) => ({ ...p, department: e.target.value }))}
                        placeholder="Computer Science"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Teaching Expertise</label>
                    <SkillInput
                      skills={roleParams.expertise}
                      onAddSkill={(s) => setRoleParams((p) => ({ ...p, expertise: [...p.expertise, s] }))}
                      onRemoveSkill={(s) => setRoleParams((p) => ({ ...p, expertise: p.expertise.filter((item) => item !== s) }))}
                      placeholder="Type expertise..."
                      showPopularSuggestions={false}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Research Interests</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newResearchInput}
                        onChange={(e) => setNewResearchInput(e.target.value)}
                        placeholder="e.g. Quantum AI, NLP..."
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newResearchInput.trim()) {
                            setRoleParams((p) => ({ ...p, researchInterests: [...p.researchInterests, newResearchInput.trim()] }));
                            setNewResearchInput("");
                          }
                        }}
                        className="px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs"
                      >
                        + Add Focus
                      </button>
                    </div>
                    {roleParams.researchInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {roleParams.researchInterests.map((interest, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs">
                            {interest}
                            <button
                              type="button"
                              onClick={() => setRoleParams((p) => ({ ...p, researchInterests: p.researchInterests.filter((_, i) => i !== idx) }))}
                              className="font-bold text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {role === "industry" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Company Name</label>
                      <input
                        type="text"
                        value={roleParams.companyName}
                        onChange={(e) => setRoleParams((p) => ({ ...p, companyName: e.target.value }))}
                        placeholder="Google India"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Industry Sector</label>
                      <input
                        type="text"
                        value={roleParams.industryType}
                        onChange={(e) => setRoleParams((p) => ({ ...p, industryType: e.target.value }))}
                        placeholder="Technology"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Corporate Email</label>
                    <input
                      type="email"
                      value={roleParams.workEmail}
                      onChange={(e) => setRoleParams((p) => ({ ...p, workEmail: e.target.value }))}
                      placeholder="hr@company.com"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {role === "institution" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Institution Name</label>
                      <input
                        type="text"
                        value={roleParams.institutionName}
                        onChange={(e) => setRoleParams((p) => ({ ...p, institutionName: e.target.value }))}
                        placeholder="NIT Trichy"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">AISHE Code</label>
                      <input
                        type="text"
                        value={roleParams.aisheCode}
                        onChange={(e) => setRoleParams((p) => ({ ...p, aisheCode: e.target.value }))}
                        placeholder="C-26789"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Official Email</label>
                    <input
                      type="email"
                      value={roleParams.officialEmail}
                      onChange={(e) => setRoleParams((p) => ({ ...p, officialEmail: e.target.value }))}
                      placeholder="registrar@nitt.edu"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. VISUALS */}
          {activeSection === "visuals" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Cover Banner Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANNER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBannerImage(preset.url)}
                      className={`h-16 rounded-lg overflow-hidden border-2 text-left relative transition-all ${
                        bannerImage === preset.url ? "border-primary ring-2 ring-primary/30" : "border-border"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/40 p-1 text-[9px] font-semibold text-white flex items-end">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground">Custom Cover Image URL</label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Upload Profile Picture (Multer &rarr; Cloudinary)</label>
                  {isUploadingAvatar && (
                    <span className="text-primary font-mono text-[10px] animate-pulse font-semibold">
                      Uploading to Cloudinary...
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarModalUpload}
                  disabled={isUploadingAvatar}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                />

                {profileImage && (
                  <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border">
                    <img
                      src={profileImage}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Cloudinary Image URL:</p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{profileImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-muted-foreground">Or Enter Profile Picture URL directly</label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <button
            type="button"
            onClick={() => dispatch(closeEditModal())}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
