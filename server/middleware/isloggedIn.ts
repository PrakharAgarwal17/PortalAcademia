import jwt from "jsonwebtoken"
import type {JwtPayload} from "jsonwebtoken"
import type { Request,Response,NextFunction } from "express"

interface MyJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
}

export default function isloggedIn(req:Request,res:Response,next:NextFunction){
    try{
        const accessToken = req.cookies?.accesstoken;
        const refreshToken = req.cookies?.refreshtoken;

        const secret = process.env.JWT_PASS_KEY || process.env.SECRET_ACCESS_TOKEN;

        if (!secret) {
             throw new Error("JWT secret key is missing");
        }

        let resolvedUserId: string | undefined;

        if (accessToken) {
            try {
                const check = jwt.verify(accessToken, secret) as MyJwtPayload;
                resolvedUserId = check.userId || check.id;
            } catch (err) {
                // Access token expired, will attempt refresh token below
            }
        }

        if (!resolvedUserId && refreshToken) {
            try {
                const checkRefresh = jwt.verify(refreshToken, secret) as MyJwtPayload;
                resolvedUserId = checkRefresh.userId || checkRefresh.id;
            } catch (err) {
                // Refresh token invalid or expired
            }
        }

        if (!resolvedUserId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        req.userId = resolvedUserId;
        next()
    }catch(err){
        console.log(err)
        return res.status(401).json({message:"Invalid or Expired Token"})
    }
}