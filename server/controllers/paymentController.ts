import type { Request, Response } from "express";
import crypto from "crypto";
import razorpayInstance from "../config/RazorPay.js";
import membershipModel from "../models/membershipModel.js";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";

// ── Plan config ────────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
    trial:   { amount: 0,   daysValid: 7  },   // 7-day free trial — no payment
    premium: { amount: 200, daysValid: 30 },   // ₹200 / 30 days
} as const;

type PlanType = keyof typeof PLAN_CONFIG;

// ── Helpers ────────────────────────────────────────────────────────────────────
function getRazorpaySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
}

function getRazorpayKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "";
}

function addDays(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

// ── 1. Create Membership Order (handles both trial & paid) ─────────────────────
export async function createMembershipOrder(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { planType } = req.body as { planType?: string };

        if (!planType || !(planType in PLAN_CONFIG)) {
            return res.status(400).json({
                message: "Invalid planType. Must be 'trial' or 'premium'.",
            });
        }

        const plan = PLAN_CONFIG[planType as PlanType];
        const expiresAt = addDays(plan.daysValid);

        // ── FREE TRIAL path (no Razorpay involved) ────────────────────────────
        if (planType === "trial") {
            const user = await userModel.findById(userId).lean();

            // One trial per lifetime
            if (user?.hasUsedTrial) {
                return res.status(409).json({
                    message: "You have already used your free trial.",
                });
            }

            // Check if already active (trial or paid)
            const existingActive = await membershipModel.findOne({
                userId,
                status: "active",
            });
            if (existingActive) {
                return res.status(409).json({
                    message: "You already have an active membership.",
                });
            }

            // Activate trial membership directly
            const membership = await membershipModel.create({
                userId,
                planType: "trial",
                amount: 0,
                currency: "INR",
                status: "active",
                expiresAt,
            });

            // Mark user + profile as premium
            await userModel.findByIdAndUpdate(userId, {
                isPremium:        true,
                premiumExpiresAt: expiresAt,
                hasUsedTrial:     true,
            });
            await profileModel.findOneAndUpdate(
                { userId },
                { isPremium: true, premiumExpiresAt: expiresAt }
            );

            return res.status(200).json({
                success:  true,
                isTrial:  true,
                membership: {
                    planType:  membership.planType,
                    amount:    membership.amount,
                    status:    membership.status,
                    expiresAt: membership.expiresAt,
                },
            });
        }

        // ── PAID path (₹200 via Razorpay) ────────────────────────────────────
        const razorpayOrder = await razorpayInstance.orders.create({
            amount:   plan.amount * 100, // paise
            currency: "INR",
            receipt:  `membership_${userId}_${Date.now()}`,
            notes: { userId, planType },
        });

        // Persist pending membership entry
        await membershipModel.create({
            userId,
            planType: "premium",
            amount:   plan.amount,
            currency: "INR",
            status:   "pending",
            razorpayOrderId: razorpayOrder.id,
            expiresAt,
        });

        return res.status(200).json({
            success:  true,
            isTrial:  false,
            orderId:  razorpayOrder.id,
            amount:   razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId:    getRazorpayKeyId(),
        });
    } catch (error) {
        console.error("[createMembershipOrder]", error);
        return res.status(500).json({ message: "Failed to create membership order", error });
    }
}

// ── 2. Verify Membership Payment (paid plan only) ─────────────────────────────
export async function verifyMembershipPayment(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body as {
                razorpay_order_id:   string;
                razorpay_payment_id: string;
                razorpay_signature:  string;
            };

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        // HMAC-SHA256 verification
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", getRazorpaySecret())
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment signature mismatch" });
        }

        // Find pending membership
        const membership = await membershipModel.findOne({
            userId,
            razorpayOrderId: razorpay_order_id,
            status: "pending",
        });

        if (!membership) {
            return res.status(404).json({ message: "Membership order not found" });
        }

        // Activate
        membership.status            = "active";
        membership.razorpayPaymentId = razorpay_payment_id;
        membership.razorpaySignature = razorpay_signature;
        await membership.save();

        await userModel.findByIdAndUpdate(userId, {
            isPremium:        true,
            premiumExpiresAt: membership.expiresAt,
        });
        await profileModel.findOneAndUpdate(
            { userId },
            { isPremium: true, premiumExpiresAt: membership.expiresAt }
        );

        return res.status(200).json({
            success: true,
            membership: {
                planType:  membership.planType,
                amount:    membership.amount,
                status:    membership.status,
                expiresAt: membership.expiresAt,
            },
        });
    } catch (error) {
        console.error("[verifyMembershipPayment]", error);
        return res.status(500).json({ message: "Payment verification failed", error });
    }
}

// ── 3. Get Membership Status ──────────────────────────────────────────────────
export async function getMembershipStatus(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await userModel.findById(userId).lean();

        const membership = await membershipModel
            .findOne({ userId, status: "active" })
            .sort({ createdAt: -1 })
            .lean();

        if (!membership) {
            return res.status(200).json({
                isPremium:    false,
                hasUsedTrial: user?.hasUsedTrial ?? false,
                membership:   null,
            });
        }

        const now = new Date();
        const isStillActive = membership.expiresAt > now;

        if (!isStillActive) {
            // Async cleanup — doesn't block response
            membershipModel.findByIdAndUpdate(membership._id, { status: "expired" }).catch(console.error);
            userModel.findByIdAndUpdate(userId, { isPremium: false }).catch(console.error);
            profileModel.findOneAndUpdate({ userId }, { isPremium: false }).catch(console.error);

            return res.status(200).json({
                isPremium:    false,
                hasUsedTrial: user?.hasUsedTrial ?? false,
                membership:   null,
            });
        }

        return res.status(200).json({
            isPremium:    true,
            hasUsedTrial: user?.hasUsedTrial ?? false,
            membership: {
                planType:  membership.planType,
                amount:    membership.amount,
                expiresAt: membership.expiresAt,
                status:    membership.status,
            },
        });
    } catch (error) {
        console.error("[getMembershipStatus]", error);
        return res.status(500).json({ message: "Failed to fetch membership status", error });
    }
}