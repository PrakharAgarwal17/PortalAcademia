import mongoose from "mongoose"

function getMongoUri(): string {
    const raw = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://root:rootpassword@127.0.0.1:27017";
    if (raw.includes("/PortalAcademia")) {
        return raw;
    }
    if (raw.includes("?")) {
        return raw.replace("?", "/PortalAcademia?");
    }
    return `${raw.replace(/\/+$/, "")}/PortalAcademia`;
}

export default async function connectDB(){
    try{
        await mongoose.connect(getMongoUri(), { dbName: "PortalAcademia" });
        console.log("MongoDB connected successfully")
    }catch(err){
        console.log("MongoDB failed to connect")
        console.log(err)
    }
}