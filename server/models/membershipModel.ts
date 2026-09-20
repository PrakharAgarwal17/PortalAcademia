import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMembership extends Document {
    userId: mongoose.Types.ObjectId;
    planType: "trial" | "premium";
    amount: number;
    currency: string;
    status: "pending" | "active" | "expired" | "failed";
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    razorpaySignature?: string | null;
    startDate: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        planType: {
            type: String,
            enum: ["trial", "premium"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["pending", "active", "expired", "failed"],
            default: "pending",
            index: true,
        },
        razorpayOrderId: {
            type: String,
            default: null,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },
        razorpaySignature: {
            type: String,
            default: null,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const membershipModel: Model<IMembership> = mongoose.model<IMembership>(
    "Membership",
    membershipSchema
);

export default membershipModel;
