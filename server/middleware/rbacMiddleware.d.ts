import type { Request, Response, NextFunction } from "express";
import { type AccountType, type IProfile } from "../models/profileModel.js";
declare global {
    namespace Express {
        interface Request {
            userProfile?: IProfile;
        }
    }
}
/**
 * Higher-order middleware that validates whether the authenticated user possesses
 * one of the permitted AccountType roles.
 */
export declare function authorizeRoles(...allowedRoles: AccountType[]): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isStudent: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isFaculty: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isInstitution: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isIndustry: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isPublisher: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isAcademic: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=rbacMiddleware.d.ts.map