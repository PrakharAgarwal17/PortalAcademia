import express from "express";
import {
    getOpportunities,
    getOpportunityById,
    getMyPublishedOpportunities,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    recommendOpportunity,
} from "../controllers/opportunityController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isPublisher, isInstitution } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Public / Authenticated read listings
router.get("/", isloggedIn, getOpportunities);

// Publisher's own listings
router.get("/my-published", isloggedIn, isPublisher, getMyPublishedOpportunities);

// Single opportunity view
router.get("/:id", isloggedIn, getOpportunityById);

// Create new listing (Industry or Institution)
router.post("/", isloggedIn, isPublisher, createOpportunity);

// Update listing (Publisher)
router.put("/:id", isloggedIn, isPublisher, updateOpportunity);

// Close listing (Publisher)
router.delete("/:id", isloggedIn, isPublisher, deleteOpportunity);

// Endorse / Recommend to students or faculty (Institution only)
router.post("/:id/recommend", isloggedIn, isInstitution, recommendOpportunity);

export default router;
