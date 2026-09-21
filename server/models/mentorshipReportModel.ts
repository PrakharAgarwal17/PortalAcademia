import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ReportStatus = "pending" | "investigating" | "action_taken" | "dismissed";

export interface IMentorshipReport extends Document {
    pairingId: mongoose.Types.ObjectId;
    reporterId: mongoose.Types.ObjectId;
    reportedUserId: mongoose.Types.ObjectId;
    reason: string;
    details: string;
    status: ReportStatus;
    actionNotes?: string;
    actionTakenBy?: mongoose.Types.ObjectId | null;
    actionTakenAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const mentorshipReportSchema = new Schema<IMentorshipReport>(
    {
        pairingId: {
            type: Schema.Types.ObjectId,
            ref: "Mentorship",
            required: true,
            index: true,
        },
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reportedUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        details: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "investigating", "action_taken", "dismissed"],
            default: "pending",
            index: true,
        },
        actionNotes: {
            type: String,
            default: "",
            trim: true,
        },
        actionTakenBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        actionTakenAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const mentorshipReportModel: Model<IMentorshipReport> = mongoose.model<IMentorshipReport>(
    "MentorshipReport",
    mentorshipReportSchema
);

export default mentorshipReportModel;
