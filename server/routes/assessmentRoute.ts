import express from "express";
import {
    getAssessments,
    getAssessmentById,
    submitAssessment,
    getMyResults,
    generateSkillAssessment,
    generateSoftSkillAssessment,
} from "../controllers/assessmentController.js";
import isloggedIn from "../middleware/isloggedIn.js";

const router = express.Router();

// List all assessments (public/auth view)
router.get("/", isloggedIn, getAssessments);

// Past assessment attempts for authenticated user (student, faculty, etc.)
router.get("/my-results", isloggedIn, getMyResults);

// Generate custom skill assessment based on selected profile skills or on-the-spot target skill
router.post("/generate", isloggedIn, generateSkillAssessment);
router.post("/generate-for-user", isloggedIn, generateSkillAssessment);

// Generate dedicated scenario-based soft skills assessment with multi-dimensional weighted scoring
router.post("/generate-soft-skills", isloggedIn, generateSoftSkillAssessment);

// Specific assessment questions (without answer keys)
router.get("/:id", isloggedIn, getAssessmentById);

// Submit answers, compute objective score, update profile verified skills
router.post("/:id/submit", isloggedIn, submitAssessment);

export default router;
