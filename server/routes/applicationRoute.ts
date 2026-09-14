import express from "express";
import {
    applyToOpportunity,
    getMyApplications,
    getApplicantsForOpportunity,
    updateApplicationStatus,
    getSemanticRanking,
    batchTriage,
    semanticSearchCandidates,
    getAICandidateBrief,
} from "../controllers/applicationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isPublisher } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Student / Faculty submits application
router.post("/", isloggedIn, applyToOpportunity);

// Applicant views their active applications
router.get("/my-applications", isloggedIn, getMyApplications);

// Publisher (Industry or Institution) recruiter views applicants for an opportunity
router.get("/opportunity/:opportunityId", isloggedIn, isPublisher, getApplicantsForOpportunity);

// Recruiter transitions applicant state (Shortlisted, Interview, Offered, Rejected)
router.patch("/:id/status", isloggedIn, isPublisher, updateApplicationStatus);

// ── Semantic / Vector Search Endpoints ──
router.get("/opportunity/:opportunityId/semantic-ranking", isloggedIn, isPublisher, getSemanticRanking);
router.post("/opportunity/:opportunityId/batch-triage", isloggedIn, isPublisher, batchTriage);
router.post("/opportunity/:opportunityId/semantic-search", isloggedIn, isPublisher, semanticSearchCandidates);
router.get("/:id/ai-brief", isloggedIn, isPublisher, getAICandidateBrief);

export default router;
