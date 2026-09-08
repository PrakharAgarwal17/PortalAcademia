import express from "express";
import {
    searchInstitutions,
    crawlCollegeEmails,
    sendVerificationOtp,
    verifyOnboardingOtp,
} from "../controllers/onboardingController.js";
import isloggedIn from "../middleware/isloggedIn.js";

const router = express.Router();

// Search institutions via AISHE API or database (accessible to authenticated users)
router.get("/institutions", isloggedIn, searchInstitutions);

// AI crawls college emails via Grok
router.post("/crawl-college-emails", isloggedIn, crawlCollegeEmails);

// Send OTP to institutional / organization work email
router.post("/send-verification-otp", isloggedIn, sendVerificationOtp);

// Verify OTP for institutional / organization work email
router.post("/verify-otp", isloggedIn, verifyOnboardingOtp);

export default router;
