import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import connectDB from './config/connectDB.js'

const app=express()
connectDB()

app.listen(3000,()=>{
    console.log("Server is working")
})