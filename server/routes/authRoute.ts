import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
    SignIn,
    SignOut,
    SignUp,
    VerifyOtp,
    checkAuth,
    RefreshToken,
    oauthExchange,
    googleInitiate,
    googleCallback,
    googleFailure,
    githubSuccess,
    githubFailure,
    unlinkGithub,
} from "../controllers/authController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/signin", authLimiter, SignIn);
router.post("/signup", authLimiter, SignUp);
router.post("/verifyotp", authLimiter, VerifyOtp);
router.post("/SignOut", SignOut);
router.post("/signout", SignOut);
router.post("/checkAuth", checkAuth);
router.get("/checkAuth", checkAuth);
router.post("/oauth-exchange", oauthExchange);

// ── Google OAuth 2.0 ────────────────────────────────────────────────────────
router.get("/google", googleInitiate);
router.get("/google/callback", googleCallback);

router.get("/google/failure", googleFailure);

// ── GitHub OAuth 2.0 (Developer Identity & PR Verification) ─────────────────
router.get("/github", (req, res, next) => {
    let frontendOrigin = process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
    const originHeader = (req.headers.referer || req.headers.origin) as string | undefined;
    if (originHeader) {
        try {
            const parsed = new URL(originHeader);
            frontendOrigin = `${parsed.protocol}//${parsed.host}`;
        } catch { }
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return res.redirect(`${frontendOrigin}/premium?tab=opensource&error=github_oauth_not_configured`);
    }

    const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/premium?tab=opensource";

    // GitHub OAuth is strictly for developer identity & PR verification, not platform login.
    // The user MUST have an active authenticated session to link their GitHub account.
    const accessToken = req.cookies?.accesstoken;
    const refreshToken = req.cookies?.refreshtoken;
    let authenticatedUserId: string | null = null;

    const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY!;
    const refreshSecret = process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY!;

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

    // Support passing auth token via query parameter (e.g. from single-page app cross-domain redirects)
    if (!authenticatedUserId && typeof req.query.token === "string" && accessSecret) {
        try {
            const decoded = jwt.verify(req.query.token, accessSecret) as any;
            authenticatedUserId = decoded.id || decoded.userId || null;
        } catch { }
    }

    if (!authenticatedUserId) {
        return res.redirect(`${frontendOrigin}/auth?error=github_connect_requires_login`);
    }

    // Generate signed, tamper-proof state containing user ID, origin, and return target
    const stateToken = jwt.sign(
        {
            userId: authenticatedUserId,
            origin: frontendOrigin,
            returnTo,
            action: "link_github",
            timestamp: Date.now(),
        },
        accessSecret,
        { expiresIn: "15m" }
    );

    if (req.session as any) {
        (req.session as any).linkUserId = authenticatedUserId;
        (req.session as any).frontendOrigin = frontendOrigin;
        (req.session as any).returnTo = returnTo;
    }

    passport.authenticate("github", {
        scope: ["user:email", "read:user"],
        state: stateToken,
    })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
    let frontendOrigin = process.env.FRONTEND_URL || "https://portal-academia-phi.vercel.app";
    let returnTo = "/premium?tab=opensource";

    if (req.query?.state) {
        try {
            const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY!;
            const decoded = jwt.verify(req.query.state as string, accessSecret) as any;
            if (decoded?.origin) frontendOrigin = decoded.origin;
            if (decoded?.returnTo) returnTo = decoded.returnTo;
        } catch { }
    } else if ((req.session as any)?.frontendOrigin) {
        frontendOrigin = (req.session as any).frontendOrigin;
        if ((req.session as any)?.returnTo) {
            returnTo = (req.session as any).returnTo;
        }
    }

    const sep = returnTo.includes("?") ? "&" : "?";

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return res.redirect(`${frontendOrigin}${returnTo}${sep}error=github_oauth_not_configured`);
    }

    passport.authenticate("github", (err: any, user: any, info: any) => {
        if (err || !user) {
            console.error("[GitHub Callback Auth Failed]:", err || info);
            const errorParam = info?.message || "github_link_failed";
            return res.redirect(`${frontendOrigin}${returnTo}${sep}error=${encodeURIComponent(errorParam)}`);
        }
        req.user = user;
        return githubSuccess(req, res);
    })(req, res, next);
});

router.get("/github/failure", githubFailure);

router.post("/github/unlink", isloggedIn, unlinkGithub);

export default router;
