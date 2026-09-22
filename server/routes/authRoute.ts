import express from "express"
import { SignIn, SignOut, SignUp, VerifyOtp, checkAuth, RefreshToken, oauthExchange } from "../controllers/authController.js"
import passport from "passport";
import { googleSuccess, googleFailure } from "../controllers/authController.js";

const router = express.Router()

router.post("/signin", SignIn)
router.post("/signup", SignUp)
router.post("/verifyotp", VerifyOtp)
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

export default router