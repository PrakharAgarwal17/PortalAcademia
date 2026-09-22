import express from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import { isInstitution } from "../middleware/rbacMiddleware.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    broadcastAnnouncement,
    getBroadcastHistory,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/",                      isloggedIn, getNotifications);
router.patch("/:id/read",            isloggedIn, markAsRead);
router.patch("/read-all",            isloggedIn, markAllAsRead);

// Institutional announcements
router.post("/broadcast",            isloggedIn, isInstitution, broadcastAnnouncement);
router.get("/broadcast-history",     isloggedIn, isInstitution, getBroadcastHistory);

export default router;

