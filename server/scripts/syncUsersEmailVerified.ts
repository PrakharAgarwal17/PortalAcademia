import "dotenv/config";
import mongoose from "mongoose";

async function run() {
  const mongoUrl = process.env.MONGO_URL || "mongodb://root:rootpassword@localhost:27017/PortalAcademia";
  await mongoose.connect(mongoUrl, { dbName: "PortalAcademia" });

  const result = await mongoose.connection.collection("users").updateMany(
    { isEmailVerified: { $exists: false } },
    { $set: { isEmailVerified: false } }
  );
  console.log("Updated users without isEmailVerified:", result.modifiedCount);

  // For profiles that have verified institutionEmail, ensure user also has isEmailVerified: true
  const profiles = await mongoose.connection.collection("profiles").find({}).toArray();
  for (const p of profiles) {
    if (p.isEmailVerified && p.userId && p.institutionEmail) {
      await mongoose.connection.collection("users").updateOne(
        { _id: p.userId },
        { $set: { isEmailVerified: true } }
      );
      console.log(`Synced isEmailVerified: true for user ${p.userId} (${p.name})`);
    }
  }

  const allUsers = await mongoose.connection.collection("users").find({}).toArray();
  console.log("ALL USERS:", allUsers.map((u) => ({
    id: u._id,
    email: u.email,
    isVerified: u.isVerified,
    isEmailVerified: u.isEmailVerified,
    isOnboarded: u.isOnboarded,
  })));

  await mongoose.disconnect();
}

run().catch(console.error);
