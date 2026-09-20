import Razorpay from "razorpay";

// Support both naming conventions:
//   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET  (standard Razorpay docs)
//   RAZORPAY_KEY    / RAZORPAY_SECRET      (what this project's .env uses)
const razorpayInstance = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID     || process.env.RAZORPAY_KEY     || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET  || "",
});

export default razorpayInstance;