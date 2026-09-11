import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt, {} from "jsonwebtoken";
import nodemailer from "nodemailer";
// =========================
// OTP Storage
// =========================
const OtpStorage = new Map();
// =========================
// Environment Variables & Helpers
// =========================
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_REMEMBER_EXPIRY = "30d";
function getAccessSecret() {
    return process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY || "access_token_secret_key";
}
function getRefreshSecret() {
    return process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY || "refresh_token_secret_key";
}
export function generateTokens(userId, rememberMe = false) {
    const accesstoken = jwt.sign({ id: userId }, getAccessSecret(), {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshtoken = jwt.sign({ id: userId }, getRefreshSecret(), {
        expiresIn: rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRY : REFRESH_TOKEN_EXPIRY,
    });
    return { accesstoken, refreshtoken };
}
export function setAuthCookies(res, accesstoken, refreshtoken, rememberMe = false) {
    const isProd = process.env.NODE_ENV === "production";
    const baseOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
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
function getEmailCredentials() {
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
export async function SignIn(req, res) {
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
        const isMatch = await bcrypt.compare(password, searchEmail.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Either Email or Password is incorrect",
            });
        }
        const { accesstoken, refreshtoken } = generateTokens(String(searchEmail._id), Boolean(rememberMe));
        setAuthCookies(res, accesstoken, refreshtoken, Boolean(rememberMe));
        return res.status(200).json({
            message: "Sign in successful",
            isOnboarded: searchEmail.isOnboarded,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}
// =========================
// Sign Up
// =========================
export async function SignUp(req, res) {
    try {
        const { email, password, confirmPassword, rememberMe, } = req.body;
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
        const otp = Math.floor(100000 + Math.random() * 900000);
        const { email: senderEmail, password: senderPassword, } = getEmailCredentials();
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
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}
// =========================
// Verify OTP
// =========================
export async function VerifyOtp(req, res) {
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
        const newPass = await bcrypt.hash(data.password, 10);
        const createUser = await userModel.create({
            email: data.email,
            password: newPass,
            provider: "local",
            isVerified: true,
            // User ne abhi onboarding complete nahi kiya
            isOnboarded: false,
        });
        const { accesstoken, refreshtoken } = generateTokens(String(createUser._id), Boolean(data.rememberMe));
        setAuthCookies(res, accesstoken, refreshtoken, Boolean(data.rememberMe));
        // OTP ko delete kar do
        OtpStorage.delete(normalizedEmail);
        return res.status(200).json({
            message: "User created successfully",
            isOnboarded: false,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}
// =========================
// Sign Out
// =========================
export function SignOut(req, res) {
    try {
        const isProd = process.env.NODE_ENV === "production";
        const clearOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            path: "/",
        };
        res.clearCookie("accesstoken", clearOptions);
        res.clearCookie("refreshtoken", clearOptions);
        return res.status(200).json({
            message: "Logout done",
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}
// =========================
// Check Auth
// =========================
export async function checkAuth(req, res) {
    try {
        const accesstoken = req.cookies?.accesstoken;
        const refreshtoken = req.cookies?.refreshtoken;
        // 1. First check accesstoken
        if (accesstoken) {
            try {
                const decoded = jwt.verify(accesstoken, getAccessSecret());
                if (decoded && decoded.id && typeof decoded.id === "string") {
                    const user = await userModel
                        .findById(decoded.id)
                        .select("_id email isVerified isOnboarded");
                    if (user) {
                        return res.status(200).json({
                            valid: true,
                            user: {
                                id: String(user._id),
                                email: user.email,
                                isVerified: user.isVerified,
                                isOnboarded: user.isOnboarded,
                            },
                        });
                    }
                }
            }
            catch (tokenErr) {
                // accesstoken expired or invalid, fall through to refreshtoken
            }
        }
        // 2. If accesstoken is missing or expired, check refreshtoken
        if (refreshtoken) {
            try {
                const decoded = jwt.verify(refreshtoken, getRefreshSecret());
                if (decoded && decoded.id && typeof decoded.id === "string") {
                    const user = await userModel
                        .findById(decoded.id)
                        .select("_id email isVerified isOnboarded");
                    if (user) {
                        // Re-issue both tokens
                        const tokens = generateTokens(String(user._id), true);
                        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true);
                        return res.status(200).json({
                            valid: true,
                            user: {
                                id: String(user._id),
                                email: user.email,
                                isVerified: user.isVerified,
                                isOnboarded: user.isOnboarded,
                            },
                        });
                    }
                }
            }
            catch (refreshErr) {
                // refreshtoken also invalid or expired
            }
        }
        return res.status(200).json({
            valid: false,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(200).json({
            valid: false,
        });
    }
}
// =========================
// Refresh Token
// =========================
export async function RefreshToken(req, res) {
    try {
        const refreshtoken = req.cookies?.refreshtoken;
        if (!refreshtoken) {
            return res.status(401).json({
                message: "Refresh token missing",
            });
        }
        const decoded = jwt.verify(refreshtoken, getRefreshSecret());
        if (!decoded || !decoded.id || typeof decoded.id !== "string") {
            return res.status(401).json({
                message: "Invalid refresh token",
            });
        }
        const user = await userModel
            .findById(decoded.id)
            .select("_id email isVerified isOnboarded");
        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }
        const tokens = generateTokens(String(user._id), true);
        setAuthCookies(res, tokens.accesstoken, tokens.refreshtoken, true);
        return res.status(200).json({
            message: "Token refreshed successfully",
            user: {
                id: String(user._id),
                email: user.email,
                isVerified: user.isVerified,
                isOnboarded: user.isOnboarded,
            },
        });
    }
    catch (err) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
}
export const googleSuccess = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
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
        // Generate ONLY accesstoken and refreshtoken (no third token name!)
        const { accesstoken, refreshtoken } = generateTokens(String(user._id), true);
        setAuthCookies(res, accesstoken, refreshtoken, true);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectPath = user.isOnboarded ? "/dashboard" : "/onboarding/select-type";
        return res.redirect(`${frontendUrl}${redirectPath}`);
    }
    catch (error) {
        console.error("Google Auth error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
export const googleFailure = (req, res) => {
    return res.status(401).json({
        success: false,
        message: "Google Authentication Failed",
    });
};
//# sourceMappingURL=authController.js.map