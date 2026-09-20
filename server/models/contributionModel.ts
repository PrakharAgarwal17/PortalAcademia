import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IContribution extends Document {
    projectId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    githubUsername: string;
    prUrl: string;
    prTitle: string;
    prNumber: number;
    mergedAt: Date;
    certificateIssued: boolean;
    certificateIssuedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const contributionSchema = new Schema<IContribution>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "OpenSourceProject",
            required: true,
            index: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        githubUsername: {
            type: String,
            required: true,
        },
        prUrl: {
            type: String,
            required: true,
        },
        prTitle: {
            type: String,
            required: true,
        },
        prNumber: {
            type: Number,
            required: true,
        },
        mergedAt: {
            type: Date,
            required: true,
        },
        certificateIssued: {
            type: Boolean,
            default: false,
            index: true,
        },
        certificateIssuedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Prevent duplicate contribution for same PR
contributionSchema.index({ projectId: 1, prNumber: 1 }, { unique: true });

const contributionModel: Model<IContribution> =
    mongoose.model<IContribution>("Contribution", contributionSchema);

export default contributionModel;
