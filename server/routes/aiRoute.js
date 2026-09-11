import express from "express";
import { chatWithAI } from "../controllers/aiController.js";
import isloggedIn from "../middleware/isloggedIn.js";
const router = express.Router();
// Contextual AI Career Guide consultation
router.post("/chat", isloggedIn, chatWithAI);
export default router;
//# sourceMappingURL=aiRoute.js.map