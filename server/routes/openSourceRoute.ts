import express from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import { isIndustry, isStudent } from "../middleware/rbacMiddleware.js";
import {
    createProject,
    getMyProjects,
    getAllProjects,
    getProjectContributions,
    issueCertificate,
    getMyContributions,
    handleGithubWebhook,
    getStudentContributionsForCompany,
    verifyPullRequest,
    addProjectIssue,
} from "../controllers/openSourceController.js";

const router = express.Router();

// ── Public webhook — no auth (GitHub calls this directly) ────────────────────
// Must use express.raw or express.json — already using express.json in app.ts ✅
router.post("/webhook/:projectId", handleGithubWebhook);

// ── Industry routes ───────────────────────────────────────────────────────────
router.post("/projects",                        isloggedIn, isIndustry, createProject);
router.get("/projects/mine",                    isloggedIn, isIndustry, getMyProjects);
router.post("/projects/:id/issues",             isloggedIn, isIndustry, addProjectIssue);
router.get("/projects/:id/contributions",       isloggedIn, isIndustry, getProjectContributions);
router.post("/certificate",                     isloggedIn, isIndustry, issueCertificate);
router.get("/student/:studentId/contributions", isloggedIn, isIndustry, getStudentContributionsForCompany);

// ── Student / General routes (premium gated in controller) ────────────────────
router.get("/projects",          isloggedIn, getAllProjects);
router.get("/contributions/me",  isloggedIn, getMyContributions);
router.post("/verify-pr",        isloggedIn, verifyPullRequest);

export default router;

