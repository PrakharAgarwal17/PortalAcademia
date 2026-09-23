import mongoose, { Schema, type Document, type Model } from "mongoose";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface IProjectIssue {
    issueNumber?: number;
    title: string;
    url: string;
    difficulty?: Difficulty;
    labels?: string[];
}

export interface IOpenSourceProject extends Document {
    postedBy: mongoose.Types.ObjectId;
    companyName: string;
    title: string;
    description: string;
    repoUrl: string;
    repoFullName: string; // "org/repo" — used for webhook matching
    techStack: string[];
    difficulty: Difficulty;
    openIssuesCount: number;
    issues?: IProjectIssue[];
    webhookSecret: string; // HMAC secret — never exposed to frontend
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const openSourceProjectSchema = new Schema<IOpenSourceProject>(
    {
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        repoUrl: {
            type: String,
            required: true,
            trim: true,
        },
        repoFullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        techStack: {
            type: [String],
            default: [],
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate",
        },
        openIssuesCount: {
            type: Number,
            default: 0,
        },
        issues: [
            {
                issueNumber: { type: Number },
                title: { type: String, required: true, trim: true },
                url: { type: String, required: true, trim: true },
                difficulty: {
                    type: String,
                    enum: ["beginner", "intermediate", "advanced"],
                    default: "intermediate",
                },
                labels: { type: [String], default: [] },
            },
        ],
        webhookSecret: {
            type: String,
            required: true,
            select: false, // never returned in queries by default
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

const openSourceProjectModel: Model<IOpenSourceProject> =
    mongoose.model<IOpenSourceProject>("OpenSourceProject", openSourceProjectSchema);

export default openSourceProjectModel;
