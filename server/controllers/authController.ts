import type { Request, Response } from "express";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
import { getCache, setCache, deleteCache } from "../config/redisClient.js";


// =========================
// Types
// =========================

interface SignUpBody {
    email?: string;
    password?: string;
    confirmPassword?: string;
    rememberMe?: boolean;
}

interface SignInBody {
    email?: string;
    password?: string;
    rememberMe?: boolean;
}

interface VerifyOtpBody {
    email?: string;
    otp?: string | number;
}

interface OtpData {
    otp: number;
    email: string;
    password: string;
    rememberMe: boolean;
    expiresAt: number;
    attempts: number;
}

interface JwtUserPayload extends JwtPayload {
    id: string;
}


// =========================
// OTP Storage
// =========================

const OtpStorage = new Map<string, OtpData>();


// =========================
// Environment Variables & Helpers
// =========================

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_REMEMBER_EXPIRY = "30d";

function getAccessSecret(): string {
    const secret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY;
    if (!secret) {
        throw new Error("CRITICAL: SECRET_ACCESS_TOKEN or JWT_PASS_KEY is not configured in environment.");
    }
    return secret;
}

function getRefreshSecret(): string {
    const secret = process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY;
    if (!secret) {
        throw new Error("CRITICAL: SECRET_REFRESH_TOKEN or JWT_REFRESH_KEY is not configured in environment.");
    }
    return secret;
}

export function generateTokens(userId: string, rememberMe = false) {
    const accesstoken = jwt.sign({ id: userId }, getAccessSecret(), {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshtoken = jwt.sign({ id: userId }, getRefreshSecret(), {
        expiresIn: rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRY : REFRESH_TOKEN_EXPIRY,
    });

    return { accesstoken, refreshtoken };
}

export function isRequestHttps(req?: Request): boolean {
    if (process.env.NODE_ENV === "production" || process.env.RENDER === "true") {
        return true;
    }
    if (req) {
        if (req.secure) return true;
        if (req.headers?.["x-forwarded-proto"] === "https") return true;
        const origin = (req.headers?.origin || req.headers?.referer || "") as string;
        if (origin.startsWith("https://")) return true;
    }
    if (process.env.FRONTEND_URL?.startsWith("https://")) {
        return true;
    }
    return false;
}

export function setAuthCookies(
    res: Response,
    accesstoken: string,
    refreshtoken: string,
    rememberMe = false,
    req?: Request
) {
    const isHttps = isRequestHttps(req);

    const baseOptions = {
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? ("none" as const) : ("lax" as const),
        path: "/",
    };

    res.cookie("accesstoken", accesstoken, {
        ...baseOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshtoken", refreshtoken, {
        ...baseOptions,
        maxAge: rememberMe
            ? 30 * 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000,
    });
}

function getEmailCredentials(): {
    email: string;
    password: string;
} {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
        throw new Error("Email credentials are not defined");
    }

    return {
        email,
        password,
    };
}


// =========================
// Sign In
// =========================

export async function SignIn(
    req: Request<{}, {}, SignInBody>,
    res: Response
): Promise<Response> {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields must be filled",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const searchEmail = await userModel.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!searchEmail) {
            return res.status(400).json({
                message: "Either Email or Password is incorrect",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            searchEmail.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Either Email or Password is incorrect",
            });
        }

        // Check if user has completed onboarding and has a profile
        const userProfile = await profileModel.findOne({ userId: searchEmail._id });
        const isOnboarded = Boolean(searchEmail.isOnboarded && userProfile);

        const { accesstoken, refreshtoken } = generateTokens(
            String(searchEmail._id),
            Boolean(rememberMe)
        );

        setAuthCookies(res, accesstoken, refreshtoken, Boolean(rememberMe), req);

        return res.status(200).json({
            message: "Sign in successful",
            isOnboarded,
            user: {
                id: String(searchEmail._id),
                email: searchEmail.email,
                isVerified: searchEmail.isVerified,
                isOnboarded,
                role: userProfile?.accountType || null,
                isEmailVerified: Boolean(searchEmail.isEmailVerified),
            },
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}


// =========================
// Sign Up
// =========================

export async function SignUp(
    req: Request<{}, {}, SignUpBody>,
    res: Response
): Promise<Response> {
    try {
        const {
            email,
            password,
            confirmPassword,
            rememberMe,
        } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({
                message: "All fields need to be filled",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Password doesn't match",
            });
        }

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await userModel.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(401).json({
                message: "User already exists",
            });
        }

        const otp = crypto.randomInt(100000, 1000000);

        const {
            email: senderEmail,
            password: senderPassword,
        } = getEmailCredentials();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        await transporter.sendMail({
            from: senderEmail,
            to: normalizedEmail,

            subject: "Your OTP to signup in PortalAcademia",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f6f8;
                    padding: 20px;
                ">

                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center">

                                <table
                                    width="400"
                                    cellpadding="0"
                                    cellspacing="0"
                                    style="
                                        background: #ffffff;
                                        border-radius: 8px;
                                        padding: 20px;
                                    "
                                >

                                    <tr>
                                        <td style="text-align: center;">

                                            <h2 style="color: #333;">
                                                PortalAcademia
                                            </h2>

                                            <p style="
                                                color: #555;
                                                font-size: 14px;
                                            ">
                                                Your OTP is
                                            </p>

                                            <div style="
                                                font-size: 28px;
                                                font-weight: bold;
                                                letter-spacing: 6px;
                                                background: #f0f4ff;
                                                padding: 12px 20px;
                                                border-radius: 6px;
                                                color: #1a73e8;
                                                display: inline-block;
                                            ">
                                                ${otp}
                                            </div>

                                            <p style="
                                                margin-top: 20px;
                                                color: #777;
                                                font-size: 12px;
                                            ">
                                                This OTP is valid for 5 minutes.
                                            </p>

                                            <p style="
                                                margin-top: 10px;
                                                color: #999;
                                                font-size: 11px;
                                            ">
                                                Please do not share this OTP
                                                with anyone.
                                            </p>

                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>
                    </table>

                </div>
            `,
        });

        const otpEntry: OtpData = {
            otp,
            email: normalizedEmail,
            password,
            rememberMe: rememberMe ?? false,
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0,
        };

        OtpStorage.set(normalizedEmail, otpEntry);
        await setCache(`signup_otp:${normalizedEmail}`, otpEntry, 300);

        return res.status(200).json({
            message: "Next up verify OTP",
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}


// =========================
// Verify OTP
// =========================

export async function VerifyOtp(
    req: Request<{}, {}, VerifyOtpBody>,
    res: Response
): Promise<Response> {
    try {
        const { email, otp } = req.body;

        if (!email || otp === undefined) {
            return res.status(400).json({
                message: "Please enter all fields",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check Redis cache first, fall back to memory
        let data = await getCache<OtpData>(`signup_otp:${normalizedEmail}`);
        if (!data) {
            data = OtpStorage.get(normalizedEmail) || null;
        }

        if (!data) {
            return res.status(400).json({
                message: "OTP expired or not found",
            });
        }

        // Lockout check
        if ((data.attempts || 0) >= 5) {
            OtpStorage.delete(normalizedEmail);
            await deleteCache(`signup_otp:${normalizedEmail}`);
            return res.status(429).json({
                message: "Too many failed attempts. This OTP has been invalidated. Please sign up again to receive a fresh OTP.",
            });
        }

        // Check expiry
        if (Date.now() > data.expiresAt) {
            OtpStorage.delete(normalizedEmail);
            await deleteCache(`signup_otp:${normalizedEmail}`);
            return res.status(400).json({
                message: "OTP expired",
            });
        }

        // Check OTP
        if (Number(otp) !== data.otp) {
            data.attempts = (data.attempts || 0) + 1;
            OtpStorage.set(normalizedEmail, data);
            await setCache(`signup_otp:${normalizedEmail}`, data, Math.max(1, Math.round((data.expiresAt - Date.now()) / 1000)));

            return res.status(400).json({
                message: `Incorrect OTP. ${5 - data.attempts} attempt(s) remaining.`,
            });
        }

        const newPass = await bcrypt.hash(
            data.password,
            10
        );

        const createUser = await userModel.create({
            email: data.email,
            password: newPass,

            provider: "local",

            isVerified: true,

            // User ne abhi onboarding complete nahi kiya
            isOnboarded: false,
        });

        const { accesstoken, refreshtoken } = generateTokens(
            String(createUser._id),
            Boolean(data.rememberMe)
        );

        setAuthCookies(res, accesstoken, refreshtoken, Boolean(data.rememberMe), req);

        // Delete OTP from storage
        OtpStorage.delete(normalizedEmail);
        await deleteCache(`signup_otp:${normalizedEmail}`);

        return res.status(200).json({
            message: "User created successfully",
            isOnboarded: false,
            user: {
                id: String(createUser._id),
                email: createUser.email,
                isVerified: createUser.isVerified,
                isOnboarded: false,
                role: null,
                isEmailVerified: false,
            },
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}


// =========================
// Sign Out
// =========================

export function SignOut(
    req: Request,
    res: Response
): Response {
    try {
        const isHttps = isRequestHttps(req);
        const clearOptions = {
            httpOnly: true,
            secure: isHttps,
            sameSite: isHttps ? ("none" as const) : ("lax" as const),
            path: "/",
        };

        res.clearCookie("accesstoken", clearOptions);
        res.clearCookie("refreshtoken", clearOptions);

        return res.status(200).json({
            message: "Logout done",
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}


// =========================
// Check Auth
// =========================

async function buildUserSessionPayload(user: any) {
    const userProfile = await profileModel.findOne({ userId: user._id });
    const isOnboarded = Boolean(user.isOnboarded && userProfile);

    return {
        id: String(user._id),
        email: user.email,
        isVerified: user.isVerified,
        isOnboarded,
        role: userProfile?.accountType || null,
        isEmailVerified: Boolean(user.isEmailVerified),
        githubId: user.githubId || null,
        githubUsername: user.githubUsername || userProfile?.githubUsername || null,
        githubAvatarUrl: user.githubAvatarUrl || userProfile?.githubAvatarUrl || null,
        githubProfileUrl: user.githubProfileUrl || userProfile?.github || null,
    };
}

export async function checkAuth(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
        const accesstoken = req.cookies?.accesstoken || bearerToken;
        const refreshtoken = req.cookies?.refreshtoken || (req.headers["x-refresh-token"] as string | undefined);

        // 1. First check accesstoken
        if (accesstoken) {
            try {
                const decoded = jwt.verify(
                    accesstoken,
                    getAccessSecret()
                ) as JwtUserPayload;

                if (decoded && decoded.id && typeof decoded.id === "string") {
                    const user = await userModel
                        .findById(decoded.id)
                        .select("_id email isVerified isOnboarded isEmailVerified githubId githubUsername githubAvatarUrl githubProfileUrl");

                    if (user) {
                        // Re-issue or establish first-party cookies if request came via bearer token or if refreshing
                        if (bearerToken) {
                            const tokens = generateTokens(String(user._id), true);
                            setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true, req);
                        }
                        const userData = await buildUserSessionPayload(user);
                        return res.status(200).json({
                            valid: true,
                            user: userData,
                        });
                    }
                }
            } catch (tokenErr) {
                // accesstoken expired or invalid, fall through to refreshtoken
            }
        }

        // 2. If accesstoken is missing or expired, check refreshtoken
        if (refreshtoken) {
            try {
                const decoded = jwt.verify(
                    refreshtoken,
                    getRefreshSecret()
                ) as JwtUserPayload;

                if (decoded && decoded.id && typeof decoded.id === "string") {
                    const user = await userModel
                        .findById(decoded.id)
                        .select("_id email isVerified isOnboarded isEmailVerified githubId githubUsername githubAvatarUrl githubProfileUrl");

                    if (user) {
                        // Re-issue both tokens
                        const tokens = generateTokens(String(user._id), true);
                        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true, req);

                        const userData = await buildUserSessionPayload(user);
                        return res.status(200).json({
                            valid: true,
                            user: userData,
                        });
                    }
                }
            } catch (refreshErr) {
                // refreshtoken also invalid or expired
            }
        }

        return res.status(200).json({
            valid: false,
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(200).json({
            valid: false,
        });
    }
}


// =========================
// Refresh Token
// =========================

export async function RefreshToken(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const refreshtoken = req.cookies?.refreshtoken;

        if (!refreshtoken) {
            return res.status(401).json({
                message: "No refresh token provided",
            });
        }

        const decoded = jwt.verify(
            refreshtoken,
            getRefreshSecret()
        ) as JwtUserPayload;

        if (!decoded || !decoded.id || typeof decoded.id !== "string") {
            return res.status(401).json({
                message: "Invalid refresh token",
            });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const tokens = generateTokens(String(user._id), true);
        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true, req);

        return res.status(200).json({
            message: "Token refreshed successfully",
            user: {
                id: String(user._id),
                email: user.email,
                isVerified: user.isVerified,
                isOnboarded: user.isOnboarded,
            },
        });

    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
}


// =========================
// Google OAuth Handlers
// =========================

interface GoogleUser {
    _id: string;
    email: string;
    isOnboarded?: boolean;
}

export const googleSuccess = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    try {
        const user = req.user as GoogleUser;

        const sessionOrigin = (req.session as any)?.frontendOrigin;
        let frontendUrl = sessionOrigin || process.env.FRONTEND_URL || "http://localhost:5173";

        const originHeader = (req.headers.origin || req.headers.referer) as string | undefined;
        if (!sessionOrigin && originHeader && frontendUrl.includes("localhost") && !originHeader.includes("localhost")) {
            try {
                const parsed = new URL(originHeader);
                frontendUrl = `${parsed.protocol}//${parsed.host}`;
            } catch { }
        }

        if (!user || !user._id) {
            return res.redirect(`${frontendUrl}/auth?error=google_auth_failed`);
        }

        const email = user.email;
        if (!email) {
            return res.redirect(`${frontendUrl}/auth?error=email_not_found`);
        }

        const userProfile = await profileModel.findOne({ userId: user._id });
        const dbUser = await userModel.findById(user._id);
        const isOnboarded = Boolean(dbUser?.isOnboarded && userProfile);

        // The OAuth callback runs on Render while the browser returns to the
        // frontend origin. Do not set the session cookies here: those cookies
        // would belong to the Render host and would not be sent by the
        // frontend's same-origin API requests. Instead, pass a short-lived
        // exchange token to the frontend, which posts it through the Vercel
        // proxy and receives first-party session cookies there.
        const exchangeToken = jwt.sign(
            { id: String(user._id), type: "oauth_exchange" },
            getAccessSecret(),
            { expiresIn: "60s" }
        );

        const redirectPath = isOnboarded ? "/dashboard" : "/onboarding/select-type";
        return res.redirect(
            `${frontendUrl}${redirectPath}?auth=google&exchange=${encodeURIComponent(exchangeToken)}`
        );

    } catch (error) {
        console.error("Google Auth error:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/auth?error=server_error`);
    }
};

export const googleFailure = (
    req: Request,
    res: Response
): Response => {
    return res.status(401).json({
        success: false,
        message: "Google Authentication Failed",
    });
};

// =========================
// OAuth Token Exchange
// =========================

export async function oauthExchange(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const { exchangeToken } = req.body;
        if (!exchangeToken || typeof exchangeToken !== "string") {
            return res.status(400).json({ message: "Missing or invalid exchange token" });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(exchangeToken, getAccessSecret());
        } catch {
            return res.status(401).json({ message: "Exchange token expired or invalid" });
        }

        if (decoded?.type !== "oauth_exchange" || !decoded?.id) {
            return res.status(401).json({ message: "Invalid exchange token format" });
        }

        const user = await userModel
            .findById(decoded.id)
            .select("_id email isVerified isOnboarded isEmailVerified githubId githubUsername githubAvatarUrl githubProfileUrl");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Issue fresh tokens and set httpOnly cookies on the current origin
        const tokens = generateTokens(String(user._id), true);
        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true, req);

        const userData = await buildUserSessionPayload(user);
        return res.status(200).json({
            valid: true,
            user: userData,
        });
    } catch (err) {
        console.error("OAuth exchange failed:", err);
        return res.status(500).json({ message: "OAuth token exchange error" });
    }
}

// =========================
// GitHub OAuth Handlers
// =========================

interface GitHubUserSession {
    _id: string;
    email?: string;
    githubUsername?: string;
    isOnboarded?: boolean;
}

export const githubSuccess = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    try {
        const user = req.user as GitHubUserSession;

        const sessionOrigin = (req.session as any)?.frontendOrigin;
        let frontendUrl = sessionOrigin || process.env.FRONTEND_URL || "http://localhost:5173";

        const originHeader = (req.headers.origin || req.headers.referer) as string | undefined;
        if (!sessionOrigin && originHeader && frontendUrl.includes("localhost") && !originHeader.includes("localhost")) {
            try {
                const parsed = new URL(originHeader);
                frontendUrl = `${parsed.protocol}//${parsed.host}`;
            } catch { }
        }

        const returnTo = (req.session as any)?.returnTo || "/premium?tab=opensource";
        const separator = returnTo.includes("?") ? "&" : "?";

        if (!user || !user._id) {
            return res.redirect(`${frontendUrl}${returnTo}${separator}error=github_link_failed`);
        }

        const dbUser = await userModel.findById(user._id);

        const exchangeToken = jwt.sign(
            { id: String(user._id), type: "oauth_exchange" },
            getAccessSecret(),
            { expiresIn: "60s" }
        );

        return res.redirect(
            `${frontendUrl}${returnTo}${separator}auth=github&exchange=${encodeURIComponent(exchangeToken)}&githubUsername=${encodeURIComponent(dbUser?.githubUsername || "")}`
        );

    } catch (error) {
        console.error("GitHub Auth error:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/premium?tab=opensource&error=server_error`);
    }
};

export const githubFailure = (
    req: Request,
    res: Response
): void => {
    const sessionOrigin = (req.session as any)?.frontendOrigin;
    const frontendUrl = sessionOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    const returnTo = (req.session as any)?.returnTo || "/premium?tab=opensource";
    const separator = returnTo.includes("?") ? "&" : "?";
    return res.redirect(`${frontendUrl}${returnTo}${separator}error=github_link_failed`);
};

export async function unlinkGithub(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.githubId = null;
        user.githubUsername = null;
        user.githubAvatarUrl = null;
        user.githubProfileUrl = null;
        await user.save();

        await profileModel.findOneAndUpdate(
            { userId: user._id },
            {
                $unset: { githubUsername: 1, githubAvatarUrl: 1 },
                $set: { github: "" },
            }
        );

        return res.status(200).json({
            success: true,
            message: "GitHub account unlinked successfully.",
        });
    } catch (error) {
        console.error("[unlinkGithub]", error);
        return res.status(500).json({ success: false, message: "Failed to unlink GitHub account." });
    }
}
