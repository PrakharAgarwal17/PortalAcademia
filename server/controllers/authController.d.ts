import type { Request, Response } from "express";
interface SignUpBody {
    email?: string;
    password?: string;
    confirmPassword?: string;
    rememberMe?: boolean;
}
interface SignInBody {
    email?: string;
    password?: string;
    rememberMe?: boolean;
}
interface VerifyOtpBody {
    email?: string;
    otp?: string | number;
}
export declare function generateTokens(userId: string, rememberMe?: boolean): {
    accesstoken: string;
    refreshtoken: string;
};
export declare function setAuthCookies(res: Response, accesstoken: string, refreshtoken: string, rememberMe?: boolean): void;
export declare function SignIn(req: Request<{}, {}, SignInBody>, res: Response): Promise<Response>;
export declare function SignUp(req: Request<{}, {}, SignUpBody>, res: Response): Promise<Response>;
export declare function VerifyOtp(req: Request<{}, {}, VerifyOtpBody>, res: Response): Promise<Response>;
export declare function SignOut(req: Request, res: Response): Response;
export declare function checkAuth(req: Request, res: Response): Promise<Response>;
export declare function RefreshToken(req: Request, res: Response): Promise<Response>;
export declare const googleSuccess: (req: Request, res: Response) => Promise<Response | void>;
export declare const googleFailure: (req: Request, res: Response) => Response;
export {};
//# sourceMappingURL=authController.d.ts.map