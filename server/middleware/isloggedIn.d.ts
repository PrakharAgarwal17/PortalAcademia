import type { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
export default function isloggedIn(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=isloggedIn.d.ts.map