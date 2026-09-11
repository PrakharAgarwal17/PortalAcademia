import type { Request, Response } from "express";
/**
 * @description List all standardized skill assessments
 * @route GET /api/assessments
 * @access Public / Authenticated
 */
export declare function getAssessments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Get a specific assessment for examination
 * @route GET /api/assessments/:id
 * @access Authenticated
 */
export declare function getAssessmentById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Submit assessment answers, compute objective score, and award verified badge/skills
 * @route POST /api/assessments/:id/submit
 * @access Authenticated (Student)
 */
export declare function submitAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * @description Get all past assessment results for the logged-in student
 * @route GET /api/assessments/my-results
 * @access Authenticated (Student)
 */
export declare function getMyResults(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=assessmentController.d.ts.map