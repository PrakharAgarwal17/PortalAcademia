import express from "express";
import {
    getMyProfile,
    createOrUpdateProfile,
    getProfileById,
} from "../controllers/profileController.js";
import { verifyCredential } from "../controllers/verificationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isInstitution } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Current authenticated user's profile
router.get("/me", isloggedIn, getMyProfile);

// Create / initial onboarding submission
router.post("/", isloggedIn, createOrUpdateProfile);

// Update profile anytime later (skills, experience, certifications, bio, etc.)
router.put("/", isloggedIn, createOrUpdateProfile);

// Institution verifies student credential directly on profile
router.put("/verify-credential/:studentId/:credentialId", isloggedIn, isInstitution, verifyCredential);

// Public profile view by user ID or profile ID
router.get("/:id", isloggedIn, getProfileById);

export default router;

