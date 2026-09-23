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

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }), googleSuccess);

router.get("/google/failure", googleFailure);

import jwt from "jsonwebtoken";

// ── GitHub OAuth 2.0 (Developer Identity & PR Verification) ─────────────────
router.get("/github", (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const origin = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
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

    // GitHub OAuth is strictly for developer identity & PR verification, not platform login.
    // The user MUST have an active authenticated session to link their GitHub account.
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

    if (!authenticatedUserId) {
        const origin = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${origin}/auth?error=github_connect_requires_login`);
    }

    if (req.session as any) {
        (req.session as any).linkUserId = authenticatedUserId;
    }

    passport.authenticate("github", { scope: ["user:email", "read:user"] })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const origin = (req.session as any)?.frontendOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${origin}/auth?error=github_oauth_not_configured`);
    }
    passport.authenticate("github", { failureRedirect: "/api/auth/github/failure" })(req, res, next);
}, githubSuccess);

router.get("/github/failure", githubFailure);

router.post("/github/unlink", isloggedIn, unlinkGithub);

export default router