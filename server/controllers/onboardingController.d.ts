import type { Request, Response } from "express";
export declare function searchInstitutions(req: Request, res: Response): Promise<Response>;
export declare function deriveOfficialInstitutionEmails(institutionName: string, website?: string): string[];
export declare function crawlCollegeEmails(req: Request, res: Response): Promise<Response>;
export declare function sendVerificationOtp(req: Request, res: Response): Promise<Response>;
export declare function verifyOnboardingOtp(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=onboardingController.d.ts.map