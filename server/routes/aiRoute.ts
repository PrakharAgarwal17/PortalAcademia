import express from "express";
import { chatWithAI } from "../controllers/aiController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Contextual AI Career Guide consultation
router.post("/chat", isloggedIn, aiLimiter, chatWithAI);

export default router;
