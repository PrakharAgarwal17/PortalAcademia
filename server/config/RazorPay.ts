import Razorpay from "razorpay";

// Support both naming conventions:
//   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET  (standard Razorpay docs)
//   RAZORPAY_KEY    / RAZORPAY_SECRET      (what this project's .env uses)

let instance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
    if (!instance) {
        const key_id = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "";
        const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
        instance = new Razorpay({ key_id, key_secret });
    }
    return instance;
}

// Proxy wrapper preserves backward compatibility with direct `razorpayInstance.orders.create` calls
const razorpayInstance = new Proxy({} as Razorpay, {
    get(_target, prop) {
        const client = getRazorpayInstance() as any;
        return typeof client[prop] === "function" ? client[prop].bind(client) : client[prop];
    },
});

export default razorpayInstance;