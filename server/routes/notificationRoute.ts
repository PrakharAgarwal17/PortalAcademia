import express from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/",                isloggedIn, getNotifications);
router.patch("/:id/read",      isloggedIn, markAsRead);
router.patch("/read-all",      isloggedIn, markAllAsRead);

export default router;
