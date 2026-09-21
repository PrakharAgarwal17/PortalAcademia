import { Router } from "express";
import isloggedIn from "../middleware/isloggedIn.js";
import {
    getSpaces,
    joinSpace,
    getSpaceMessages,
    createSpace,
} from "../controllers/communityController.js";

const router = Router();

router.get("/spaces", isloggedIn, getSpaces);
router.post("/spaces", isloggedIn, createSpace);
router.post("/spaces/:id/join", isloggedIn, joinSpace);
router.get("/spaces/:id/messages", isloggedIn, getSpaceMessages);

export default router;
