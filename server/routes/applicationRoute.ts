import express from "express";
import {
    applyToOpportunity,
    getMyApplications,
    getApplicantsForOpportunity,
    updateApplicationStatus,
} from "../controllers/applicationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isPublisher } from "../middleware/rbacMiddleware.js";
import { applicationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Student / Faculty submits application
router.post("/", isloggedIn, applicationLimiter, applyToOpportunity);

// Applicant views their active applications
router.get("/my-applications", isloggedIn, getMyApplications);

// Publisher (Industry or Institution) recruiter views applicants for an opportunity
router.get("/opportunity/:opportunityId", isloggedIn, isPublisher, getApplicantsForOpportunity);

// Recruiter transitions applicant state (Shortlisted, Interview, Offered, Rejected)
router.patch("/:id/status", isloggedIn, isPublisher, updateApplicationStatus);

export default router;
