import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Camera,
  Globe,
  Users,
  Sparkles,
  MapPin,
  ChevronDown,
  Plus,
  Minus,
  ArrowRight,
  School,
  Lock,
  Mail,
  ExternalLink,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { City, State } from "country-state-city";
import { useAppDispatch } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

// ============================================================
// Constants & Types
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
  headline?: string;
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
// Main Component: OnboardingOrganization (Right Side of Sketch)
// ============================================================

export default function OnboardingOrganization() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  // Subtype: institution vs industry
  const typeParam = searchParams.get("type");
  const activeType: OrganizationType = typeParam === "industry" ? "industry" : "institution";

  // Common Entity Fields
  const [orgLogo, setOrgLogo] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState<boolean>(false);

  // Institution Fields
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [selectedInstitution, setSelectedInstitution] = useState<AisheInstitution | null>(null);
  const [institutionSuggestions, setInstitutionSuggestions] = useState<AisheInstitution[]>([]);
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState<boolean>(false);
  const [isSearchingInstitutions, setIsSearchingInstitutions] = useState<boolean>(false);

  // Institution Official Email & Grok AI Crawled Emails
  const [officialEmail, setOfficialEmail] = useState<string>("");
  const [crawledEmails, setCrawledEmails] = useState<string[]>([]);
  const [isCrawlingEmails, setIsCrawlingEmails] = useState<boolean>(false);
  const [isManualEmailInput, setIsManualEmailInput] = useState<boolean>(false);

  // Industry Fields
  const [companyName, setCompanyName] = useState<string>("");
  const [industryType, setIndustryType] = useState<string>(INDUSTRY_DOMAINS[0]);
  const [officialWebsite, setOfficialWebsite] = useState<string>("");
  const [workEmail, setWorkEmail] = useState<string>("");
  const [employees, setEmployees] = useState<string>(WORKFORCE_RANGES[1]);

  // OTP Verification State
  const [otpValue, setOtpValue] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verifiedContactEmail, setVerifiedContactEmail] = useState<string>("");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // City Search State (country-state-city)
  const [cityInput, setCityInput] = useState<string>("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const [citySuggestions, setCitySuggestions] = useState<{
    name: string;
    stateName: string;
    countryCode: string;
  }[]>([]);

  // General Loading & Status
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Role toggle
  const handleTypeSwitch = (newType: OrganizationType) => {
    setSearchParams({ type: newType });
    setIsEmailVerified(false);
    setIsOtpSent(false);
    setOtpValue("");
    setOtpMessage(null);
    setOtpError(null);
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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      setGeneralError(null);
      const url = await uploadFileToCloudinary(file, "portal_academia/organizations");
      setOrgLogo(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Logo upload failed";
      setGeneralError(msg);
    } finally {
      setIsUploadingLogo(false);
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
  // AISHE Institution Search
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

  // Debounced search for AISHE institution name
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

  /**
   * @description Uses Grok AI endpoint to search and crawl authentic registrar/academic emails for the selected college
   */
  async function crawlEmailsWithGrok(institutionName: string) {
    try {
      setIsCrawlingEmails(true);
      const response = await fetch(`${API_BASE}/api/onboarding/crawl-college-emails`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.emails && Array.isArray(data.emails) && data.emails.length > 0) {
          setCrawledEmails(data.emails);
          setOfficialEmail(data.emails[0]); // pre-select first email found
          setIsManualEmailInput(false);
        }
      }
    } catch (err) {
      console.warn("Email crawl failed:", err);
    } finally {
      setIsCrawlingEmails(false);
    }
  }

  const handleSelectInstitution = async (inst: AisheInstitution) => {
    setSelectedInstitution(inst);
    setInstitutionSearchQuery(inst.name);
    setInstitutionDropdownOpen(false);
    setInstitutionSuggestions([]);
    setIsEmailVerified(false);
    setIsOtpSent(false);
    setOtpValue("");
    setOtpMessage(null);
    setOtpError(null);

    if (inst.state && !location) {
      setLocation(inst.state);
      setCityInput(inst.state);
    }

    // Call official email discovery immediately
    await crawlEmailsWithGrok(inst.name);
  };

  // ============================================================
  // OTP Dispatch & Verification
  // ============================================================

  const getTargetEmail = () => {
    if (activeType === "institution") {
      return officialEmail.trim();
    }
    return workEmail.trim();
  };

  const handleSendOtp = async () => {
    const targetEmail = getTargetEmail();
    if (!targetEmail) {
      setOtpError(
        activeType === "institution"
          ? "Please select or enter an official institutional email."
          : "Please enter your work email."
      );
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
        body: JSON.stringify({ email: targetEmail, purpose: "organization" }),
      });

      const data = (await response.json()) as OtpDispatchResponse;
      if (!response.ok) {
        throw new Error(data.message || "Failed to dispatch OTP");
      }

      setIsOtpSent(true);
      setOtpMessage(`OTP code dispatched to ${targetEmail}. Enter the 6-digit code below to verify.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code";
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const targetEmail = getTargetEmail();
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP code.");
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
          email: targetEmail,
          otp: Number(otpValue.trim()),
          purpose: "organization",
        }),
      });

      const data = (await response.json()) as OtpVerifyResponse;
      if (!response.ok || !data.verified) {
        throw new Error(data.message || "Invalid OTP code");
      }

      setIsEmailVerified(true);
      setVerifiedContactEmail(targetEmail);
      setOtpMessage("Email verified successfully!");
      setOtpError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ============================================================
  // Form Submission
  // ============================================================

  async function submitOrgProfile(payload: OrganizationProfilePayload): Promise<ProfileSaveResponse> {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ProfileSaveResponse;
    if (!response.ok) {
      throw new Error(data.message || "Failed to persist organization profile");
    }

    return data;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entityName = activeType === "institution" ? (selectedInstitution ? selectedInstitution.name : institutionSearchQuery.trim()) : companyName.trim();

    if (!entityName) {
      setGeneralError(activeType === "institution" ? "Please select or type your institution name." : "Please enter your company name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (activeType === "institution" && !isEmailVerified) {
      setGeneralError("Please verify your official institutional email via OTP before completing onboarding.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload: OrganizationProfilePayload = {
      category: "organization",
      accountType: activeType,
      name: entityName,
      headline: headline.trim() || undefined,
      profileImage: orgLogo || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: (activeType === "industry" ? officialWebsite.trim() : website.trim()) || undefined,
      linkedin: linkedin.trim() || undefined,
      isEmailVerified,

      // Institution specifics
      institutionName: activeType === "institution" ? entityName : undefined,
      aisheCode: activeType === "institution" ? selectedInstitution?.aisheCode : undefined,
      officialEmail: activeType === "institution" ? officialEmail.trim() : undefined,
      contact: activeType === "institution" ? verifiedContactEmail.trim() || officialEmail.trim() : undefined,

      // Industry specifics
      companyName: activeType === "industry" ? entityName : undefined,
      industryType: activeType === "industry" ? industryType : undefined,
      officialWebsite: activeType === "industry" ? officialWebsite.trim() : undefined,
      workEmail: activeType === "industry" ? workEmail.trim() : undefined,
      employees: activeType === "industry" ? employees : undefined,
    };

    try {
      setIsSubmitting(true);
      setGeneralError(null);
      await submitOrgProfile(payload);
      await dispatch(checkAuthThunk());
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-foreground selection:text-background transition-colors duration-200 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md px-4 sm:px-8 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
              PA
            </div>
            <span className="font-bold text-base tracking-tight">PortalAcademia</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs hidden sm:inline">&bull;</span>
          <span className="text-xs text-muted-foreground font-mono hidden sm:inline-flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Organization Verification
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Category Switcher Pill */}
          <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/40 text-xs font-medium">
            <Link
              to="/onboarding/individual"
              className="px-3 py-1 rounded-md text-muted-foreground hover:text-foreground transition-all"
            >
              Individual
            </Link>
            <span className="px-3 py-1 rounded-md bg-background font-semibold text-foreground shadow-xs border border-border/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Organization
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-8 sm:py-10 flex-1">
        {/* Page Hero Title */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono font-medium text-primary mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Institutional & Enterprise Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {activeType === "institution" ? "Accredited Institution Profile" : "Enterprise & Industry Partner Profile"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            {activeType === "institution"
              ? "Verify official university domain, link AISHE accreditation, and establish authentic academic presence."
              : "Connect your enterprise with academic talent, research labs, and faculty innovation."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Alert */}
          {generalError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          {/* Master Form Card */}
          <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xs p-6 sm:p-8 shadow-sm space-y-6">
            {/* Top: Emblem / Logo Upload Zone */}
            <div className="flex flex-col items-center justify-center text-center pb-2">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-border/90 bg-muted/30 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-primary/60 transition-all">
                  {orgLogo ? (
                    <img
                      src={orgLogo}
                      alt="Organization Emblem"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5 opacity-70" />
                      </div>
                      <span className="text-[10px] font-mono font-medium">Emblem / Crest</span>
                    </div>
                  )}

                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="org-logo-upload-input"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-foreground text-background border-2 border-background flex items-center justify-center cursor-pointer shadow-md hover:scale-110 active:scale-95 transition-all"
                  title="Upload organization logo"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="org-logo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">
                {activeType === "institution" ? "Upload official university crest or seal" : "Upload official corporate brand logo"}
              </p>
            </div>

            {/* Role Switcher Cards: Institution vs Industry */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 font-mono">
                Organization Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Institution */}
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("institution")}
                  className={cn(
                    "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative",
                    activeType === "institution"
                      ? "border-foreground/80 dark:border-primary/80 bg-foreground/5 dark:bg-primary/5 shadow-xs ring-1 ring-foreground/20"
                      : "border-border/70 bg-background hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    activeType === "institution"
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xs font-bold", activeType === "institution" ? "text-foreground" : "text-muted-foreground")}>
                        Institution
                      </h4>
                      {activeType === "institution" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Colleges, Universities & AISHE recognized bodies
                    </p>
                  </div>
                </button>

                {/* Option 2: Industry */}
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("industry")}
                  className={cn(
                    "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative",
                    activeType === "industry"
                      ? "border-foreground/80 dark:border-primary/80 bg-foreground/5 dark:bg-primary/5 shadow-xs ring-1 ring-foreground/20"
                      : "border-border/70 bg-background hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    activeType === "industry"
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xs font-bold", activeType === "industry" ? "text-foreground" : "text-muted-foreground")}>
                        Industry
                      </h4>
                      {activeType === "industry" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Enterprises, Startups & R&D Corporations
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ============================================================
                CASE 1: INSTITUTION ONBOARDING
                ============================================================ */}
            {activeType === "institution" && (
              <div className="space-y-5 pt-3 border-t border-border/80 animate-in fade-in duration-200">
                {/* 1. Institution Name (AISHE Lookup) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Institution Name <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                      AISHE Integrated
                    </span>
                  </div>

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
                      placeholder="Type college or university name (e.g. DIT University, IIT Delhi...)"
                      className="w-full h-10 pl-9 pr-9 rounded-lg border border-input bg-background text-xs text-foreground focus-ring font-medium"
                      autoComplete="off"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                    {isSearchingInstitutions && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-3 text-primary animate-spin" />
                    )}
                  </div>

                  {/* AISHE Suggestions Dropdown */}
                  {institutionDropdownOpen && institutionSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border/60 bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95">
                      {institutionSuggestions.map((inst, idx) => (
                        <button
                          key={`${inst.aisheCode}-${idx}`}
                          type="button"
                          onClick={() => handleSelectInstitution(inst)}
                          className="w-full p-3 text-left hover:bg-muted/80 cursor-pointer text-xs flex items-center justify-between group transition-colors"
                        >
                          <div className="flex-1 pr-3">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {inst.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                AISHE: {inst.aisheCode}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                &bull; {inst.state}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-foreground text-background shrink-0 group-hover:opacity-90 transition-opacity">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Institution Card */}
                  {selectedInstitution && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <School className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-xs">{selectedInstitution.name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                            <span>Code: {selectedInstitution.aisheCode}</span>
                            <span>&bull;</span>
                            <span>{selectedInstitution.state}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInstitution(null)}
                        className="text-[11px] font-mono text-muted-foreground hover:text-foreground underline px-2 py-1"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Official Institutional Email (Found by AI Crawler) + Send OTP */}
                <div className="p-4 sm:p-5 rounded-xl border border-border/90 bg-muted/20 space-y-3.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Official Institutional Email
                      </span>
                      {crawledEmails.length > 0 && (
                        <span className="text-[10px] font-mono bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20 hidden sm:inline">
                          AI Discovered
                        </span>
                      )}
                    </div>
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Domain
                      </span>
                    ) : isOtpSent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Verification Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted border border-border px-2.5 py-0.5 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Unverified
                      </span>
                    )}
                  </div>

                  {/* Grok AI Loading State */}
                  {isCrawlingEmails && (
                    <div className="p-3 rounded-lg bg-background border border-border/80 flex items-center gap-2.5 text-xs text-muted-foreground animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                      <span>Discovering official verified registrar & academic emails for <strong>{selectedInstitution?.name}</strong>...</span>
                    </div>
                  )}

                  {/* Email Input / Selection Box */}
                  {!isCrawlingEmails && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {crawledEmails.length > 0 && !isManualEmailInput ? (
                          <div className="relative flex-1">
                            <select
                              value={officialEmail}
                              onChange={(e) => {
                                setOfficialEmail(e.target.value);
                                setIsEmailVerified(false);
                                setIsOtpSent(false);
                              }}
                              disabled={isEmailVerified}
                              className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-xs text-foreground focus-ring font-mono disabled:opacity-60 cursor-pointer"
                            >
                              {crawledEmails.map((email) => (
                                <option key={email} value={email}>
                                  {email}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative flex-1">
                            <input
                              type="email"
                              value={officialEmail}
                              onChange={(e) => {
                                setOfficialEmail(e.target.value);
                                setIsEmailVerified(false);
                                setIsOtpSent(false);
                              }}
                              disabled={isEmailVerified}
                              placeholder="e.g. registrar@college.edu.in or admin@university.ac.in"
                              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring disabled:opacity-60 font-mono"
                            />
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || !officialEmail.trim() || isEmailVerified}
                          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-xs"
                        >
                          {isSendingOtp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Send OTP</span>
                        </button>
                      </div>

                      {/* Manual input toggle */}
                      {crawledEmails.length > 0 && !isEmailVerified && (
                        <div className="flex justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => setIsManualEmailInput(!isManualEmailInput)}
                            className="text-[11px] text-muted-foreground hover:text-foreground font-mono underline transition-colors cursor-pointer"
                          >
                            {isManualEmailInput
                              ? "← Pick from AI discovered emails"
                              : "+ Enter specific departmental email"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OTP Input Section */}
                  {isOtpSent && !isEmailVerified && (
                    <div className="pt-3 border-t border-border/70 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                          Enter 6-Digit Verification Token
                        </label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Dispatched to {officialEmail}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••"
                          className="w-36 h-10 px-3 text-center tracking-widest font-mono text-sm font-bold rounded-lg border border-input bg-background text-foreground focus-ring"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpValue.length !== 6}
                          className="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Verify OTP</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="text-xs text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer self-center"
                        >
                          Resend Code
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMessage && (
                    <p
                      className={cn(
                        "text-[11px] font-mono font-medium",
                        isEmailVerified
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {isEmailVerified ? `✓ ${otpMessage}` : `ℹ ${otpMessage}`}
                    </p>
                  )}
                  {otpError && (
                    <p className="text-[11px] text-destructive font-mono font-medium">
                      ✕ {otpError}
                    </p>
                  )}
                </div>

                {/* 3. Contact (Readonly Verified Email) */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Official Contact Identifier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={isEmailVerified ? verifiedContactEmail : officialEmail || "Awaiting institutional OTP verification..."}
                      className={cn(
                        "w-full h-10 pl-9 pr-9 rounded-lg border text-xs font-mono transition-colors",
                        isEmailVerified
                          ? "bg-emerald-500/5 border-emerald-500/30 text-foreground font-semibold"
                          : "bg-muted/20 border-input text-muted-foreground"
                      )}
                    />
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                    {isEmailVerified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute right-3 top-3" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    This email is cryptographically bound to your institution profile for authentic access.
                  </p>
                </div>

                {/* 4. Location Dropdown (City/State via country-state-city) */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Campus Location (City / State)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={() => {
                        if (citySuggestions.length > 0) setCityDropdownOpen(true);
                      }}
                      placeholder="Type campus city name (e.g. Dehradun, Bengaluru, New Delhi...)"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                      autoComplete="off"
                    />
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  </div>

                  {cityDropdownOpen && citySuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl text-xs py-1 divide-y divide-border/50 animate-in fade-in">
                      {citySuggestions.map((city, idx) => (
                        <button
                          key={`${city.name}-${city.stateName}-${idx}`}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-muted/80 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="font-semibold text-foreground">{city.name}</span>
                            <span className="text-muted-foreground text-[11px]">— {city.stateName}</span>
                          </div>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground px-2 py-0.5 bg-muted rounded border border-border/40">
                            {city.countryCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                CASE 2: INDUSTRY ONBOARDING
                ============================================================ */}
            {activeType === "industry" && (
              <div className="space-y-5 pt-3 border-t border-border/80 animate-in fade-in duration-200">
                {/* 1. Industry Sector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Industry Sector
                  </label>
                  <div className="relative">
                    <select
                      value={industryType}
                      onChange={(e) => setIndustryType(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-xs text-foreground focus-ring font-medium appearance-none cursor-pointer"
                    >
                      {INDUSTRY_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Registered Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Innovations Pvt. Ltd."
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                    required
                  />
                </div>

                {/* 3. Official Website */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Corporate Website
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={officialWebsite}
                      onChange={(e) => setOfficialWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                    />
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* 4. Work Email + OTP Verification */}
                <div className="p-4 sm:p-5 rounded-xl border border-border/90 bg-muted/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Work Email Verification
                    </span>
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : isOtpSent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Verification Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted border border-border px-2.5 py-0.5 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Unverified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => {
                          setWorkEmail(e.target.value);
                          setIsEmailVerified(false);
                          setIsOtpSent(false);
                        }}
                        disabled={isEmailVerified}
                        placeholder="e.g. talent@company.com or hr@enterprise.com"
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring disabled:opacity-60 font-mono"
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || !workEmail.trim() || isEmailVerified}
                      className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Send OTP</span>
                    </button>
                  </div>

                  {/* OTP Section for Industry */}
                  {isOtpSent && !isEmailVerified && (
                    <div className="pt-3 border-t border-border/70 space-y-2.5 animate-in fade-in">
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        Enter 6-digit Code (sent to {workEmail})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••"
                          className="w-36 h-10 px-3 text-center tracking-widest font-mono text-sm font-bold rounded-lg border border-input bg-background text-foreground focus-ring"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpValue.length !== 6}
                          className="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
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
                          className="text-xs text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer self-center"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMessage && (
                    <p
                      className={cn(
                        "text-[11px] font-mono font-medium",
                        isEmailVerified
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {isEmailVerified ? `✓ ${otpMessage}` : `ℹ ${otpMessage}`}
                    </p>
                  )}
                  {otpError && (
                    <p className="text-[11px] text-destructive font-mono font-medium">
                      ✕ {otpError}
                    </p>
                  )}
                </div>

                {/* 5. Headcount Tier */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Company Size / Workforce
                  </label>
                  <div className="relative">
                    <select
                      value={employees}
                      onChange={(e) => setEmployees(e.target.value)}
                      className="w-full h-10 pl-9 pr-8 rounded-lg border border-input bg-background text-xs text-foreground focus-ring font-medium appearance-none cursor-pointer"
                    >
                      {WORKFORCE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                    <Users className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* 6. Headquarters Location */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Headquarters City
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={() => {
                        if (citySuggestions.length > 0) setCityDropdownOpen(true);
                      }}
                      placeholder="Type city name (e.g. Gurugram, Bengaluru, Hyderabad...)"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                      autoComplete="off"
                    />
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  </div>

                  {cityDropdownOpen && citySuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl text-xs py-1 divide-y divide-border/50 animate-in fade-in">
                      {citySuggestions.map((city, idx) => (
                        <button
                          key={`${city.name}-${city.stateName}-${idx}`}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-muted/80 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="font-semibold text-foreground">{city.name}</span>
                            <span className="text-muted-foreground text-[11px]">— {city.stateName}</span>
                          </div>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground px-2 py-0.5 bg-muted rounded border border-border/40">
                            {city.countryCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                Optional Additional Information [+] Collapsible Section
                ============================================================ */}
            <div className="pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                className="w-full py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary/70" />
                  <span>Additional Organization Profile Details (Optional)</span>
                </span>
                <span className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center text-foreground group-hover:bg-muted transition-colors">
                  {showAdditionalInfo ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showAdditionalInfo && (
                <div className="space-y-4 pt-3 mt-2 border-t border-border/40 animate-in fade-in duration-150">
                  {/* Professional Headline */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                      Professional Headline <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={120}
                      placeholder={activeType === "institution" ? "e.g. Leading Research University in India | NAAC A++" : "e.g. Empowering Businesses with AI-First Solutions"}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-ring"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(activeType === "institution"
                        ? [
                            "Premier Research University | NAAC A++ Accredited",
                            "Leading Engineering & Technology Institute",
                            "Autonomous College | Innovation & Industry-Focused Learning",
                          ]
                        : [
                            "Global IT Solutions & Digital Transformation Leader",
                            "AI-First Product Company | Enterprise SaaS",
                            "Deep Tech Startup | Building the Future of Work",
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
                  </div>

                  {/* Bio / Description */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                      Overview / Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder={
                        activeType === "institution"
                          ? "Brief description of the university, key faculties, or academic mission..."
                          : "Brief company overview, research focus, or industry mission..."
                      }
                      className="w-full p-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring resize-none"
                    />
                  </div>

                  {/* Web & LinkedIn URLs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Official Website
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://..."
                          className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                        />
                        <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        LinkedIn Page
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/company/..."
                          className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus-ring"
                        />
                        <ExternalLink className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit CTA */}
            <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verified profiles receive priority partner badge</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-7 text-xs font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 active:scale-98 disabled:opacity-50 shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Organization Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 py-4 px-4 text-center text-xs text-muted-foreground bg-background/50">
        &copy; {new Date().getFullYear()} PortalAcademia &bull; Secured Enterprise & Academic Network
      </footer>
    </div>
  );
}
