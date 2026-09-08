import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
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

export type OrganizationType = "institution" | "industry";

export interface AisheInstitution {
  name: string;
  aisheCode: string;
  state: string;
  district?: string;
}

export interface OrganizationProfilePayload {
  category: "organization";
  accountType: OrganizationType;
  name: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  isEmailVerified: boolean;

  // Institution specific
  institutionName?: string;
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

interface UploadResponse {
  success: boolean;
  message: string;
  url: string;
  publicId?: string;
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

const INDUSTRY_DOMAINS = [
  "Information Technology & Software",
  "Artificial Intelligence & Machine Learning",
  "Biotechnology, Pharma & Healthcare",
  "Robotics & Advanced Manufacturing",
  "Banking, Financial Services & FinTech",
  "Energy, CleanTech & Sustainability",
  "Telecommunications & Networking",
  "Consulting, Audit & Professional Services",
  "Aerospace & Defense Engineering",
  "Automotive & Electric Mobility",
  "Other Industry Sector",
];

const WORKFORCE_RANGES = [
  "1-10 employees (Early Stage)",
  "11-50 employees (Startup)",
  "51-200 employees (Mid-sized)",
  "201-500 employees (Growth Enterprise)",
  "501-1000 employees (Large Enterprise)",
  "1000+ employees (Multinational)",
];

// ============================================================
// Main Component
// ============================================================

export default function OnboardingOrganization() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  // Read organization subtype from query param or default to institution
  const typeParam = searchParams.get("type");
  const activeType: OrganizationType = typeParam === "industry" ? "industry" : "institution";

  // Wizard Step: 1 (Basic Identity), 2 (Governance / Entity Details), 3 (Official Email OTP), 4 (Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Common Entity Fields
  const [orgName, setOrgName] = useState<string>("");
  const [orgLogo, setOrgLogo] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");

  // Institution Specifics
  const [aisheCode, setAisheCode] = useState<string>("");
  const [officialEmail, setOfficialEmail] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");

  // AISHE Search Helper
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionList, setInstitutionList] = useState<AisheInstitution[]>([]);
  const [isSearchingAishe, setIsSearchingAishe] = useState<boolean>(false);

  // Industry Specifics
  const [companyName, setCompanyName] = useState<string>("");
  const [industryType, setIndustryType] = useState<string>(INDUSTRY_DOMAINS[0]);
  const [employees, setEmployees] = useState<string>(WORKFORCE_RANGES[1]);
  const [workEmail, setWorkEmail] = useState<string>("");

  // OTP Verification State
  const [otpValue, setOtpValue] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Upload & Submission State
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Prepopulate email if available from user session
  useEffect(() => {
    if (user?.email) {
      if (activeType === "institution" && !officialEmail) {
        setOfficialEmail(user.email);
      } else if (activeType === "industry" && !workEmail) {
        setWorkEmail(user.email);
      }
    }
  }, [user, activeType]);

  const handleTypeSwitch = (newType: OrganizationType) => {
    setSearchParams({ type: newType });
  };

  // ============================================================
  // Network Call: Upload Logo
  // ============================================================

  /**
   * @description Uploads an organization emblem or company logo to Cloudinary
   * @param {File} file - Raw image file
   * @returns {Promise<string>} Secure URL of uploaded logo
   * @throws {Error} Upload error handling
   */
  async function uploadOrgLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "portal_academia/organizations");

    const response = await fetch(`${API_BASE}/api/upload/single`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errData = (await response.json()) as { message?: string };
      throw new Error(errData.message || "Failed to upload logo asset");
    }

    const data = (await response.json()) as UploadResponse;
    return data.url;
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setGeneralError(null);
      const url = await uploadOrgLogo(file);
      setOrgLogo(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Logo upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ============================================================
  // Network Call: AISHE Lookup
  // ============================================================

  /**
   * @description Searches AISHE institution database for institutional verification
   * @param {string} query - College name or AISHE code substring
   * @returns {Promise<AisheInstitution[]>} Matched colleges
   * @throws {Error} Network failure handling
   */
  async function searchAishe(query: string): Promise<AisheInstitution[]> {
    const response = await fetch(
      `${API_BASE}/api/onboarding/institutions?search=${encodeURIComponent(query)}&limit=15`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search AISHE registry");
    }

    const data = (await response.json()) as InstitutionsSearchResponse;
    return data.institutions || [];
  }

  const handleSearchAishe = async () => {
    if (!institutionSearchQuery.trim()) return;
    try {
      setIsSearchingAishe(true);
      setGeneralError(null);
      const results = await searchAishe(institutionSearchQuery);
      setInstitutionList(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setGeneralError(msg);
    } finally {
      setIsSearchingAishe(false);
    }
  };

  const handleSelectAisheInstitution = (inst: AisheInstitution) => {
    setOrgName(inst.name);
    setAisheCode(inst.aisheCode);
    setLocation(inst.state);
    setInstitutionSearchQuery(inst.name);
    setInstitutionList([]);
  };

  // ============================================================
  // Network Call: Send Organization OTP
  // ============================================================

  /**
   * @description Sends a 6-digit verification code to the official administrative / work email
   * @param {string} email - Official domain email
   * @returns {Promise<OtpDispatchResponse>} Status confirmation
   * @throws {Error} Dispatch rejection
   */
  async function sendOrgVerificationOtp(email: string): Promise<OtpDispatchResponse> {
    const response = await fetch(`${API_BASE}/api/onboarding/send-verification-otp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "organization" }),
    });

    const data = (await response.json()) as OtpDispatchResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to dispatch verification code");
    }

    return data;
  }

  const handleSendOtp = async () => {
    const targetEmail = activeType === "institution" ? officialEmail : workEmail;
    if (!targetEmail.trim()) {
      setOtpError("Official email address is required.");
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpError(null);
      setOtpMessage(null);
      const res = await sendOrgVerificationOtp(targetEmail.trim());
      setIsOtpSent(true);
      setOtpMessage(res.message || "Verification code dispatched to official inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch token";
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ============================================================
  // Network Call: Verify OTP
  // ============================================================

  /**
   * @description Validates the 6-digit OTP code against server storage
   * @param {string} email - Target official email
   * @param {string} otp - 6-digit string
   * @returns {Promise<OtpVerifyResponse>} Verification status
   * @throws {Error} Verification failure
   */
  async function verifyOrgOtp(email: string, otp: string): Promise<OtpVerifyResponse> {
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
    const targetEmail = activeType === "institution" ? officialEmail : workEmail;
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6-digit numerical code.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);
      await verifyOrgOtp(targetEmail.trim(), otpValue.trim());
      setIsEmailVerified(true);
      setOtpMessage("Official domain verified successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ============================================================
  // Step Navigation & Validation
  // ============================================================

  const validateStep1 = () => {
    const resolvedName = activeType === "institution" ? orgName : companyName;
    if (!resolvedName.trim()) {
      setGeneralError(
        activeType === "institution"
          ? "Institution name is required."
          : "Company / Enterprise name is required."
      );
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
  // Network Call: Submit Organization Profile
  // ============================================================

  /**
   * @description Persists organization profile data and marks isOnboarded: true
   * @param {OrganizationProfilePayload} payload - Unified organization model
   * @returns {Promise<ProfileSaveResponse>} Success confirmation
   * @throws {Error} Profile validation error
   */
  async function submitOrgProfile(payload: OrganizationProfilePayload): Promise<ProfileSaveResponse> {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ProfileSaveResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to persist organization parameters");
    }

    return data;
  }

  const handleFinalSubmit = async () => {
    const finalName = activeType === "institution" ? orgName.trim() : companyName.trim();
    if (!finalName) {
      setCurrentStep(1);
      setGeneralError("Organization name is required.");
      return;
    }

    const payload: OrganizationProfilePayload = {
      category: "organization",
      accountType: activeType,
      name: finalName,
      profileImage: orgLogo || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      isEmailVerified,

      institutionName: activeType === "institution" ? finalName : undefined,
      aisheCode: activeType === "institution" ? aisheCode.trim() : undefined,
      officialEmail: activeType === "institution" ? officialEmail.trim() : undefined,
      contact: activeType === "institution" ? contactNumber.trim() : undefined,

      companyName: activeType === "industry" ? finalName : undefined,
      industryType: activeType === "industry" ? industryType : undefined,
      officialWebsite: activeType === "industry" ? website.trim() : undefined,
      workEmail: activeType === "industry" ? workEmail.trim() : undefined,
      employees: activeType === "industry" ? employees : undefined,
    };

    try {
      setIsSubmitting(true);
      setGeneralError(null);
      await submitOrgProfile(payload);

      // Refresh session
      await dispatch(checkAuthThunk());

      // Navigate to consolidated dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to complete onboarding";
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors pb-16">
      {/* Top Bar */}
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
              {activeType === "institution"
                ? "Academic Institution Setup"
                : "Industry & Recruiter Setup"}
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
              <span className="hidden sm:inline">Change Type</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Step Progress Bar */}
        <div className="mb-8 border border-border rounded-md bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Step {currentStep} of 4:{" "}
              {currentStep === 1
                ? "Organization Identity"
                : currentStep === 2
                ? activeType === "institution"
                  ? "AISHE Governance Details"
                  : "Industry & Operations"
                : currentStep === 3
                ? "Official Email Verification"
                : "Review & Provision Console"}
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

          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/80 text-[11px] font-mono">
            {[
              { num: 1, label: "Entity" },
              { num: 2, label: activeType === "institution" ? "AISHE" : "Sector" },
              { num: 3, label: "Verify" },
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

        {/* Global Error Banner */}
        {generalError && (
          <div className="mb-6 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* ============================================================
            STEP 1: Organization Primary Identity
            ============================================================ */}
        {currentStep === 1 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    Organization Entity Registration
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure official representation for candidate discovery or cohort telemetry.
                  </p>
                </div>

                {/* Subtype Switcher */}
                <div className="p-0.5 bg-muted rounded-md border border-border flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => handleTypeSwitch("institution")}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-medium transition-all",
                      activeType === "institution"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Institution
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeSwitch("industry")}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-medium transition-all",
                      activeType === "industry"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Industry
                  </button>
                </div>
              </div>
            </div>

            {/* Logo / Emblem Upload */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Official Logo / Emblem
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
                  {orgLogo ? (
                    <img
                      src={orgLogo}
                      alt="Organization Logo Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : activeType === "institution" ? (
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="logo-file-input"
                    className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                  </label>
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Square PNG or SVG with transparent background recommended. Maximum 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="org-name-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  {activeType === "institution" ? "Institution Legal Name" : "Company / Enterprise Name"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  id="org-name-input"
                  type="text"
                  value={activeType === "institution" ? orgName : companyName}
                  onChange={(e) => {
                    if (activeType === "institution") {
                      setOrgName(e.target.value);
                    } else {
                      setCompanyName(e.target.value);
                    }
                  }}
                  placeholder={
                    activeType === "institution"
                      ? "e.g. Indian Institute of Technology Bombay"
                      : "e.g. Tata Consultancy Services or Microsoft India"
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="org-location-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  Headquarters / Campus Location
                </label>
                <input
                  id="org-location-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>
            </div>

            {/* Website & LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="org-website-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  Official Website URL
                </label>
                <input
                  id="org-website-input"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.company.com or https://www.college.ac.in"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="org-linkedin-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  LinkedIn Organization Profile
                </label>
                <input
                  id="org-linkedin-input"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/organization-name"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                />
              </div>
            </div>

            {/* Bio / Mission Overview */}
            <div>
              <label
                htmlFor="org-bio-textarea"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Overview / Purpose Statement
              </label>
              <textarea
                id="org-bio-textarea"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  activeType === "institution"
                    ? "Accreditation status, academic faculties, and student enrollment scale..."
                    : "Core products, engineering pillars, and hiring objectives..."
                }
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring resize-y"
              />
            </div>

            {/* Continue Button */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                id="org-next-step-1-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Continue to Operational Parameters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: Subtype Operational & Governance Details
            ============================================================ */}
        {currentStep === 2 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {activeType === "institution"
                  ? "AISHE Institutional Registry & Accreditation"
                  : "Industry Domain & Talent Scale"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeType === "institution"
                  ? "Bind your portal to official Ministry of Education AISHE metrics."
                  : "Specify hiring requirements, employee tier, and domain specialization."}
              </p>
            </div>

            {/* Institution Specifics */}
            {activeType === "institution" ? (
              <div className="space-y-4">
                {/* AISHE Search Tool */}
                <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-3">
                  <label
                    htmlFor="aishe-search-input"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Quick Lookup in AISHE National Database
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="aishe-search-input"
                      type="text"
                      value={institutionSearchQuery}
                      onChange={(e) => setInstitutionSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchAishe();
                        }
                      }}
                      placeholder="Search college name or AISHE code..."
                      className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                    <button
                      type="button"
                      onClick={handleSearchAishe}
                      disabled={isSearchingAishe}
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSearchingAishe ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Lookup</span>
                    </button>
                  </div>

                  {institutionList.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border bg-background shadow-sm">
                      {institutionList.map((inst, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectAisheInstitution(inst)}
                          className="p-2.5 hover:bg-muted cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{inst.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              AISHE: {inst.aisheCode} &bull; {inst.state}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">
                            Auto-Fill
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="aishe-code-input"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                    >
                      AISHE Institutional Code
                    </label>
                    <input
                      id="aishe-code-input"
                      type="text"
                      value={aisheCode}
                      onChange={(e) => setAisheCode(e.target.value)}
                      placeholder="e.g. U-0275 or C-12345"
                      className="w-full h-9 px-3 font-mono rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-number-input"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                    >
                      Official Administrative Contact
                    </label>
                    <input
                      id="contact-number-input"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+91 (022) 2576-7000"
                      className="w-full h-9 px-3 font-mono rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Industry Specifics */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="industry-type-select"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                    >
                      Industry Sector / Domain
                    </label>
                    <select
                      id="industry-type-select"
                      value={industryType}
                      onChange={(e) => setIndustryType(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    >
                      {INDUSTRY_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="employees-tier-select"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                    >
                      Workforce Scale
                    </label>
                    <select
                      id="employees-tier-select"
                      value={employees}
                      onChange={(e) => setEmployees(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    >
                      {WORKFORCE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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
                id="org-next-step-2-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Proceed to Official Email Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 3: Official / Work Email OTP Verification
            ============================================================ */}
        {currentStep === 3 && (
          <div className="rounded-md border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Domain Authenticity & Cryptographic Verification
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify authority over your organization's domain via email token.
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-card space-y-4">
              <div>
                <label
                  htmlFor="org-official-email-input"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
                >
                  {activeType === "institution"
                    ? "Official Registrar / Administrative Email"
                    : "Corporate Recruiter / HR Work Email"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      id="org-official-email-input"
                      type="email"
                      value={activeType === "institution" ? officialEmail : workEmail}
                      onChange={(e) => {
                        if (activeType === "institution") {
                          setOfficialEmail(e.target.value);
                        } else {
                          setWorkEmail(e.target.value);
                        }
                        setIsEmailVerified(false);
                      }}
                      placeholder={
                        activeType === "institution"
                          ? "registrar@iitb.ac.in or dean.admin@college.ac.in"
                          : "campus-recruitment@company.com or hr@corp.com"
                      }
                      disabled={isEmailVerified}
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    id="org-send-otp-btn"
                    onClick={handleSendOtp}
                    disabled={
                      isSendingOtp ||
                      isEmailVerified ||
                      !(activeType === "institution" ? officialEmail : workEmail).trim()
                    }
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isOtpSent ? "Resend Token" : "Send Code"}</span>
                  </button>
                </div>
              </div>

              {/* OTP Input Block */}
              {isOtpSent && !isEmailVerified && (
                <div className="p-3.5 rounded-md border border-border bg-muted/30 space-y-2">
                  <label
                    htmlFor="org-otp-input"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Enter 6-Digit Organization Verification Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="org-otp-input"
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-36 h-9 px-3 font-mono font-bold text-center tracking-widest text-sm rounded-md border border-input bg-background text-foreground focus-ring"
                    />
                    <button
                      type="button"
                      id="org-verify-otp-btn"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpValue.length !== 6}
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifyingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Verify Code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback messages */}
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
                id="org-next-step-3-btn"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <span>Proceed to Confirmation</span>
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
                Review Organization Telemetry & Initialize Console
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirm your legal stakeholder parameters before activating portal permissions.
              </p>
            </div>

            {/* High Density Definition Table */}
            <div className="rounded-md border border-border divide-y divide-border text-xs">
              <div className="px-4 py-2.5 bg-muted/40 flex items-center justify-between font-mono font-semibold">
                <span>ENTITY SPECIFICATION</span>
                <span className="uppercase text-foreground">{activeType}</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Entity Legal Name:</span>
                <span className="font-semibold text-foreground">
                  {activeType === "institution" ? orgName : companyName}
                </span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Headquarters Location:</span>
                <span className="text-foreground">{location || "Not specified"}</span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">Official Website:</span>
                <span className="font-mono text-foreground">{website || "Not provided"}</span>
              </div>

              {activeType === "institution" ? (
                <>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">AISHE Code:</span>
                    <span className="font-mono text-foreground">{aisheCode || "Pending"}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Administrative Contact:</span>
                    <span className="font-mono text-foreground">{contactNumber || "N/A"}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Registrar Email:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-foreground">{officialEmail}</span>
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
                </>
              ) : (
                <>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Industry Sector:</span>
                    <span className="text-foreground">{industryType}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Workforce Size:</span>
                    <span className="text-foreground">{employees}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Work Email:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-foreground">{workEmail}</span>
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
                </>
              )}
            </div>

            {/* Submission Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Parameters</span>
              </button>

              <button
                type="button"
                id="submit-org-onboarding-btn"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-9 px-5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Configuring Organization Workspace…</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Launch Console</span>
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
