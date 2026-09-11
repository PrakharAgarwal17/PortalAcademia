import type { Request, Response } from "express";
/**
 * @description Fetch active opportunities with filtering by category, mode, domain, and recommendation
 * @route GET /api/opportunities
 * @access Public / Authenticated
 */
export declare function getOpportunities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Fetch single opportunity details
 * @route GET /api/opportunities/:id
 * @access Public / Authenticated
 */
export declare function getOpportunityById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Fetch opportunities created by the authenticated industry or institution user
 * @route GET /api/opportunities/my-published
 * @access Authenticated (Industry / Institution)
 */
export declare function getMyPublishedOpportunities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Create / publish a new opportunity
 * @route POST /api/opportunities
 * @access Authenticated (Industry / Institution)
 */
export declare function createOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Update an existing opportunity
 * @route PUT /api/opportunities/:id
 * @access Authenticated (Owner / Publisher)
 */
export declare function updateOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Close or delete an opportunity
 * @route DELETE /api/opportunities/:id
 * @access Authenticated (Owner / Publisher)
 */
export declare function deleteOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Recommend an opportunity to students or faculty
 * @route POST /api/opportunities/:id/recommend
 * @access Authenticated (Institution)
 */
export declare function recommendOpportunity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=opportunityController.d.ts.map