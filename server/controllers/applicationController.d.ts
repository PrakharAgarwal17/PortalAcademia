import type { Request, Response } from "express";
/**
 * @description Apply to an active opportunity with automated objective match scoring
 * @route POST /api/applications
 * @access Authenticated (Student / Faculty)
 */
export declare function applyToOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Fetch all applications submitted by the logged-in user
 * @route GET /api/applications/my-applications
 * @access Authenticated (Student / Faculty)
 */
export declare function getMyApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Fetch all applicants for a specific opportunity (ranked by match score)
 * @route GET /api/applications/opportunity/:opportunityId
 * @access Authenticated (Opportunity Creator / Recruiter)
 */
export declare function getApplicantsForOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Transition applicant stage progression in the recruitment pipeline
 * @route PATCH /api/applications/:id/status
 * @access Authenticated (Recruiter / Industry)
 */
export declare function updateApplicationStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=applicationController.d.ts.map