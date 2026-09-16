import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface UserSchema extends Document {
    email: string;
    password: string;
    provider: string;
    providerID: string;
    isVerified: boolean;
    isOnboarded: boolean;
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