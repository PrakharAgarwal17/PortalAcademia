import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface UserSchema extends Document {
    email: string;
    password: string;
    provider: string;
    providerID: string;
    isVerified: boolean;
    isOnboarded: boolean;
    isEmailVerified?: boolean;
    isPremium?: boolean;
    planTier?: "free" | "trial" | "paid";
    hasUsedTrial?: boolean;
    trialEndsAt?: Date | null;
    premiumExpiresAt?: Date | null;
    githubId?: string | null;
    githubUsername?: string | null;
    githubProfileUrl?: string | null;
    githubAvatarUrl?: string | null;
}

const userSchema: Schema<UserSchema> = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            select: false,
        },

        provider: {
            type: String,
            default: "local",
        },

        providerID: {
            type: String,
            default: null,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isOnboarded: {
            type: Boolean,
            default: false,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isPremium: {
            type: Boolean,
            default: false,
        },

        planTier: {
            type: String,
            enum: ["free", "trial", "paid"],
            default: "free",
        },

        hasUsedTrial: {
            type: Boolean,
            default: false,
        },

        trialEndsAt: {
            type: Date,
            default: null,
        },

        premiumExpiresAt: {
            type: Date,
            default: null,
        },

        githubId: {
            type: String,
            default: null,
            sparse: true,
        },

        githubUsername: {
            type: String,
            default: null,
            trim: true,
        },

        githubProfileUrl: {
            type: String,
            default: null,
        },

        githubAvatarUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const userModel: Model<UserSchema> = mongoose.model<UserSchema>(
    "User",
    userSchema
);

export default userModel;