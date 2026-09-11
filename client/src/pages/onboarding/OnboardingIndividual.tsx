import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpenCheck,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Sun,
  Moon,
  ShieldCheck,
  Award,
  Briefcase,
  Camera,
} from "lucide-react";
import { City, State } from "country-state-city";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";
import SkillInput from "@/components/SkillInput";

// ============================================================
// Constants & Types
// ============================================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export type IndividualRole = "student" | "faculty";

export interface AisheInstitution {
  name: string;
  aisheCode: string;
  state: string;
  district?: string;
}

export interface EducationEntry {
  education: string;
  course: string;
  description: string;
  timeline: string;
}

export interface CertificationEntry {
  title: string;
  description: string;
  upload?: string;
}

export interface PastExperienceEntry {
  title: string;
  timeline: string;
  description: string;
  uploadImage?: string;
}

export interface IndividualProfilePayload {
  category: "individual";
  accountType: IndividualRole;
  name: string;
  headline?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;

  // Individual / Institution parameters
  institution: string;
  institutionEmail: string;
  isEmailVerified: boolean;

  // Faculty specifics
  designation?: string;
  department?: string;

  // Optional arrays
  education: EducationEntry[];
  certifications: CertificationEntry[];
  pastExperience: PastExperienceEntry[];
  skills: string[];
}

interface UploadResponse {
  success: boolean;
  message: string;
  url: string;
}

interface InstitutionsSearchResponse {
  institutions: AisheInstitution[];
}

interface OtpDispatchResponse {
  success: boolean;
  message: string;
}

interface OtpVerifyResponse {
  verified: boolean;
  message: string;
}

interface ProfileSaveResponse {
  success: boolean;
  message: string;
}

// ============================================================
// Main Component: OnboardingIndividual (Student & Faculty)
// ============================================================

export default function OnboardingIndividual() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  // Role: student vs faculty
  const roleParam = searchParams.get("role");
  const activeRole: IndividualRole = roleParam === "faculty" ? "faculty" : "student";

  // Core Identity
  const [name, setName] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  // Faculty Specifics
  const [designation, setDesignation] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  // Optional Institutional Email Verification (tick like LinkedIn)
  const [institutionEmail, setInstitutionEmail] = useState<string>("");
  const [selectedInstitution, setSelectedInstitution] = useState<AisheInstitution | null>(null);
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionSuggestions, setInstitutionSuggestions] = useState<AisheInstitution[]>([]);
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState<boolean>(false);
  const [isSearchingInstitutions, setIsSearchingInstitutions] = useState<boolean>(false);

  const [otpValue, setOtpValue] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // City Autocomplete State (country-state-city)
  const [cityInput, setCityInput] = useState<string>("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const [citySuggestions, setCitySuggestions] = useState<{
    name: string;
    stateName: string;
    countryCode: string;
  }[]>([]);

  // Optional Data: Education [+]
  const [showAddEducation, setShowAddEducation] = useState<boolean>(false);
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [eduDegree, setEduDegree] = useState<string>("");
  const [eduCourse, setEduCourse] = useState<string>("");
  const [eduDesc, setEduDesc] = useState<string>("");
  const [eduTimeline, setEduTimeline] = useState<string>("");
  const [eduInstSuggestions, setEduInstSuggestions] = useState<AisheInstitution[]>([]);
  const [eduInstDropdownOpen, setEduInstDropdownOpen] = useState<boolean>(false);
  const [isSearchingEduInst, setIsSearchingEduInst] = useState<boolean>(false);

  // Optional Data: Certification [+]
  const [showAddCertification, setShowAddCertification] = useState<boolean>(false);
  const [certificationsList, setCertificationsList] = useState<CertificationEntry[]>([]);
  const [certTitle, setCertTitle] = useState<string>("");
  const [certDesc, setCertDesc] = useState<string>("");
  const [certUploadUrl, setCertUploadUrl] = useState<string>("");
  const [isUploadingCertFile, setIsUploadingCertFile] = useState<boolean>(false);

  // Optional Data: Past Experience [+]
  const [showAddExperience, setShowAddExperience] = useState<boolean>(false);
  const [experienceList, setExperienceList] = useState<PastExperienceEntry[]>([]);
  const [expTitle, setExpTitle] = useState<string>("");
  const [expTimeline, setExpTimeline] = useState<string>("");
  const [expDesc, setExpDesc] = useState<string>("");
  const [expImageUrl, setExpImageUrl] = useState<string>("");
  const [isUploadingExpImage, setIsUploadingExpImage] = useState<boolean>(false);

  // Optional Data: Skills [+]
  const [skills, setSkills] = useState<string[]>([]);

  // General Loading & Status
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Pre-fill institutional email if user email is an academic address
  useEffect(() => {
    if (user?.email && !institutionEmail) {
      if (user.email.endsWith(".edu") || user.email.endsWith(".ac.in")) {
        setInstitutionEmail(user.email);
      }
    }
  }, [user, institutionEmail]);

  // Handle switching role (Student <-> Faculty)
  const handleRoleSwitch = (newRole: IndividualRole) => {
    setSearchParams({ role: newRole });
  };

  // ============================================================
  // File Upload Helper (Cloudinary)
  // ============================================================

  async function uploadFileToCloudinary(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE}/api/upload/single`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errData = (await response.json()) as { message?: string };
      throw new Error(errData.message || "Failed to upload file");
    }

    const data = (await response.json()) as UploadResponse;
    return data.url;
  }

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingProfileImage(true);
      setGeneralError(null);
      const url = await uploadFileToCloudinary(file, "portal_academia/avatars");
      setProfileImage(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profile image upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  // ============================================================
  // City Search Handler (country-state-city)
  // ============================================================

  const handleCityInputChange = (val: string) => {
    setCityInput(val);
    setLocation(val);
    if (!val || val.trim().length < 2) {
      setCitySuggestions([]);
      setCityDropdownOpen(false);
      return;
    }
    const q = val.toLowerCase().trim();
    const allCities = City.getAllCities();
    const matches: { name: string; stateName: string; countryCode: string }[] = [];

    for (const c of allCities) {
      if (c.countryCode === "IN" && c.name.toLowerCase().includes(q)) {
        const stateObj = State.getStateByCodeAndCountry(c.stateCode, "IN");
        matches.push({
          name: c.name,
          stateName: stateObj?.name || c.stateCode,
          countryCode: "IN",
        });
        if (matches.length >= 15) break;
      }
    }

    if (matches.length < 8) {
      for (const c of allCities) {
        if (c.countryCode !== "IN" && c.name.toLowerCase().includes(q)) {
          const stateObj = State.getStateByCodeAndCountry(c.stateCode, c.countryCode);
          matches.push({
            name: c.name,
            stateName: stateObj?.name || c.stateCode,
            countryCode: c.countryCode,
          });
          if (matches.length >= 15) break;
        }
      }
    }

    setCitySuggestions(matches);
    setCityDropdownOpen(matches.length > 0);
  };

  const handleSelectCity = (c: { name: string; stateName: string; countryCode: string }) => {
    const formatted = `${c.name}, ${c.stateName}${c.countryCode !== "IN" ? ` (${c.countryCode})` : ""}`;
    setCityInput(formatted);
    setLocation(formatted);
    setCityDropdownOpen(false);
  };

  // ============================================================
  // AISHE Institution Search for Optional Verification
  // ============================================================

  async function fetchInstitutions(query: string): Promise<AisheInstitution[]> {
    const response = await fetch(
      `${API_BASE}/api/onboarding/institutions?search=${encodeURIComponent(query)}&limit=15`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query institution database");
    }

    const data = (await response.json()) as InstitutionsSearchResponse;
    return data.institutions || [];
  }

  // Debounced search for Institution in Verify Email
  useEffect(() => {
    const q = institutionSearchQuery.trim();
    if (!q || q.length < 2) {
      setInstitutionSuggestions([]);
      setInstitutionDropdownOpen(false);
      return;
    }

    if (selectedInstitution && selectedInstitution.name.toLowerCase() === q.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingInstitutions(true);
        const results = await fetchInstitutions(q);
        setInstitutionSuggestions(results);
        setInstitutionDropdownOpen(results.length > 0);
      } catch {
        setInstitutionSuggestions([]);
      } finally {
        setIsSearchingInstitutions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [institutionSearchQuery, selectedInstitution]);

  const handleSelectInstitution = (inst: AisheInstitution) => {
    setSelectedInstitution(inst);
    setInstitutionSearchQuery(inst.name);
    setInstitutionDropdownOpen(false);
    setInstitutionSuggestions([]);
  };

  // Debounced search for Education Degree / Institution
  useEffect(() => {
    const q = eduDegree.trim();
    if (!q || q.length < 2) {
      setEduInstSuggestions([]);
      setEduInstDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingEduInst(true);
        const results = await fetchInstitutions(q);
        setEduInstSuggestions(results);
        setEduInstDropdownOpen(results.length > 0);
      } catch {
        setEduInstSuggestions([]);
      } finally {
        setIsSearchingEduInst(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [eduDegree]);

  const handleSelectEduInst = (inst: AisheInstitution) => {
    setEduDegree(inst.name);
    setEduInstDropdownOpen(false);
    setEduInstSuggestions([]);
  };

  // ============================================================
  // Optional Verification OTP Handlers
  // ============================================================

  const handleSendOtp = async () => {
    if (!institutionEmail.trim()) {
      setOtpError("Please enter your institutional email to verify.");
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpError(null);
      setOtpMessage(null);

      const response = await fetch(`${API_BASE}/api/onboarding/send-verification-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: institutionEmail.trim(), purpose: "individual" }),
      });

      const data = (await response.json()) as OtpDispatchResponse;
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setIsOtpSent(true);
      setOtpMessage(data.message || `Verification code sent to ${institutionEmail}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch verification code";
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6-digit code received on your email.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);

      const response = await fetch(`${API_BASE}/api/onboarding/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: institutionEmail.trim(),
          otp: Number(otpValue.trim()),
          purpose: "individual",
        }),
      });

      const data = (await response.json()) as OtpVerifyResponse;
      if (!response.ok || !data.verified) {
        throw new Error(data.message || "Invalid OTP code");
      }

      setIsEmailVerified(true);
      setOtpMessage("Email successfully verified! Verified badge unlocked.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ============================================================
  // Additional Sections Form Actions
  // ============================================================

  const handleAddEducation = () => {
    if (!eduDegree.trim()) return;
    setEducationList([
      ...educationList,
      {
        education: eduDegree.trim(),
        course: eduCourse.trim(),
        description: eduDesc.trim(),
        timeline: eduTimeline.trim(),
      },
    ]);
    setEduDegree("");
    setEduCourse("");
    setEduDesc("");
    setEduTimeline("");
    setShowAddEducation(false);
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  const handleCertFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCertFile(true);
      setGeneralError(null);
      const url = await uploadFileToCloudinary(file, "portal_academia/certificates");
      setCertUploadUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Certificate upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingCertFile(false);
    }
  };

  const handleAddCertification = () => {
    if (!certTitle.trim()) return;
    setCertificationsList([
      ...certificationsList,
      {
        title: certTitle.trim(),
        description: certDesc.trim(),
        upload: certUploadUrl,
      },
    ]);
    setCertTitle("");
    setCertDesc("");
    setCertUploadUrl("");
    setShowAddCertification(false);
  };

  const handleRemoveCertification = (index: number) => {
    setCertificationsList(certificationsList.filter((_, i) => i !== index));
  };

  const handleExpImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingExpImage(true);
      setGeneralError(null);
      const url = await uploadFileToCloudinary(file, "portal_academia/experience");
      setExpImageUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingExpImage(false);
    }
  };

  const handleAddExperience = () => {
    if (!expTitle.trim()) return;
    setExperienceList([
      ...experienceList,
      {
        title: expTitle.trim(),
        timeline: expTimeline.trim(),
        description: expDesc.trim(),
        uploadImage: expImageUrl,
      },
    ]);
    setExpTitle("");
    setExpTimeline("");
    setExpDesc("");
    setExpImageUrl("");
    setShowAddExperience(false);
  };

  const handleRemoveExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };


  // ============================================================
  // Form Submission
  // ============================================================

  async function submitProfile(payload: IndividualProfilePayload): Promise<ProfileSaveResponse> {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ProfileSaveResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to persist profile");
    }

    return data;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setGeneralError("Full Name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload: IndividualProfilePayload = {
      category: "individual",
      accountType: activeRole,
      name: name.trim(),
      headline: headline.trim() || undefined,
      profileImage: profileImage || undefined,
      location: location.trim() || undefined,
      institution: selectedInstitution ? selectedInstitution.name : institutionSearchQuery.trim(),
      institutionEmail: institutionEmail.trim(),
      isEmailVerified,
      designation: activeRole === "faculty" ? designation.trim() : undefined,
      department: activeRole === "faculty" ? department.trim() : undefined,
      education: educationList,
      certifications: certificationsList,
      pastExperience: experienceList,
      skills,
    };

    try {
      setIsSubmitting(true);
      setGeneralError(null);
      await submitProfile(payload);
      await dispatch(checkAuthThunk());
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profile submission failed";
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-foreground selection:text-background transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md px-4 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-bold">PortalAcademia</span>
          </Link>
          <span className="text-muted-foreground text-xs">&bull;</span>
          <span className="text-xs text-muted-foreground font-mono">Onboarding</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Switcher */}
          <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40 text-xs">
            <span className="px-2.5 py-1 rounded-sm bg-background font-semibold text-foreground shadow-sm">
              Individual
            </span>
            <Link
              to="/onboarding/organization"
              className="px-2.5 py-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Organization
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Banner */}
          {generalError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            {/* Top Center: Profile Image Avatar */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-border bg-muted overflow-hidden flex items-center justify-center shadow-inner">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="w-6 h-6 mb-1 opacity-60" />
                      <span className="text-[10px] font-mono">Profile Image</span>
                    </div>
                  )}

                  {isUploadingProfileImage && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="profile-upload-input"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center cursor-pointer shadow hover:opacity-90 transition-opacity"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
                <input
                  id="profile-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Click camera icon to upload profile photo
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="full-name-input"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="full-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                required
              />
            </div>

            {/* Professional Headline (Optional) */}
            <div>
              <label
                htmlFor="headline-input"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Professional Headline <span className="text-muted-foreground font-normal normal-case">(optional)</span>
              </label>
              <input
                id="headline-input"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
                placeholder="e.g. CS Undergrad | React & Node.js Developer | Open Source Contributor"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(activeRole === "faculty"
                  ? [
                      "Assistant Professor | Computer Science & Engineering",
                      "Academic Researcher & Mentor | AI & NLP",
                      "Senior Faculty Scholar | Data Structures & Algorithms",
                    ]
                  : [
                      "CS Scholar | Full-Stack Web & App Developer",
                      "AI & Machine Learning Enthusiast | Python & PyTorch",
                      "Aspiring SDE | Open Source Contributor",
                      "Cloud & DevOps Enthusiast | Docker & AWS",
                    ]
                ).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHeadline(sug)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer",
                      headline === sug
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    )}
                  >
                    {sug}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Appears under your name on profile searches and certificates. You can change it anytime later.
              </p>
            </div>

            {/* I'm a: Student / Faculty */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                I'm a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("student")}
                  className={cn(
                    "h-10 px-4 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    activeRole === "student"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSwitch("faculty")}
                  className={cn(
                    "h-10 px-4 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    activeRole === "faculty"
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  )}
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>Faculty</span>
                </button>
              </div>
            </div>

            {/* Faculty Specific Fields */}
            {activeRole === "faculty" && (
              <div className="p-4 rounded-md border border-border bg-muted/20 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Assistant Professor"
                      className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engg."
                      className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Verify Email Section (Optional with LinkedIn-style verified tick) */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Verify Email (Optional)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    (if verified we add a tick just like linkedin)
                  </span>
                </div>
                {isEmailVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              {/* Institution Email */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Institution Email
                </label>
                <input
                  type="email"
                  value={institutionEmail}
                  onChange={(e) => {
                    setInstitutionEmail(e.target.value);
                    setIsEmailVerified(false);
                    setIsOtpSent(false);
                  }}
                  disabled={isEmailVerified}
                  placeholder="e.g. yourname@college.edu or college.ac.in"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring disabled:opacity-60"
                />
              </div>

              {/* Institution (Search with AISHE dropdown) */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Institution (AISHE Registry)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={institutionSearchQuery}
                    onChange={(e) => {
                      setInstitutionSearchQuery(e.target.value);
                      if (selectedInstitution && e.target.value !== selectedInstitution.name) {
                        setSelectedInstitution(null);
                      }
                    }}
                    onFocus={() => {
                      if (institutionSuggestions.length > 0 && !selectedInstitution) {
                        setInstitutionDropdownOpen(true);
                      }
                    }}
                    placeholder="Search college or university name..."
                    className="w-full h-8 pl-8 pr-8 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    autoComplete="off"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  {isSearchingInstitutions && (
                    <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground animate-spin" />
                  )}
                </div>

                {/* Floating Suggestions Dropdown */}
                {institutionDropdownOpen && institutionSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto border border-border rounded-md divide-y divide-border bg-popover text-popover-foreground shadow-xl">
                    {institutionSuggestions.map((inst, idx) => (
                      <button
                        key={`${inst.aisheCode}-${idx}`}
                        type="button"
                        onClick={() => handleSelectInstitution(inst)}
                        className="w-full p-2 text-left hover:bg-muted cursor-pointer text-xs flex items-center justify-between group"
                      >
                        <div className="flex-1 pr-2">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {inst.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            AISHE: {inst.aisheCode || "N/A"} &bull; {inst.state}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* OTP Dispatch and Verification Box */}
              {!isEmailVerified && institutionEmail.trim() && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  {!isOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Send OTP for Verified Badge</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6-digit OTP code"
                          className="w-36 h-8 px-2.5 text-center tracking-widest font-mono text-xs rounded-md border border-input bg-background text-foreground focus-ring"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpValue.length !== 6}
                          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMessage && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                      {otpMessage}
                    </p>
                  )}
                  {otpError && (
                    <p className="text-[11px] text-destructive font-mono">
                      {otpError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* City / Location (country-state-city dropdown) */}
            <div className="relative">
              <label
                htmlFor="city-input"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Location / City
              </label>
              <div className="relative">
                <input
                  id="city-input"
                  type="text"
                  value={cityInput}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onFocus={() => {
                    if (citySuggestions.length > 0) setCityDropdownOpen(true);
                  }}
                  placeholder="Type city name (e.g. Bengaluru, Mumbai, Delhi...)"
                  className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  autoComplete="off"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground pointer-events-none" />
              </div>

              {/* City Autocomplete Dropdown */}
              {cityDropdownOpen && citySuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg text-xs py-1 divide-y divide-border/40">
                  {citySuggestions.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.stateName}-${idx}`}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="font-semibold text-foreground">{city.name}</span>
                        <span className="text-muted-foreground text-[11px]">— {city.stateName}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                        {city.countryCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================
                OPTIONAL DATA SECTIONS (Education, Certs, Experience, Skills)
                ============================================================ */}
            <div className="pt-4 border-t border-border space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Optional Data
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  Fill or Skip Anytime
                </span>
              </div>

              {/* 1. Education [+] */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Education
                    </span>
                    {educationList.length > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        ({educationList.length})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddEducation(!showAddEducation)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className={cn("w-3.5 h-3.5 transition-transform", showAddEducation && "rotate-45")} />
                    <span>{showAddEducation ? "Cancel" : "Add Education"}</span>
                  </button>
                </div>

                {/* Collapsible Add Education Form */}
                {showAddEducation && (
                  <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Education (Institution / University)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={eduDegree}
                            onChange={(e) => setEduDegree(e.target.value)}
                            onFocus={() => {
                              if (eduInstSuggestions.length > 0) setEduInstDropdownOpen(true);
                            }}
                            placeholder="e.g. IIT Delhi, Delhi University"
                            className="w-full h-8 px-2.5 pr-8 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                            autoComplete="off"
                          />
                          {isSearchingEduInst && (
                            <Loader2 className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground animate-spin" />
                          )}
                        </div>

                        {eduInstDropdownOpen && eduInstSuggestions.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border bg-popover text-popover-foreground shadow-xl">
                            {eduInstSuggestions.map((inst, idx) => (
                              <button
                                key={`edu-${inst.aisheCode}-${idx}`}
                                type="button"
                                onClick={() => handleSelectEduInst(inst)}
                                className="w-full p-2 text-left hover:bg-muted cursor-pointer text-xs flex items-center justify-between"
                              >
                                <div className="flex-1 pr-2">
                                  <p className="font-semibold text-foreground">{inst.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {inst.aisheCode ? `AISHE: ${inst.aisheCode} • ` : ""}{inst.state}
                                  </p>
                                </div>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  Select
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Course
                        </label>
                        <input
                          type="text"
                          value={eduCourse}
                          onChange={(e) => setEduCourse(e.target.value)}
                          placeholder="e.g. B.Tech Computer Science"
                          className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Time Line
                        </label>
                        <input
                          type="text"
                          value={eduTimeline}
                          onChange={(e) => setEduTimeline(e.target.value)}
                          placeholder="e.g. 2021 - 2025"
                          className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Education Description
                        </label>
                        <input
                          type="text"
                          value={eduDesc}
                          onChange={(e) => setEduDesc(e.target.value)}
                          placeholder="Brief description / Major"
                          className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        disabled={!eduDegree.trim()}
                        className="h-7 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Save Education
                      </button>
                    </div>
                  </div>
                )}

                {/* Added Education Entries */}
                {educationList.length > 0 && (
                  <div className="space-y-2">
                    {educationList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.education}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {item.course} {item.timeline ? `(${item.timeline})` : ""}
                          </p>
                          {item.description && (
                            <p className="text-muted-foreground text-[11px] mt-1">{item.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Certification [+] */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Certification
                    </span>
                    {certificationsList.length > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        ({certificationsList.length})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCertification(!showAddCertification)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className={cn("w-3.5 h-3.5 transition-transform", showAddCertification && "rotate-45")} />
                    <span>{showAddCertification ? "Cancel" : "Add Certification"}</span>
                  </button>
                </div>

                {/* Collapsible Add Certification Form */}
                {showAddCertification && (
                  <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Add title
                      </label>
                      <input
                        type="text"
                        value={certTitle}
                        onChange={(e) => setCertTitle(e.target.value)}
                        placeholder="Certificate name (e.g. AWS Certified Developer)"
                        className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Add description
                      </label>
                      <input
                        type="text"
                        value={certDesc}
                        onChange={(e) => setCertDesc(e.target.value)}
                        placeholder="Issuing authority, credential ID or brief notes"
                        className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Upload Certificate File / Proof
                      </label>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="cert-file-input"
                          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-colors"
                        >
                          {isUploadingCertFile ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{certUploadUrl ? "File Uploaded ✓" : "Upload File"}</span>
                        </label>
                        <input
                          id="cert-file-input"
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleCertFileSelected}
                          className="hidden"
                        />
                        {certUploadUrl && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-xs">
                            Asset secured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddCertification}
                        disabled={!certTitle.trim()}
                        className="h-7 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Save Certification
                      </button>
                    </div>
                  </div>
                )}

                {/* Added Certifications */}
                {certificationsList.length > 0 && (
                  <div className="space-y-2">
                    {certificationsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          {item.description && (
                            <p className="text-muted-foreground text-[11px] mt-0.5">{item.description}</p>
                          )}
                          {item.upload && (
                            <a
                              href={item.upload}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline font-mono inline-block mt-1"
                            >
                              View attached file ↗
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Past Experience [+] */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Past Experience
                    </span>
                    {experienceList.length > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        ({experienceList.length})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExperience(!showAddExperience)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className={cn("w-3.5 h-3.5 transition-transform", showAddExperience && "rotate-45")} />
                    <span>{showAddExperience ? "Cancel" : "Add Experience"}</span>
                  </button>
                </div>

                {/* Collapsible Add Experience Form */}
                {showAddExperience && (
                  <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Add Title
                        </label>
                        <input
                          type="text"
                          value={expTitle}
                          onChange={(e) => setExpTitle(e.target.value)}
                          placeholder="e.g. Full Stack Intern / Lab Assistant"
                          className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Add Time Line
                        </label>
                        <input
                          type="text"
                          value={expTimeline}
                          onChange={(e) => setExpTimeline(e.target.value)}
                          placeholder="e.g. Jun 2023 - Aug 2023"
                          className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Add description
                      </label>
                      <input
                        type="text"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        placeholder="Key responsibilities and achievements"
                        className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Upload Image
                      </label>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="exp-image-input"
                          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-colors"
                        >
                          {isUploadingExpImage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{expImageUrl ? "Image Uploaded ✓" : "Upload Image"}</span>
                        </label>
                        <input
                          id="exp-image-input"
                          type="file"
                          accept="image/*"
                          onChange={handleExpImageSelected}
                          className="hidden"
                        />
                        {expImageUrl && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-xs">
                            Asset secured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        disabled={!expTitle.trim()}
                        className="h-7 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Save Experience
                      </button>
                    </div>
                  </div>
                )}

                {/* Added Experiences */}
                {experienceList.length > 0 && (
                  <div className="space-y-2">
                    {experienceList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          {item.timeline && (
                            <p className="text-muted-foreground text-[11px]">{item.timeline}</p>
                          )}
                          {item.description && (
                            <p className="text-muted-foreground text-[11px] mt-1">{item.description}</p>
                          )}
                          {item.uploadImage && (
                            <a
                              href={item.uploadImage}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline font-mono inline-block mt-1"
                            >
                              View attached proof ↗
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Skills [+] */}
              <div className="space-y-3">
                <SkillInput
                  skills={skills}
                  onAddSkill={(s) => {
                    if (!skills.includes(s)) setSkills([...skills, s]);
                  }}
                  onRemoveSkill={(s) => setSkills(skills.filter((x) => x !== s))}
                  placeholder="Type skill (e.g. Python, React, Docker) and select…"
                  label="Skills"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-10 px-6 text-xs font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 shadow transition-colors cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Complete Onboarding</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PortalAcademia &bull; Secured with Gov AISHE Framework
      </footer>
    </div>
  );
}
