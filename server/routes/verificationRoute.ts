import express from "express";
import {
    getPendingVerifications,
    verifyCredential,
    getInstitutionStudents,
    getInstitutionMembers,
    getInstitutionMemberById,
} from "../controllers/verificationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isInstitution } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Institution reviews pending student credentials
router.get("/pending", isloggedIn, isInstitution, getPendingVerifications);

// Institution verifies or rejects a student credential
router.put("/verify/:studentId/:credentialId", isloggedIn, isInstitution, verifyCredential);

// Institution views enrolled students directory
router.get("/institution-students", isloggedIn, isInstitution, getInstitutionStudents);

// Institution views full directory (students & faculty with role filtering)
router.get("/institution-members", isloggedIn, isInstitution, getInstitutionMembers);

// Institution views single member profile & skill gap diagnostics
router.get("/institution-members/:id", isloggedIn, isInstitution, getInstitutionMemberById);

export default router;
