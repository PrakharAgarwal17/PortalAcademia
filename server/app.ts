import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import connectDB from './config/connectDB.js'
import authRoute from "./routes/authRoute.js"
import profileRoute from "./routes/profileRoute.js"
import onboardingRoute from "./routes/onboardingRoute.js"
import uploadRoute from "./routes/uploadRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import "./config/Passport.js"
import session from "express-session";
import passport from "passport"

import opportunityRoute from "./routes/opportunityRoute.js"
import applicationRoute from "./routes/applicationRoute.js"
import assessmentRoute from "./routes/assessmentRoute.js"
import verificationRoute from "./routes/verificationRoute.js"
import analyticsRoute from "./routes/analyticsRoute.js"
import aiRoute from "./routes/aiRoute.js"

const app=express()
connectDB()

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_session_secret_portal_academia",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.send("Working website")
})
app.use("/api/auth",authRoute)
app.use("/api/profile",profileRoute)
app.use("/api/onboarding",onboardingRoute)
app.use("/api/upload",uploadRoute)
app.use("/api/opportunities",opportunityRoute)
app.use("/api/applications",applicationRoute)
app.use("/api/assessments",assessmentRoute)
app.use("/api/verification",verificationRoute)
app.use("/api/analytics",analyticsRoute)
app.use("/api/ai",aiRoute)

app.listen(3000,()=>{
    console.log("Server is working")
})