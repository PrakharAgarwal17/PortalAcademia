import type { Request, Response } from "express";
/**
 * @description Fetch all pending unverified credentials for students of the institution
 * @route GET /api/verification/pending
 * @access Authenticated (Institution)
 */
export declare function getPendingVerifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Verify or reject a student's uploaded credential / certification
 * @route PUT /api/profile/verify-credential/:studentId/:credentialId
 * @route PUT /api/verification/verify/:studentId/:credentialId
 * @access Authenticated (Institution)
 */
export declare function verifyCredential(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=verificationController.d.ts.map