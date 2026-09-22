import { Router } from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import {
    applyAsMentor,
    getMentors,
    requestMentorship,
    getMyMentorships,
    completeMentorship,
    rateMentorship,
    reportMentorship,
    getMentorshipReports,
    updateMentorshipReportStatus,
    generateMentorAssessment,
} from "../controllers/mentorshipController.js";

const router = Router();

// Mentor discovery, application & AI assessment
router.get("/mentors", isloggedIn, getMentors);
router.post("/apply", isloggedIn, applyAsMentor);
router.get("/generate-assessment", isloggedIn, generateMentorAssessment);

// Mentorship pairing lifecycle
router.post("/request", isloggedIn, requestMentorship);
router.get("/my-pairings", isloggedIn, getMyMentorships);
router.post("/:id/complete", isloggedIn, completeMentorship);
router.post("/:id/rate", isloggedIn, rateMentorship);
router.post("/:id/report", isloggedIn, reportMentorship);

// Administrative audit & misconduct review
router.get("/reports", isloggedIn, getMentorshipReports);
router.patch("/reports/:id/status", isloggedIn, updateMentorshipReportStatus);

export default router;
