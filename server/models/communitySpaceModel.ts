import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICommunitySpace extends Document {
    name: string;
    description: string;
    industry: string;
    focus: string;
    avatarUrl?: string;
    creatorId: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    memberCount: number;
    isPublic: boolean;
    allowedRoles: string[];
    createdAt: Date;
    updatedAt: Date;
}

const communitySpaceSchema = new Schema<ICommunitySpace>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        industry: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        focus: {
            type: String,
            default: "",
            trim: true,
        },
        avatarUrl: {
            type: String,
            default: "",
        },
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        memberCount: {
            type: Number,
            default: 0,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        allowedRoles: {
            type: [String],
            default: ["student", "faculty", "industry", "institution"],
        },
    },
    { timestamps: true }
);

communitySpaceSchema.pre("save", function () {
    if (this.members) {
        this.memberCount = this.members.length;
    }
});

const communitySpaceModel: Model<ICommunitySpace> = mongoose.model<ICommunitySpace>(
    "CommunitySpace",
    communitySpaceSchema
);

export default communitySpaceModel;
