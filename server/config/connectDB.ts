import mongoose from "mongoose"

export default function connectDB(){
    try{
        mongoose.connect(`${process.env.MONGO_URL}/PortalAcademia`)
        console.log("MongoDB connected successfully")
    }catch(err){
        console.log("MongoDB failed to connect")
        console.log(err)
    }
}