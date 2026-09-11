import express from "express";
import { searchInstitutions, crawlCollegeEmails, sendVerificationOtp, verifyOnboardingOtp, } from "../controllers/onboardingController.js";
import isloggedIn from "../middleware/isloggedIn.js";
const router = express.Router();
// Search institutions via AISHE API or database (accessible for instant autocomplete during onboarding)
router.get("/institutions", searchInstitutions);
// AI crawls college emails via Grok
router.post("/crawl-college-emails", crawlCollegeEmails);
// Send OTP to institutional / organization work email
router.post("/send-verification-otp", isloggedIn, sendVerificationOtp);
// Verify OTP for institutional / organization work email
router.post("/verify-otp", isloggedIn, verifyOnboardingOtp);
export default router;
//# sourceMappingURL=onboardingRoute.js.map