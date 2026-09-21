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

export default async function connectDB() {
    const primaryUri = getMongoUri();
    try {
        await mongoose.connect(primaryUri, { dbName: "PortalAcademia", serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB connected successfully via primary cluster");
    } catch (err: any) {
        console.warn("Primary MongoDB cluster connection unreachable:", err?.message);
        console.log("Attempting fallback to local MongoDB instance (localhost:27017)...");
        try {
            await mongoose.connect("mongodb://root:rootpassword@localhost:27017/PortalAcademia?authSource=admin", { serverSelectionTimeoutMS: 5000 });
            console.log("MongoDB connected successfully via local instance (authenticated)");
        } catch {
            try {
                await mongoose.connect("mongodb://localhost:27017/PortalAcademia", { serverSelectionTimeoutMS: 5000 });
                console.log("MongoDB connected successfully via local instance");
            } catch (fallbackErr) {
                console.error("MongoDB failed to connect to all cluster and local targets:", fallbackErr);
            }
        }
    }
}