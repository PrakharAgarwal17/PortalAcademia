import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppDispatch } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";

// ============================================================
// Constants
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const OTP_LENGTH = 6;

// ============================================================
// Types
// ============================================================

interface SignInPayload {
  email: string;
  password: string;
}

interface SignUpPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

interface AuthMessageResponse {
  message: string;
  isOnboarded?: boolean;
}

// ============================================================
// Helpers
// ============================================================

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

// ============================================================
// Google OAuth Button
// ============================================================

function GoogleButton({ label }: { label: string }) {
  return (
    <Button
      id={`google-${label.toLowerCase().replace(/\s+/g, "-")}-btn`}
      type="button"
      variant="outline"
      className="w-full gap-3"
      onClick={() => {
        // Google OAuth not yet wired — server route pending
        alert("Google Sign-In is coming soon. Please use email for now.");
      }}
    >
      {/* Google icon inline SVG */}
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {label}
    </Button>
  );
}

// ============================================================
// Divider
// ============================================================

function OrDivider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

// ============================================================
// Error Alert
// ============================================================

function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ============================================================
// OTP Modal
// ============================================================

interface OtpModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onVerified: (isOnboarded: boolean) => void;
}

function OtpModal({ open, email, onClose, onVerified }: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    // Allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    // Focus last filled or next empty
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  }

  /**
   * @description Submits the 6-digit OTP to verify the user's email.
   *              On success the server creates the user account and sets an httpOnly cookie.
   * @param {{ email: string; otp: string }} payload - User email and OTP string
   * @returns {Promise<AuthMessageResponse>} Verification result including isOnboarded flag
   * @throws {Error} 400 (invalid OTP / expired) or 500 (server error)
   */
  async function handleVerify() {
    const otpString = otp.join("");
    if (otpString.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }

    const payload: VerifyOtpPayload = { email, otp: otpString };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/verifyotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "OTP verification failed.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onVerified(data.isOnboarded ?? false);
      }, 800);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-brand-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Verify your email
          </DialogTitle>
          <DialogDescription className="text-center">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            <br />
            It expires in 5 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
              <p className="text-sm font-medium text-foreground">
                Verified! Redirecting…
              </p>
            </div>
          ) : (
            <>
              {/* OTP cells */}
              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-cell-${i}`}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="w-11 h-13 rounded-xl border-2 border-input bg-background text-center text-xl font-bold text-foreground transition-all duration-150 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none caret-transparent"
                    style={{ height: "3.25rem" }}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && <ErrorAlert message={error} />}

              <Button
                id="otp-verify-btn"
                variant="brand"
                className="w-full"
                onClick={handleVerify}
                disabled={isLoading || otp.join("").length < OTP_LENGTH}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Wrong email?{" "}
                <button
                  type="button"
                  className="text-brand-600 hover:underline"
                  onClick={onClose}
                >
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Sign In Form
// ============================================================

function SignInForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /**
   * @description Signs in an existing user with email and password.
   *              The server validates credentials and sets an httpOnly cookie on success.
   * @param {{ email: string; password: string }} payload - User credentials
   * @returns {Promise<AuthMessageResponse>} Success message and isOnboarded flag
   * @throws {Error} 400 (invalid credentials) or 500 (server error)
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const payload: SignInPayload = { email: email.trim().toLowerCase(), password };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "Sign in failed. Please try again.");
        return;
      }

      // Hydrate Redux store from cookie
      await dispatch(checkAuthThunk());

      if (data.isOnboarded === false) {
        navigate("/onboarding/select-type", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      id="signin-form"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      {error && <ErrorAlert message={error} />}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="you@institution.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            className={`pl-9 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <button
            type="button"
            id="forgot-password-btn"
            className="text-xs text-brand-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            className={`pl-9 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      <Button
        id="signin-submit-btn"
        type="submit"
        variant="brand"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
      </Button>

      <OrDivider />
      <GoogleButton label="Continue with Google" />
    </form>
  );
}

// ============================================================
// Sign Up Form
// ============================================================

function SignUpForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /**
   * @description Registers a new user by sending email + password to the server.
   *              The server sends an OTP to the provided email for verification.
   * @param {{ email: string; password: string; confirmPassword: string }} payload - Registration details
   * @returns {Promise<AuthMessageResponse>} Confirmation message ("Next up verify OTP")
   * @throws {Error} 400 (user exists, password mismatch) or 500 (server error)
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const payload: SignUpPayload = {
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "Sign up failed. Please try again.");
        return;
      }

      // Open OTP modal
      setOtpOpen(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleVerified(isOnboarded: boolean) {
    dispatch(checkAuthThunk());
    setOtpOpen(false);
    if (!isOnboarded) {
      navigate("/onboarding/select-type", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <>
      <form
        id="signup-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        {error && <ErrorAlert message={error} />}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              className={`pl-9 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              className={`pl-9 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              className={`pl-9 pr-10 ${fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          id="signup-submit-btn"
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Create Account"
          )}
        </Button>

        <OrDivider />
        <GoogleButton label="Continue with Google" />
      </form>

      <OtpModal
        open={otpOpen}
        email={email}
        onClose={() => setOtpOpen(false)}
        onVerified={handleVerified}
      />
    </>
  );
}

// ============================================================
// Auth Page
// ============================================================

export default function AuthPage() {
  return (
    <>
      <title>Sign In or Sign Up — PortalAcademia</title>
      <meta
        name="description"
        content="Sign in to your PortalAcademia account or create a new one to start your academia-industry journey."
      />

      <div className="min-h-screen bg-mesh flex">
        {/* Left — decorative panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-purple-800 to-brand-900 flex-col items-center justify-center p-12 gap-8">
          {/* Orbs */}
          <div
            aria-hidden
            className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />

          <div className="relative flex flex-col items-center text-center gap-6 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white leading-snug">
              Bridge the gap between academia and industry
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Join students, faculty, and recruiters building meaningful
              connections on PortalAcademia.
            </p>

            {/* Testimonial card */}
            <div className="mt-4 w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-left">
              <p className="text-white/90 text-sm leading-relaxed italic">
                "PortalAcademia helped me identify exactly which skills I was
                missing and land my first SDE internship within 3 months."
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-purple-400 flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">
                    Aarav Mehta
                  </p>
                  <p className="text-white/55 text-xs">
                    B.Tech CSE, 3rd year
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — auth form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          {/* Back to home */}
          <div className="w-full max-w-md mb-6">
            <Link
              to="/"
              id="back-to-home-link"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
          </div>

          {/* Card */}
          <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 p-8">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-7">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base text-foreground">
                Portal<span className="text-brand-600">Academia</span>
              </span>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger
                  id="signin-tab"
                  value="signin"
                  className="flex-1"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  id="signup-tab"
                  value="signup"
                  className="flex-1"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div className="mb-5">
                  <h1 className="text-xl font-display font-bold text-foreground">
                    Welcome back
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign in to your PortalAcademia account
                  </p>
                </div>
                <SignInForm />
              </TabsContent>

              <TabsContent value="signup">
                <div className="mb-5">
                  <h1 className="text-xl font-display font-bold text-foreground">
                    Create your account
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Join thousands of students and professionals
                  </p>
                </div>
                <SignUpForm />
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <span className="text-brand-600 cursor-pointer hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-brand-600 cursor-pointer hover:underline">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
