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
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sun,
  Moon,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

// ============================================================
// Types & Interfaces
// ============================================================

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
  expertise?: string[];
  researchInterests?: string[];

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
  publicId?: string;
}

interface InstitutionsSearchResponse {
  institutions: AisheInstitution[];
}

interface CrawlEmailsResponse {
  emails: string[];
  source: string;
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
// Onboarding Component
// ============================================================

export default function OnboardingIndividual() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  // Determine current role from URL or default to student
  const roleParam = searchParams.get("role");
  const activeRole: IndividualRole = roleParam === "faculty" ? "faculty" : "student";

  // Wizard Step: 1 (Basic Info), 2 (Institution & Verification), 3 (Optional Data), 4 (Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");
  const [github, setGithub] = useState<string>("");

  // Faculty specifics
  const [designation, setDesignation] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [expertiseInput, setExpertiseInput] = useState<string>("");
  const [expertiseList, setExpertiseList] = useState<string[]>([]);

  // Institution Search & Selection
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionList, setInstitutionList] = useState<AisheInstitution[]>([]);
  const [isSearchingInstitutions, setIsSearchingInstitutions] = useState<boolean>(false);
  const [selectedInstitution, setSelectedInstitution] = useState<AisheInstitution | null>(null);

  // Institutional Email & OTP Verification
  const [institutionEmail, setInstitutionEmail] = useState<string>("");
  const [crawledEmails, setCrawledEmails] = useState<string[]>([]);
  const [isCrawlingEmails, setIsCrawlingEmails] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Optional Data: Skills, Education, Certifications, Past Experience
  const [skillInput, setSkillInput] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);

  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [eduDegree, setEduDegree] = useState<string>("");
  const [eduCourse, setEduCourse] = useState<string>("");
  const [eduTimeline, setEduTimeline] = useState<string>("");
  const [eduDesc, setEduDesc] = useState<string>("");

  const [certificationsList, setCertificationsList] = useState<CertificationEntry[]>([]);
  const [certTitle, setCertTitle] = useState<string>("");
  const [certDesc, setCertDesc] = useState<string>("");
  const [certUploadUrl, setCertUploadUrl] = useState<string>("");

  const [experienceList, setExperienceList] = useState<PastExperienceEntry[]>([]);
  const [expTitle, setExpTitle] = useState<string>("");
  const [expTimeline, setExpTimeline] = useState<string>("");
  const [expDesc, setExpDesc] = useState<string>("");
  const [expImageUrl, setExpImageUrl] = useState<string>("");

  // Loading & Submission State
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Prepopulate email if available from user session
  useEffect(() => {
    if (user?.email && !institutionEmail) {
      if (user.email.endsWith(".edu") || user.email.endsWith(".ac.in")) {
        setInstitutionEmail(user.email);
      }
    }
  }, [user]);

  // Handle switching role via tab
  const handleRoleSwitch = (newRole: IndividualRole) => {
    setSearchParams({ role: newRole });
  };

  // ============================================================
  // Network Call: Upload File (Profile Image, Cert, Experience)
  // ============================================================

  /**
   * @description Uploads a single file (image or PDF) to Cloudinary via backend endpoint
   * @param {File} file - Selected raw file binary
   * @param {string} folder - Destination Cloudinary directory
   * @returns {Promise<string>} Secure HTTPS URL of the uploaded asset
   * @throws {Error} HTTP status code handling on failed upload
   */
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

  // Handle Profile Avatar Selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setGeneralError(null);
      const url = await uploadFileToCloudinary(file, "portal_academia/avatars");
      setProfileImage(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ============================================================
  // Network Call: Search Institutions
  // ============================================================

  /**
   * @description Searches national AISHE database or predefined college registry
   * @param {string} query - Keyword substring matching college name or state
   * @returns {Promise<AisheInstitution[]>} Matched higher education institutions
   * @throws {Error} Network failure or invalid request
   */
  async function fetchInstitutions(query: string): Promise<AisheInstitution[]> {
    const response = await fetch(
      `${API_BASE}/api/onboarding/institutions?search=${encodeURIComponent(query)}&limit=20`,
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

  const handleSearchInstitutions = async () => {
    if (!institutionSearchQuery.trim()) return;
    try {
      setIsSearchingInstitutions(true);
      setGeneralError(null);
      const results = await fetchInstitutions(institutionSearchQuery);
      setInstitutionList(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setGeneralError(msg);
    } finally {
      setIsSearchingInstitutions(false);
    }
  };

  // ============================================================
  // Network Call: AI Crawl College Emails
  // ============================================================

  /**
   * @description Queries Grok AI endpoint to crawl verified registrar/academic domains for college
   * @param {string} institutionName - Legal name of the institution
   * @returns {Promise<string[]>} Official domain email addresses
   * @throws {Error} Crawling error handling
   */
  async function crawlCollegeEmails(institutionName: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/onboarding/crawl-college-emails`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionName }),
    });

    if (!response.ok) {
      throw new Error("Failed to crawl official institution domains");
    }

    const data = (await response.json()) as CrawlEmailsResponse;
    return data.emails || [];
  }

  const handleSelectInstitution = async (inst: AisheInstitution) => {
    setSelectedInstitution(inst);
    setInstitutionSearchQuery(inst.name);
    setInstitutionList([]);

    try {
      setIsCrawlingEmails(true);
      const emails = await crawlCollegeEmails(inst.name);
      setCrawledEmails(emails);
    } catch {
      // Fallback domain options
      setCrawledEmails([]);
    } finally {
      setIsCrawlingEmails(false);
    }
  };

  // ============================================================
  // Network Call: Send Verification OTP
  // ============================================================

  /**
   * @description Dispatches a 6-digit cryptographic verification code to the institutional email
   * @param {string} email - Academic email address
   * @returns {Promise<OtpDispatchResponse>} Dispatch confirmation status
   * @throws {Error} Invalid email or SMTP dispatch rejection
   */
  async function sendVerificationOtp(email: string): Promise<OtpDispatchResponse> {
    const response = await fetch(`${API_BASE}/api/onboarding/send-verification-otp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "individual" }),
    });

    const data = (await response.json()) as OtpDispatchResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to dispatch verification OTP");
    }

    return data;
  }

  const handleSendOtp = async () => {
    if (!institutionEmail.trim()) {
      setOtpError("Institutional email address is required.");
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpError(null);
      setOtpMessage(null);
      const res = await sendVerificationOtp(institutionEmail.trim());
      setIsOtpSent(true);
      setOtpMessage(res.message || "OTP code dispatched to institutional inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch code";
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ============================================================
  // Network Call: Verify OTP
  // ============================================================

  /**
   * @description Validates the 6-digit verification code against the server in-memory store
   * @param {string} email - Target academic email
   * @param {string} otp - 6-digit token
   * @returns {Promise<OtpVerifyResponse>} Verification confirmation
   * @throws {Error} Incorrect code or expired session
   */
  async function verifyOtp(email: string, otp: string): Promise<OtpVerifyResponse> {
    const response = await fetch(`${API_BASE}/api/onboarding/verify-otp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: Number(otp) }),
    });

    const data = (await response.json()) as OtpVerifyResponse;
    if (!response.ok || !data.verified) {
      throw new Error(data.message || "Invalid or expired token");
    }

    return data;
  }

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setOtpError("Enter the 6-digit numerical token.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);
      await verifyOtp(institutionEmail.trim(), otpValue.trim());
      setIsEmailVerified(true);
      setOtpMessage("Institutional email verified successfully! Verified badge granted.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ============================================================
  // Dynamic Arrays Handlers (Skills, Education, Certs, Experience)
  // ============================================================

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (target: string) => {
    setSkills(skills.filter((s) => s !== target));
  };

  const handleAddExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !expertiseList.includes(trimmed)) {
      setExpertiseList([...expertiseList, trimmed]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (target: string) => {
    setExpertiseList(expertiseList.filter((e) => e !== target));
  };

  const handleAddEducation = () => {
    if (!eduDegree.trim()) return;
    setEducationList([
      ...educationList,
      {
        education: eduDegree.trim(),
        course: eduCourse.trim(),
        timeline: eduTimeline.trim(),
        description: eduDesc.trim(),
      },
    ]);
    setEduDegree("");
    setEduCourse("");
    setEduTimeline("");
    setEduDesc("");
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
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
  };

  const handleRemoveCertification = (index: number) => {
    setCertificationsList(certificationsList.filter((_, i) => i !== index));
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
  };

  const handleRemoveExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  // ============================================================
  // Step Validation & Navigation
  // ============================================================

  const validateStep1 = () => {
    if (!name.trim()) {
      setGeneralError("Full Name is mandatory to construct your academic identity.");
      return false;
    }
    setGeneralError(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // Network Call: Submit Profile to Backend
  // ============================================================

  /**
   * @description Submits the compiled onboarding profile to the server, marking isOnboarded: true
   * @param {IndividualProfilePayload} payload - Unified profile state
   * @returns {Promise<ProfileSaveResponse>} Success confirmation
   * @throws {Error} Server validation errors or unauthorized status
   */
  async function submitProfile(payload: IndividualProfilePayload): Promise<ProfileSaveResponse> {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ProfileSaveResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to persist profile telemetry");
    }

    return data;
  }

  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setCurrentStep(1);
      setGeneralError("Full Name is required.");
      return;
    }

    const payload: IndividualProfilePayload = {
      category: "individual",
      accountType: activeRole,
      name: name.trim(),
      profileImage: profileImage || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      github: github.trim() || undefined,

      institution: selectedInstitution ? selectedInstitution.name : institutionSearchQuery.trim(),
      institutionEmail: institutionEmail.trim(),
      isEmailVerified,

      designation: activeRole === "faculty" ? designation.trim() : undefined,
      department: activeRole === "faculty" ? department.trim() : undefined,
      expertise: activeRole === "faculty" ? expertiseList : undefined,
      researchInterests: activeRole === "faculty" ? expertiseList : undefined,

      education: educationList,
      certifications: certificationsList,
      pastExperience: experienceList,
      skills,
    };

    try {
      setIsSubmitting(true);
      setGeneralError(null);
      await submitProfile(payload);

      // Hydrate Redux state so user.isOnboarded becomes true
      await dispatch(checkAuthThunk());

      // Redirect to consolidated dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profile submission failed";
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-white/95 dark:bg-zinc-900/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/onboarding/select-type"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
            >
              <div className="w-6 h-6 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">
                PortalAcademia
              </span>
            </Link>
            <span className="text-border font-light">|</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground uppercase">
              {activeRole === "faculty" ? "Faculty Immersion Setup" : "Student Competency Setup"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/onboarding/select-type"
              className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Role</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Step Progress Bar */}
        <div className="mb-8 border border-border rounded-md bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Step {currentStep} of 4:{" "}
              {currentStep === 1
                ? "Identity & Persona"
                : currentStep === 2
                ? "Institution & Verification"
                : currentStep === 3
                ? "Skills & Portfolio (Optional)"
                : "Review & Initialize"}
            </span>
            <span className="text-xs font-mono font-bold text-foreground tabular-nums">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          {/* Quick Step Indicators */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/80 text-[11px] font-mono">
            {[
              { num: 1, label: "Identity" },
              { num: 2, label: "Institution" },
              { num: 3, label: "Portfolio" },
              { num: 4, label: "Review" },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep || validateStep1()) {
                    setCurrentStep(s.num);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 py-1 px-1.5 rounded-sm transition-colors text-left",
                  currentStep === s.num
                    ? "text-foreground font-bold bg-muted"
                    : s.num < currentStep
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                <span>0{s.num}.</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Error Notice */}
        {generalError && (
          <div className="mb-6 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* ============================================================
            STEP 1: Basic Identity & Bio
            ============================================================ */}
        {currentStep === 1 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    Stakeholder Persona & Identity
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define your primary academic representation and profile information.
                  </p>
                </div>

                {/* Role Switcher Pill */}
                <div className="p-0.5 bg-muted rounded-md border border-border flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch("student")}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-medium transition-all",
                      activeRole === "student"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch("faculty")}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-medium transition-all",
                      activeRole === "faculty"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Faculty
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Avatar Upload */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Profile Avatar / Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : activeRole === "faculty" ? (
                    <BookOpenCheck className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="avatar-file-input"
                    className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, or WebP. Maximum 5MB. Hosted securely on Cloudinary.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="full-name-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  Full Legal Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Gupta or Priya Sharma"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="location-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  City & State / Location
                </label>
                <input
                  id="location-input"
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>
            </div>

            {/* Bio / Persona Pitch */}
            <div>
              <label
                htmlFor="bio-textarea"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Brief Bio / Professional Summary
              </label>
              <textarea
                id="bio-textarea"
                name="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic background, research interests, or career aspirations..."
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring resize-y"
              />
            </div>

            {/* Faculty Specific Fields */}
            {activeRole === "faculty" && (
              <div className="p-4 rounded-md border border-border bg-muted/30 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono block">
                  Faculty Credentials & Departmental Affiliation
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="designation-input"
                      className="block text-xs font-semibold text-foreground mb-1.5"
                    >
                      Academic Designation
                    </label>
                    <input
                      id="designation-input"
                      type="text"
                      name="designation"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Assistant Professor / HOD"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department-input"
                      className="block text-xs font-semibold text-foreground mb-1.5"
                    >
                      Department / School
                    </label>
                    <input
                      id="department-input"
                      type="text"
                      name="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>
                </div>

                {/* Research Interests / Expertise Tags */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Areas of Expertise & Research Interests
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddExpertise();
                        }
                      }}
                      placeholder="Type research domain (e.g. NLP, Cloud Systems) and press Enter"
                      className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                    <button
                      type="button"
                      onClick={handleAddExpertise}
                      className="h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground"
                    >
                      Add
                    </button>
                  </div>

                  {expertiseList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {expertiseList.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-background border border-border text-xs font-mono"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveExpertise(tag)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social & Professional Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="linkedin-input"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  LinkedIn Profile
                </label>
                <input
                  id="linkedin-input"
                  type="url"
                  name="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="github-input"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  GitHub / ResearchGate
                </label>
                <input
                  id="github-input"
                  type="url"
                  name="github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="website-input"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Personal Website / Portfolio
                </label>
                <input
                  id="website-input"
                  type="url"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>
            </div>

            {/* Next Step Action */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                id="next-step-1-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Continue to Institution Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: Institution Search & Email Verification
            ============================================================ */}
        {currentStep === 2 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Institutional Domain & Academic Verification
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify your affiliation with an AISHE-registered institution to unlock verified badges and campus placement telemetry.
              </p>
            </div>

            {/* AISHE Search Box */}
            <div>
              <label
                htmlFor="institution-search-input"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Search College or University (AISHE Registry)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    id="institution-search-input"
                    type="text"
                    value={institutionSearchQuery}
                    onChange={(e) => {
                      setInstitutionSearchQuery(e.target.value);
                      if (selectedInstitution && e.target.value !== selectedInstitution.name) {
                        setSelectedInstitution(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchInstitutions();
                      }
                    }}
                    placeholder="Search by college name, AISHE code (e.g. U-0275), or State..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                </div>
                <button
                  type="button"
                  id="search-institution-btn"
                  onClick={handleSearchInstitutions}
                  disabled={isSearchingInstitutions}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSearchingInstitutions ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>

              {/* Institution Dropdown List */}
              {institutionList.length > 0 && (
                <div className="mt-2 max-h-56 overflow-y-auto border border-border rounded-md divide-y divide-border bg-background shadow-md">
                  {institutionList.map((inst, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectInstitution(inst)}
                      className="p-2.5 hover:bg-muted cursor-pointer transition-colors text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{inst.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          AISHE: {inst.aisheCode || "N/A"} &bull; {inst.state}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Selection Banner */}
              {selectedInstitution && (
                <div className="mt-3 p-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold text-foreground">{selectedInstitution.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        AISHE Code: {selectedInstitution.aisheCode} &bull; {selectedInstitution.state}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInstitution(null)}
                    className="text-xs text-muted-foreground hover:text-foreground font-mono"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* AI Crawled Suggestions */}
            {isCrawlingEmails && (
              <div className="p-3 rounded-md border border-border bg-muted/40 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground" />
                <span>AI is retrieving verified email domain suggestions for {institutionSearchQuery}...</span>
              </div>
            )}

            {crawledEmails.length > 0 && (
              <div className="p-3 rounded-md border border-border bg-muted/20 space-y-2">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider font-mono block">
                  Official Email Formats Identified:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {crawledEmails.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setInstitutionEmail(email)}
                      className="px-2 py-1 rounded-sm bg-background border border-border text-xs font-mono hover:bg-muted text-foreground transition-colors"
                    >
                      {email}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Institutional Email Input & OTP Dispatch */}
            <div className="p-4 rounded-md border border-border bg-card space-y-4">
              <div>
                <label
                  htmlFor="institution-email-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  Official Institutional Email (.edu / .ac.in / college domain)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      id="institution-email-input"
                      type="email"
                      name="institutionEmail"
                      value={institutionEmail}
                      onChange={(e) => {
                        setInstitutionEmail(e.target.value);
                        setIsEmailVerified(false);
                      }}
                      placeholder="e.g. rollno@college.ac.in or faculty@iitb.ac.in"
                      disabled={isEmailVerified}
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    id="send-otp-btn"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || isEmailVerified || !institutionEmail.trim()}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isOtpSent ? "Resend OTP" : "Send OTP"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  We'll send a 6-digit one-time token to this inbox to verify academic affiliation.
                </p>
              </div>

              {/* OTP Input & Verification Row */}
              {isOtpSent && !isEmailVerified && (
                <div className="p-3 rounded-md border border-border bg-muted/30 space-y-2">
                  <label
                    htmlFor="otp-input"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Enter 6-Digit One-Time Verification Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-36 h-9 px-3 font-mono font-bold text-center tracking-widest text-sm rounded-md border border-input bg-background text-foreground focus-ring"
                    />
                    <button
                      type="button"
                      id="verify-otp-btn"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpValue.length !== 6}
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifyingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Verify Token</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Feedback Banner */}
              {otpMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {otpMessage}
                </p>
              )}
              {otpError && (
                <p className="text-xs text-destructive font-medium">
                  {otpError}
                </p>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="next-step-2-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Continue to Portfolio (Optional)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 3: Skills, Education, Certifications, Experience (Optional)
            ============================================================ */}
        {currentStep === 3 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-8">
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Competencies & Portfolio Records
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add skills, degrees, certifications, or past internships. All sections are optional and can be updated anytime!
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-sm">
                  Optional Module
                </span>
              </div>
            </div>

            {/* Section A: Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Technical & Domain Competencies
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {skills.length} skills added
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. React, PyTorch, Embedded C, Data Structures..."
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-muted text-foreground border border-border text-xs font-mono"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-muted-foreground hover:text-destructive text-sm leading-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Education */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Education & Academic Degrees ({educationList.length})
                </span>
              </div>

              {/* Education Entry Form */}
              <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="Degree (e.g. B.Tech, M.S., Ph.D)"
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                  <input
                    type="text"
                    value={eduCourse}
                    onChange={(e) => setEduCourse(e.target.value)}
                    placeholder="Course/Major (e.g. Computer Science)"
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                  <input
                    type="text"
                    value={eduTimeline}
                    onChange={(e) => setEduTimeline(e.target.value)}
                    placeholder="Timeline (e.g. 2022 - 2026)"
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                </div>
                <input
                  type="text"
                  value={eduDesc}
                  onChange={(e) => setEduDesc(e.target.value)}
                  placeholder="Additional description / GPA (optional)"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
                <button
                  type="button"
                  onClick={handleAddEducation}
                  disabled={!eduDegree.trim()}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-sm border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Education Record</span>
                </button>
              </div>

              {/* Education List */}
              {educationList.length > 0 && (
                <div className="space-y-2">
                  {educationList.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {edu.education} {edu.course && `— ${edu.course}`}
                        </p>
                        {edu.timeline && (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {edu.timeline}
                          </p>
                        )}
                        {edu.description && (
                          <p className="text-muted-foreground mt-1">{edu.description}</p>
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

            {/* Section C: Past Experience */}
            <div className="border-t border-border pt-6 space-y-4">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono block">
                Work Experience & Internships ({experienceList.length})
              </span>

              <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="Role Title (e.g. AI Research Intern at DRDO)"
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                  <input
                    type="text"
                    value={expTimeline}
                    onChange={(e) => setExpTimeline(e.target.value)}
                    placeholder="Timeline (e.g. May 2024 - Aug 2024)"
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                  />
                </div>
                <textarea
                  rows={2}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Key contributions and technologies utilized..."
                  className="w-full p-2 rounded-md border border-input bg-background text-xs text-foreground focus-ring resize-y"
                />
                <button
                  type="button"
                  onClick={handleAddExperience}
                  disabled={!expTitle.trim()}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-sm border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Experience Entry</span>
                </button>
              </div>

              {experienceList.length > 0 && (
                <div className="space-y-2">
                  {experienceList.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        {exp.timeline && (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {exp.timeline}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-muted-foreground mt-1">{exp.description}</p>
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

            {/* Section D: Certifications */}
            <div className="border-t border-border pt-6 space-y-4">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono block">
                Certifications & Accreditations ({certificationsList.length})
              </span>

              <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3">
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="Certification Name (e.g. AWS Certified Solutions Architect)"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
                <input
                  type="text"
                  value={certDesc}
                  onChange={(e) => setCertDesc(e.target.value)}
                  placeholder="Issuing Organization & Credential ID (optional)"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  disabled={!certTitle.trim()}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-sm border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Certification</span>
                </button>
              </div>

              {certificationsList.length > 0 && (
                <div className="space-y-2">
                  {certificationsList.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-border bg-card flex items-start justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{cert.title}</p>
                        {cert.description && (
                          <p className="text-muted-foreground mt-0.5">{cert.description}</p>
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

            {/* Navigation Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="next-step-3-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Proceed to Final Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 4: Review & Final Submission
            ============================================================ */}
        {currentStep === 4 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Review Profile Parameters & Confirm Initialization
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify your submitted stakeholder attributes. Once confirmed, your specialized console workspace will be generated.
              </p>
            </div>

            {/* High Density Key-Value Split Rows */}
            <div className="rounded-md border border-border divide-y divide-border text-xs">
              <div className="px-4 py-2.5 bg-muted/40 flex items-center justify-between font-mono font-semibold">
                <span>IDENTITY PARAMETERS</span>
                <span className="uppercase text-foreground">{activeRole}</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-semibold text-foreground">{name || "Not provided"}</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="text-foreground">{location || "Not specified"}</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Institution:</span>
                <span className="font-semibold text-foreground">
                  {selectedInstitution?.name || institutionSearchQuery || "Not specified"}
                </span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Institutional Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-foreground">
                    {institutionEmail || "Not provided"}
                  </span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      (Unverified)
                    </span>
                  )}
                </div>
              </div>

              {activeRole === "faculty" && (
                <>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Designation & Dept:</span>
                    <span className="text-foreground">
                      {designation} &bull; {department}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Research Interests:</span>
                    <span className="font-mono text-foreground">
                      {expertiseList.length > 0 ? expertiseList.join(", ") : "None specified"}
                    </span>
                  </div>
                </>
              )}

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Skills Recorded:</span>
                <span className="font-mono tabular-nums text-foreground">
                  {skills.length} skills ({skills.slice(0, 4).join(", ")}
                  {skills.length > 4 ? ` +${skills.length - 4} more` : ""})
                </span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Education & Experience:</span>
                <span className="font-mono tabular-nums text-foreground">
                  {educationList.length} degrees, {experienceList.length} experiences, {certificationsList.length} certs
                </span>
              </div>
            </div>

            {/* Final Dispatch Button */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Portfolio</span>
              </button>

              <button
                type="button"
                id="submit-individual-onboarding-btn"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-9 px-5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Initializing Telemetry Console…</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding & Enter Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
