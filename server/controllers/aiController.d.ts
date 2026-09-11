import type { Request, Response } from "express";
/**
 * @description Contextual AI Career Guide handling user queries with profile injection, role awareness, and Mongo TTL logging
 * @route POST /api/ai/chat
 * @access Authenticated
 */
export declare function chatWithAI(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=aiController.d.ts.map