import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

interface MyJwtPayload extends JwtPayload {
    id?: string;
    userId?: string;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

function getAccessSecret(): string {
    return process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY || "access_token_secret_key";
}

function getRefreshSecret(): string {
    return process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY || "refresh_token_secret_key";
}

export default function isloggedIn(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
        const accessToken = req.cookies?.accesstoken || bearerToken;
        const refreshToken = req.cookies?.refreshtoken;

        if (accessToken) {
            try {
                const check = jwt.verify(accessToken, getAccessSecret()) as MyJwtPayload;
                const userId = check.id || check.userId;
                if (userId) {
                    req.userId = userId;
                    return next();
                }
            } catch (tokenErr) {
                // accesstoken expired or invalid, fall through to refreshtoken
            }
        }

        if (refreshToken) {
            try {
                const check = jwt.verify(refreshToken, getRefreshSecret()) as MyJwtPayload;
                const userId = check.id || check.userId;
                if (userId) {
                    req.userId = userId;

                    // Re-issue new accesstoken
                    const isProd = process.env.NODE_ENV === "production";
                    const isHttps = Boolean(req.secure) || req.headers["x-forwarded-proto"] === "https" || isProd;
                    const newAccessToken = jwt.sign({ id: userId }, getAccessSecret(), {
                        expiresIn: "15m",
                    });

                    res.cookie("accesstoken", newAccessToken, {
                        httpOnly: true,
                        secure: isHttps,
                        sameSite: isHttps ? ("none" as const) : ("lax" as const),
                        path: "/",
                        maxAge: 15 * 60 * 1000,
                    });

                    return next();
                }
            } catch (refreshErr) {
                // refreshToken invalid
            }
        }

        return res.status(401).json({ message: "Unauthorized User" });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
}