import express from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import {
    createMembershipOrder,
    verifyMembershipPayment,
    getMembershipStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

// All payment routes are protected — user must be logged in
router.post("/create-order", isloggedIn, createMembershipOrder);
router.post("/verify",       isloggedIn, verifyMembershipPayment);
router.get("/status",        isloggedIn, getMembershipStatus);

export default router;
