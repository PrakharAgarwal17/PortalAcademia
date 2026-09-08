import express from "express";
import {
    applyToOpportunity,
    getMyApplications,
    getApplicantsForOpportunity,
    updateApplicationStatus,
} from "../controllers/applicationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isIndustry } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Student / Faculty submits application
router.post("/", isloggedIn, applyToOpportunity);

// Applicant views their active applications
router.get("/my-applications", isloggedIn, getMyApplications);

// Industry recruiter views applicants for an opportunity
router.get("/opportunity/:opportunityId", isloggedIn, isIndustry, getApplicantsForOpportunity);

// Recruiter transitions applicant state (Shortlisted, Interview, Offered, Rejected)
router.patch("/:id/status", isloggedIn, isIndustry, updateApplicationStatus);

export default router;
