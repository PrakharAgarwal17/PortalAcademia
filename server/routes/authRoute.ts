import express from "express"
import {
    SignIn,
    SignOut,
    SignUp,
    VerifyOtp,
    checkAuth,
    RefreshToken,
    oauthExchange,
    googleSuccess,
    googleFailure,
    githubSuccess,
    githubFailure,
    unlinkGithub,
} from "../controllers/authController.js"
import passport from "passport";
import isloggedIn from "../middleware/isloggedIn.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router()

router.post("/signin", authLimiter, SignIn)
router.post("/signup", authLimiter, SignUp)
router.post("/verifyotp", authLimiter, VerifyOtp)
router.post("/SignOut", SignOut)
router.post("/signout", SignOut)
router.post("/checkAuth", checkAuth)
router.get("/checkAuth", checkAuth)
router.post("/oauth-exchange", oauthExchange)
router.get("/google", (req, res, next) => {
    const originHeader = (req.headers.referer || req.headers.origin) as string | undefined;
    if (originHeader && (req.session as any)) {
        try {
            const parsed = new URL(originHeader);
            (req.session as any).frontendOrigin = `${parsed.protocol}//${parsed.host}`;
        } catch { }
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err || !user) {
            console.error("[Google OAuth Callback Error]:", err || info);
            const sessionOrigin = (req.session as any)?.frontendOrigin;
            const frontendUrl = sessionOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
            const errCode = err?.message?.includes("email") ? "email_not_found" : "google_auth_failed";
            return res.redirect(`${frontendUrl}/auth?error=${errCode}`);
        }
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error("[Google OAuth req.login Error]:", loginErr);
                const frontendUrl = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
                return res.redirect(`${frontendUrl}/auth?error=google_auth_failed`);
            }
            return googleSuccess(req, res);
        });
    })(req, res, next);
});

router.get("/google/failure", googleFailure);

import jwt from "jsonwebtoken";

// ── GitHub OAuth 2.0 (Login, Sign-Up & Developer Verification) ──────────────
router.get("/github", (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const origin = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
        return res.redirect(`${origin}/auth?error=github_oauth_not_configured`);
    }

    const originHeader = (req.headers.referer || req.headers.origin) as string | undefined;
    if (req.session as any) {
        if (originHeader) {
            try {
                const parsed = new URL(originHeader);
                (req.session as any).frontendOrigin = `${parsed.protocol}//${parsed.host}`;
            } catch { }
        }
        if (req.query.returnTo && typeof req.query.returnTo === "string") {
            (req.session as any).returnTo = req.query.returnTo;
        }
    }

    // Inspect if user has an active session cookie to link an existing account
    const accessToken = req.cookies?.accesstoken;
    const refreshToken = req.cookies?.refreshtoken;
    let authenticatedUserId: string | null = null;

    const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY;
    const refreshSecret = process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY;

    if (accessToken && accessSecret) {
        try {
            const decoded = jwt.verify(accessToken, accessSecret) as any;
            authenticatedUserId = decoded.id || decoded.userId || null;
        } catch { }
    }

    if (!authenticatedUserId && refreshToken && refreshSecret) {
        try {
            const decoded = jwt.verify(refreshToken, refreshSecret) as any;
            authenticatedUserId = decoded.id || decoded.userId || null;
        } catch { }
    }

    // If authenticated, we link to this user; otherwise, it's a direct login/signup
    if (req.session as any) {
        if (authenticatedUserId) {
            (req.session as any).linkUserId = authenticatedUserId;
            (req.session as any).isLinking = true;
        } else {
            (req.session as any).linkUserId = null;
            (req.session as any).isLinking = false;
        }
    }

    passport.authenticate("github", { scope: ["user:email", "read:user"] })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const origin = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
        return res.redirect(`${origin}/auth?error=github_oauth_not_configured`);
    }

    passport.authenticate("github", (err: any, user: any, info: any) => {
        if (err || !user) {
            console.error("[GitHub OAuth Callback Error]:", err || info);
            const sessionOrigin = (req.session as any)?.frontendOrigin;
            const frontendUrl = sessionOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
            const returnTo = (req.session as any)?.returnTo;
            if (returnTo) {
                const sep = returnTo.includes("?") ? "&" : "?";
                return res.redirect(`${frontendUrl}${returnTo}${sep}error=github_link_failed`);
            }
            return res.redirect(`${frontendUrl}/auth?error=github_auth_failed`);
        }
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error("[GitHub OAuth req.login Error]:", loginErr);
                const frontendUrl = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
                return res.redirect(`${frontendUrl}/auth?error=github_auth_failed`);
            }
            return githubSuccess(req, res);
        });
    })(req, res, next);
});

router.get("/github/failure", githubFailure);

router.post("/github/unlink", isloggedIn, unlinkGithub);

export default router