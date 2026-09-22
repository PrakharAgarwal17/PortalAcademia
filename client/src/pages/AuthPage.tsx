import { useState, useRef, useEffect } from "react";
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
  KeyRound,
  Sun,
  Moon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk, signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import authLightImg from "@/assets/auth-light.png";
import authDarkImg from "@/assets/auth-dark.png";

// ============================================================
// Constants
// ============================================================

import { API_BASE } from "@/lib/api";
const OTP_LENGTH = 6;

// ============================================================
// Types
// ============================================================

interface SignInPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignUpPayload {
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe?: boolean;
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
  /**
   * @description Redirects the browser to the backend Google OAuth initiation endpoint.
   *              Passport handles the OAuth handshake and redirects to /onboarding upon success.
   */
  function handleGoogleLogin() {
    window.location.href = `${API_BASE}/api/auth/google`;
  }

  return (
    <button
      id={`google-${label.toLowerCase().replace(/\s+/g, "-")}-btn`}
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
    </button>
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
// OTP Modal (Direct Native Modal)
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

  if (!open) return null;

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
        setError(data.message ?? "Invalid or expired OTP. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onVerified(data.isOnboarded ?? false);
      }, 750);
    } catch {
      setError("Network error. Could not verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-6 shadow-lg text-foreground animate-in fade-in duration-150">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
              <KeyRound className="w-3.5 h-3.5 text-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Verify Identity Token
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit numeric OTP sent to your email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-sm border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground font-mono">
            <span className="text-[10px] uppercase text-muted-foreground block">
              Recipient Destination
            </span>
            <span className="text-foreground font-medium break-all">{email}</span>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-in zoom-in-50 duration-200" />
              <p className="text-xs font-semibold text-foreground">
                Identity Verified
              </p>
              <p className="text-[11px] text-muted-foreground">
                Provisioning secure session…
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
                    className="w-10 h-11 rounded-md border border-input bg-background text-center font-mono text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && <ErrorAlert message={error} />}

              <button
                id="otp-verify-btn"
                type="button"
                onClick={handleVerify}
                disabled={isLoading || otp.join("").length < OTP_LENGTH}
                className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm & Authenticate"
                )}
              </button>

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
      </div>
    </div>
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
  const [rememberMe, setRememberMe] = useState(false);
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
   * @param {{ email: string; password: string; rememberMe?: boolean }} payload - User credentials
   * @returns {Promise<AuthMessageResponse>} Success message and isOnboarded flag
   * @throws {Error} 400 (invalid credentials) or 500 (server error)
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const payload: SignInPayload = {
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    };

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

      const authResult = await dispatch(checkAuthThunk()).unwrap().catch(() => null);
      if (authResult?.user?.isOnboarded) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding/select-type", { replace: true });
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
        <label htmlFor="signin-email" className="text-xs font-medium text-foreground">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="institutional@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            className={`w-full pl-8 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
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
          <label htmlFor="signin-password" className="text-xs font-medium text-foreground">
            Password
          </label>
        </div>
        <div className="relative">
          <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            className={`w-full pl-8 pr-9 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
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

      {/* Remember Me */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="signin-remember-me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded-sm border border-border text-foreground accent-foreground cursor-pointer focus:ring-1 focus:ring-ring"
        />
        <label
          htmlFor="signin-remember-me"
          className="text-xs font-normal text-muted-foreground cursor-pointer select-none"
        >
          Remember my session for 30 days
        </label>
      </div>

      {/* Submit Button */}
      <button
        id="signin-submit-btn"
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying Credentials…</span>
          </>
        ) : (
          "Authenticate & Enter"
        )}
      </button>

      <OrDivider />

      <GoogleButton label="Continue with Google Workspace" />
    </form>
  );
}

// ============================================================
// Sign Up Form
// ============================================================

function SignUpForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /**
   * @description Initiates signup by sending an OTP to the user's institutional email.
   *              User account is not created until OTP is verified.
   * @param {{ email: string; password: string; confirmPassword: string; rememberMe?: boolean }} payload - Registration data
   * @returns {Promise<AuthMessageResponse>} OTP dispatch confirmation
   * @throws {Error} 400 (validation / mismatch), 409 (user exists), or 500 (server error)
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const payload: SignUpPayload = {
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      rememberMe,
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
        setError(data.message ?? "Registration failed. Try again.");
        return;
      }

      setSubmittedEmail(payload.email);
      setOtpModalOpen(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerified(isOnboarded: boolean) {
    setOtpModalOpen(false);
    const authResult = await dispatch(checkAuthThunk()).unwrap().catch(() => null);
    if (authResult?.user?.isOnboarded || isOnboarded) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/onboarding/select-type", { replace: true });
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
          <label htmlFor="signup-email" className="text-xs font-medium text-foreground">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="institutional@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              className={`w-full pl-8 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
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
          <label htmlFor="signup-password" className="text-xs font-medium text-foreground">
            Password (min 8 chars)
          </label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              className={`w-full pl-8 pr-9 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
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
          <label htmlFor="signup-confirm-password" className="text-xs font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="signup-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              className={`w-full pl-8 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="signup-remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded-sm border border-border text-foreground accent-foreground cursor-pointer focus:ring-1 focus:ring-ring"
          />
          <label
            htmlFor="signup-remember-me"
            className="text-xs font-normal text-muted-foreground cursor-pointer select-none"
          >
            Remember my session for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <button
          id="signup-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Dispatching OTP Token…</span>
            </>
          ) : (
            "Dispatch Verification OTP"
          )}
        </button>

        <OrDivider />

        <GoogleButton label="Continue with Google Workspace" />
      </form>

      <OtpModal
        open={otpModalOpen}
        email={submittedEmail}
        onClose={() => setOtpModalOpen(false)}
        onVerified={handleVerified}
      />
    </>
  );
}

// ============================================================
// Auth Page Root
// ============================================================

export default function AuthPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isInitialized } = useAppSelector((s) => s.auth);
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("switch") === "true") {
      dispatch(signOutThunk());
      return;
    }

    if (isInitialized && isAuthenticated && !searchParams.get("stay")) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isInitialized, user, navigate, dispatch]);

  return (
    <>
      <title>Sign In & Register — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia unified login and registration for students, faculty, institutions, and corporate recruiters."
      />

      <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground selection:bg-zinc-200 selection:text-zinc-900">
        {/* Left — Full-size Image Panel (Light / Dark theme adaptive, seamless borderless blend) */}
        <div className="hidden lg:relative lg:flex lg:w-[58%] xl:w-[60%] min-h-screen overflow-hidden bg-background">
          {/* Light Theme Full-Size Image */}
          <img
            src={authLightImg}
            alt="PortalAcademia Learning Illustration"
            className="w-full h-full object-cover object-center dark:hidden select-none pointer-events-none"
            loading="eager"
          />

          {/* Dark Theme Full-Size Image */}
          <img
            src={authDarkImg}
            alt="PortalAcademia Learning Illustration"
            className="w-full h-full object-cover object-center hidden dark:block select-none pointer-events-none"
            loading="eager"
          />

          {/* Seamless right-edge fade so no hard separation cuts into the art */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-r from-transparent to-background hidden lg:block z-10" />

          {/* Overlay Logo */}
          <div className="absolute top-8 left-8 z-20">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-background/85 dark:bg-zinc-900/85 backdrop-blur-md border border-border/80 hover:opacity-90 transition-all shadow-sm group"
              aria-label="PortalAcademia — Return to top"
            >
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                PA
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">
                PortalAcademia
              </span>
            </Link>
          </div>
        </div>

        {/* Right — Auth Card Panel */}
        <div className="flex-1 lg:w-[42%] xl:w-[40%] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background min-h-screen overflow-y-auto">
          {/* Mobile-only header & responsive illustration banner */}
          <div className="lg:hidden w-full max-w-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <Link
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
                aria-label="PortalAcademia — Return to top"
              >
                <div className="w-6 h-6 rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                  PA
                </div>
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  PortalAcademia
                </span>
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>
            </div>

            {/* Mobile Banner: Adaptive Image */}
            <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-border shadow-sm">
              <img
                src={authLightImg}
                alt="PortalAcademia"
                className="w-full h-full object-cover object-center dark:hidden select-none pointer-events-none"
                loading="eager"
              />
              <img
                src={authDarkImg}
                alt="PortalAcademia"
                className="w-full h-full object-cover object-center hidden dark:block select-none pointer-events-none"
                loading="eager"
              />
            </div>
          </div>

          {/* Desktop top bar for back link & theme toggle */}
          <div className="hidden lg:flex w-full max-w-sm mb-4 items-center justify-between">
            <Link
              to="/"
              id="back-to-home-link"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Index</span>
            </Link>

            <button
              type="button"
              id="auth-theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              )}
            </button>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <Link
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
                aria-label="PortalAcademia — Return to top"
              >
                <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-[10px] transition-colors">
                  PA
                </div>
                <span className="font-semibold text-xs text-foreground tracking-tight">
                  PortalAcademia
                </span>
              </Link>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Auth Gateway
              </span>
            </div>

            {/* Direct Tabs Toggle */}
            <div className="w-full h-8 mb-5 rounded-md bg-muted p-0.5 grid grid-cols-2">
              <button
                type="button"
                id="signin-tab"
                onClick={() => setActiveTab("signin")}
                className={`rounded-sm text-xs font-medium transition-all ${
                  activeTab === "signin"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="signup-tab"
                onClick={() => setActiveTab("signup")}
                className={`rounded-sm text-xs font-medium transition-all ${
                  activeTab === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "signin" ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Institutional Login
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your registered credentials to access your console.
                  </p>
                </div>
                <SignInForm />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Register Account
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create credentials and verify your email domain.
                  </p>
                </div>
                <SignUpForm />
              </div>
            )}

            <p className="mt-5 text-center text-[11px] text-muted-foreground leading-relaxed">
              By continuing, you agree to PortalAcademia's{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
