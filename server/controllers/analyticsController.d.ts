import type { Request, Response } from "express";
/**
 * @description Compute cohort readiness, skill distribution, and curriculum deficits via MongoDB Aggregation Pipelines
 * @route GET /api/analytics/institution/cohort
 * @access Authenticated (Institution)
 */
export declare function getCohortAnalytics(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Compute industry hiring demand trends and market deficits via MongoDB Aggregation Pipelines
 * @route GET /api/analytics/industry/market-trends
 * @access Public / Authenticated
 */
export declare function getMarketTrends(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Compute student individual skill distance vs live industry postings
 * @route GET /api/analytics/student/gap
 * @access Authenticated (Student)
 */
export declare function getStudentSkillGap(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=analyticsController.d.ts.map