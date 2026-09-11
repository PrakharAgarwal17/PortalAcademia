import express from "express";
import { SignIn, SignOut, SignUp, VerifyOtp, checkAuth, RefreshToken } from "../controllers/authController.js";
import passport from "passport";
import { googleSuccess, googleFailure } from "../controllers/authController.js";
const router = express.Router();
router.post("/signin", SignIn);
router.post("/signup", SignUp);
router.post("/verifyotp", VerifyOtp);
router.post("/SignOut", SignOut);
router.post("/signout", SignOut);
router.post("/checkAuth", checkAuth);
router.get("/checkAuth", checkAuth);
router.post("/refresh", RefreshToken);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }), googleSuccess);
router.get("/google/failure", googleFailure);
export default router;
//# sourceMappingURL=authRoute.js.map