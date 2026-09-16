import express from "express";
import {
    getCohortAnalytics,
    getMarketTrends,
    getStudentSkillGap,
} from "../controllers/analyticsController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isInstitution } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Institution cohort readiness & curriculum deficit telemetry (Aggregation pipeline)
router.get("/institution/cohort", isloggedIn, isInstitution, getCohortAnalytics);

// Market hiring demand vs talent supply trends (Aggregation pipeline)
router.get("/industry/market-trends", isloggedIn, getMarketTrends);

// Individual student skill gap distance benchmark
router.get("/student/gap", isloggedIn, getStudentSkillGap);

export default router;
