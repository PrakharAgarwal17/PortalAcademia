import express from "express";
import { getPendingVerifications, verifyCredential, } from "../controllers/verificationController.js";
import isloggedIn from "../middleware/isloggedIn.js";
import { isInstitution } from "../middleware/rbacMiddleware.js";
const router = express.Router();
// Institution reviews pending student credentials
router.get("/pending", isloggedIn, isInstitution, getPendingVerifications);
// Institution verifies or rejects a student credential
router.put("/verify/:studentId/:credentialId", isloggedIn, isInstitution, verifyCredential);
export default router;
//# sourceMappingURL=verificationRoute.js.map