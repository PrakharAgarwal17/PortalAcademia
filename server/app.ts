import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import connectDB from './config/connectDB.js'
import authRoute from "./routes/authRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import "./config/Passport.js"
import session from "express-session";
import passport from "passport"

const app=express()
connectDB()

app.use(cors({
    origin:process.env.FRONTEND_URL,
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}))

app.use(
  session({
    secret: process.env.SESSION_SECRET,
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

app.listen(3000,()=>{
    console.log("Server is working")
})