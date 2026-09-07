import jwt from "jsonwebtoken"
import type {JwtPayload} from "jsonwebtoken"
import type { Request,Response,NextFunction } from "express"

interface MyJwtPayload extends JwtPayload {
  userId: string;
}

export default function isloggedIn(req:Request,res:Response,next:NextFunction){
    try{
        const accessToken=req.cookies?.accesstoken
        if(!accessToken){
            return res.status(401).json({message:"Unauthorized User"})
        }

        const secret=process.env.SECRET_ACCESS_TOKEN

        if (!secret) {
             throw new Error("SECRET_ACCESS_TOKEN is missing");
        }

        const check=jwt.verify(accessToken,secret) as MyJwtPayload

        req.userId=check.userId
        next()
    }catch(err){
        console.log(err)
        return res.status(401).json({message:"Invalid or Expired Token"})
    }
}