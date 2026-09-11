import type { Request, Response } from "express";
/**
 * GET /api/profile/me
 * Retrieves the profile of the currently authenticated user
 */
export declare function getMyProfile(req: Request, res: Response): Promise<Response>;
/**
 * POST /api/profile & PUT /api/profile
 * Creates or updates the user profile dynamically and marks isOnboarded: true.
 * Designed so that all sections (skills, education, certifications, experiences)
 * can be updated seamlessly anytime in the future!
 */
export declare function createOrUpdateProfile(req: Request, res: Response): Promise<Response>;
/**
 * GET /api/profile/:id
 * Retrieves public profile by user ID or profile ID
 */
export declare function getProfileById(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=profileController.d.ts.map