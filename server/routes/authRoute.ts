import express from "express"
import { SignIn , SignOut , SignUp , VerifyOtp , checkAuth } from "../controllers/authController.js"

const router=express.Router()

router.post("/signin",SignIn)
router.post("/signup",SignUp)
router.post("/verifyotp",VerifyOtp)
router.post("/SignOut",SignOut)
router.post("/checkAuth",checkAuth)

export default router