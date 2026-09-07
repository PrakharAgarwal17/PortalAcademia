import type { Request, Response } from "express";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";


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
}

interface JwtUserPayload extends JwtPayload {
    id: string;
}


// =========================
// OTP Storage
// =========================

const OtpStorage = new Map<string, OtpData>();


// =========================
// Environment Variables
// =========================

function getJwtSecret(): string {
    const secret = process.env.JWT_PASS_KEY;

    if (!secret) {
        throw new Error("JWT_PASS_KEY is not defined");
    }

    return secret;
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
// Token & Cookie Helpers
// =========================

export function generateTokens(userId: string): {
    accesstoken: string;
    refreshtoken: string;
} {
    const secret = getJwtSecret();

    const accesstoken = jwt.sign(
        { id: userId },
        secret,
        { expiresIn: "1d" }
    );

    const refreshtoken = jwt.sign(
        { id: userId, type: "refresh" },
        secret,
        { expiresIn: "30d" }
    );

    return { accesstoken, refreshtoken };
}

export function setAuthCookies(
    res: Response,
    accesstoken: string,
    refreshtoken: string,
    rememberMe: boolean = false
): void {
    const isProduction = process.env.NODE_ENV === "production";

    const commonOptions = {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: isProduction,
    };

    const accessMaxAge = 24 * 60 * 60 * 1000; // 1 day
    const refreshMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 7 * 24 * 60 * 60 * 1000;  // 7 days

    res.cookie("accesstoken", accesstoken, {
        ...commonOptions,
        maxAge: accessMaxAge,
    });

    res.cookie("refreshtoken", refreshtoken, {
        ...commonOptions,
        maxAge: refreshMaxAge,
    });
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
        });

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

        const { accesstoken, refreshtoken } = generateTokens(String(searchEmail._id));
        setAuthCookies(res, accesstoken, refreshtoken, !!rememberMe);

        return res.status(200).json({
            message: "Sign in successful",
            isOnboarded: searchEmail.isOnboarded,
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

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await userModel.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(401).json({
                message: "User already exists",
            });
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        );

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

        OtpStorage.set(normalizedEmail, {
            otp,
            email: normalizedEmail,
            password,
            rememberMe: rememberMe ?? false,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

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

        const data = OtpStorage.get(normalizedEmail);

        if (!data) {
            return res.status(400).json({
                message: "OTP expired or not found",
            });
        }

        // Check expiry
        if (Date.now() > data.expiresAt) {
            OtpStorage.delete(normalizedEmail);

            return res.status(400).json({
                message: "OTP expired",
            });
        }

        // Check OTP
        if (Number(otp) !== data.otp) {
            return res.status(400).json({
                message: "Incorrect OTP",
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

        const { accesstoken, refreshtoken } = generateTokens(String(createUser._id));
        setAuthCookies(res, accesstoken, refreshtoken, !!data.rememberMe);

        // OTP ko delete kar do
        OtpStorage.delete(normalizedEmail);

        return res.status(200).json({
            message: "User created successfully",
            isOnboarded: false,
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
        const isProduction = process.env.NODE_ENV === "production";
        const clearOptions = {
            httpOnly: true,
            sameSite: "lax" as const,
            secure: isProduction,
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

export async function checkAuth(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        let accesstoken = req.cookies?.accesstoken;
        const refreshtoken = req.cookies?.refreshtoken;
        const secret = getJwtSecret();

        let userId: string | null = null;

        if (accesstoken) {
            try {
                const decoded = jwt.verify(accesstoken, secret) as JwtUserPayload;
                if (typeof decoded !== "string" && decoded.id) {
                    userId = decoded.id;
                }
            } catch (err) {
                // accesstoken expired or invalid, will attempt refresh below
            }
        }

        // If accesstoken is missing or expired, attempt refresh via refreshtoken
        if (!userId && refreshtoken) {
            try {
                const decodedRefresh = jwt.verify(refreshtoken, secret) as JwtUserPayload;
                if (typeof decodedRefresh !== "string" && decodedRefresh.id) {
                    userId = decodedRefresh.id;

                    // Automatically rotate & refresh both tokens
                    const tokens = generateTokens(userId);
                    setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true);
                }
            } catch (err) {
                // refreshtoken also invalid or expired
            }
        }

        if (!userId) {
            return res.status(200).json({
                valid: false,
            });
        }

        const user = await userModel
            .findById(userId)
            .select("_id email isVerified isOnboarded");

        if (!user) {
            return res.status(200).json({
                valid: false,
            });
        }

        return res.status(200).json({
            valid: true,
            user: {
                id: String(user._id),
                email: user.email,
                isVerified: user.isVerified,
                isOnboarded: user.isOnboarded,
            },
        });

    } catch (err: unknown) {
        console.log(err);

        return res.status(200).json({
            valid: false,
        });
    }
}


// =========================
// Refresh Token Endpoint
// =========================

export async function RefreshToken(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const refreshtoken = req.cookies?.refreshtoken;
        if (!refreshtoken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const secret = getJwtSecret();
        const decoded = jwt.verify(refreshtoken, secret) as JwtUserPayload;

        if (typeof decoded === "string" || !decoded.id) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const tokens = generateTokens(String(user._id));
        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true);

        return res.status(200).json({
            message: "Token refreshed successfully",
            isOnboarded: user.isOnboarded,
        });
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

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

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Google Authentication Failed",
            });
        }

        const email = user.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not found",
            });
        }

        const { accesstoken, refreshtoken } = generateTokens(String(user._id));
        setAuthCookies(res, accesstoken, refreshtoken, true);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectPath = user.isOnboarded ? "/dashboard" : "/onboarding/select-type";

        return res.redirect(
            `${frontendUrl}${redirectPath}`
        );

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
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