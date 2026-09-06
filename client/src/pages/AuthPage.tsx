import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Server,
  KeyRound,
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      className="w-full gap-2 h-9 text-xs font-medium"
      onClick={() => {
        alert("Google Sign-In is coming soon. Please use institutional email.");
      }}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
      <span>{label}</span>
    </Button>
  );
}

// ============================================================
// Or Divider
// ============================================================

function OrDivider() {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase font-mono">
        <span className="bg-card px-2 text-muted-foreground">or continue with</span>
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
      className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
      <DialogContent className="max-w-sm rounded-md border border-border bg-background p-6">
        <DialogHeader>
          <div className="w-8 h-8 mx-auto rounded-sm bg-muted border border-border flex items-center justify-center mb-2">
            <KeyRound className="w-4 h-4 text-foreground" />
          </div>
          <DialogTitle className="text-center text-base font-semibold">
            Two-Factor Verification
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-1">
            Enter the 6-digit verification code transmitted to{" "}
            <span className="font-mono text-foreground font-medium">{email}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {success ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="text-xs font-medium text-foreground">
                Identity verified. Initializing session…
              </p>
            </div>
          ) : (
            <>
              {/* OTP inputs */}
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
                    className="w-10 h-11 rounded-md border border-input bg-background text-center font-mono text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 tabular-nums"
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && <ErrorAlert message={error} />}

              <Button
                id="otp-verify-btn"
                className="w-full h-9 text-xs font-medium"
                onClick={handleVerify}
                disabled={isLoading || otp.join("").length < OTP_LENGTH}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm & Authenticate"
                )}
              </Button>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>Timeout: 05:00</span>
                <button
                  type="button"
                  className="text-foreground hover:underline"
                  onClick={onClose}
                >
                  Change Email
                </button>
              </div>
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
        setError(data.message ?? "Authentication failed. Check credentials.");
        return;
      }

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
      className="flex flex-col gap-4"
    >
      {error && <ErrorAlert message={error} />}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="signin-email" className="text-xs font-medium text-foreground">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="institutional@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            className={`pl-8 h-9 text-xs ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password" className="text-xs font-medium text-foreground">
            Password
          </Label>
          <button
            type="button"
            id="forgot-password-btn"
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Forgot?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
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
            className={`pl-8 pr-9 h-9 text-xs ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button
        id="signin-submit-btn"
        type="submit"
        className="w-full h-9 text-xs font-medium mt-1"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Authenticate Session"
        )}
      </Button>

      <OrDivider />

      <GoogleButton label="Continue with Google Workspace" />
    </form>
  );
}

// ============================================================
// Sign Up Form
// ============================================================

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  function validate(): boolean {
    const errs: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /**
   * @description Registers a new user. The server sends an OTP to the given email address.
   * @param {{ email: string; password: string; confirmPassword: string }} payload - Registration data
   * @returns {Promise<AuthMessageResponse>} Server confirmation message
   * @throws {Error} 400 (validation failure or user already exists) or 500 (server error)
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
        setError(data.message ?? "Registration failed.");
        return;
      }

      setOtpModalOpen(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerified(isOnboarded: boolean) {
    setOtpModalOpen(false);
    await dispatch(checkAuthThunk());
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
        className="flex flex-col gap-3.5"
      >
        {error && <ErrorAlert message={error} />}

        {/* Email */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-email" className="text-xs font-medium text-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="institutional@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              className={`pl-8 h-9 text-xs ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-password" className="text-xs font-medium text-foreground">
            Password (min 8 chars)
          </Label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              className={`pl-8 pr-9 h-9 text-xs ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-confirm-password" className="text-xs font-medium text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              className={`pl-8 h-9 text-xs ${fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          id="signup-submit-btn"
          type="submit"
          className="w-full h-9 text-xs font-medium mt-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Dispatch Verification Code"
          )}
        </Button>

        <OrDivider />

        <GoogleButton label="Continue with Google Workspace" />
      </form>

      {/* OTP Dialog */}
      <OtpModal
        open={otpModalOpen}
        email={email}
        onClose={() => setOtpModalOpen(false)}
        onVerified={handleVerified}
      />
    </>
  );
}

// ============================================================
// Auth Page Component
// ============================================================

export default function AuthPage() {
  return (
    <>
      <title>Authentication // PortalAcademia</title>
      <meta
        name="description"
        content="Access PortalAcademia with verified institutional credentials."
      />

      <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950">
        {/* Left — Enterprise telemetry & architecture panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-zinc-100 border-r border-zinc-800 flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-sm bg-white text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                PA
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-300">
                PortalAcademia // SIH-26044
              </span>
            </div>

            <div className="mt-14 max-w-md">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Security Architecture
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Zero-Trust Credential &amp; Identity Gateway
              </h1>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Production-grade identity management configured with strict HttpOnly session tokens, server-side cryptographic email verification, and deterministic stakeholder authorization matrices.
              </p>
            </div>
          </div>

          {/* Structured Architecture Specs Card */}
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-950/60 p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-300">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>SESSION_ENCLAVE</span>
              </div>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[9px] py-0">
                STRICT-COOKIE
              </Badge>
            </div>

            <div className="divide-y divide-zinc-800/80 text-[11px] tabular-nums">
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Token Exposure:</span>
                <span className="text-zinc-300">None (HttpOnly Cookie)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Validation Protocol:</span>
                <span className="text-zinc-300">6-Digit Cryptographic OTP</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Transport Layer:</span>
                <span className="text-zinc-300">TLS 1.3 / Strict-SameSite</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Target Environment:</span>
                <span className="text-zinc-300">Gov-Tech SIH 26044 Node</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Encrypted Session Management Verified</span>
          </div>
        </div>

        {/* Right — Auth Card Panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-sm mb-4">
            <Link
              to="/"
              id="back-to-home-link"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Index</span>
            </Link>
          </div>

          <Card className="w-full max-w-sm rounded-md border border-border bg-card p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-[10px]">
                  PA
                </div>
                <span className="font-semibold text-xs text-foreground tracking-tight">
                  PortalAcademia
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Auth Gateway
              </span>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="w-full h-8 mb-5 rounded-md bg-muted p-0.5">
                <TabsTrigger
                  id="signin-tab"
                  value="signin"
                  className="flex-1 rounded-sm text-xs font-medium"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  id="signup-tab"
                  value="signup"
                  className="flex-1 rounded-sm text-xs font-medium"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Institutional Login
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your registered credentials to access your console.
                  </p>
                </div>
                <SignInForm />
              </TabsContent>

              <TabsContent value="signup">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Register Account
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create credentials and verify your email domain.
                  </p>
                </div>
                <SignUpForm />
              </TabsContent>
            </Tabs>

            <p className="mt-5 text-center text-[11px] text-muted-foreground">
              By authenticating, you agree to academic compliance regulations and system telemetry logging.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
