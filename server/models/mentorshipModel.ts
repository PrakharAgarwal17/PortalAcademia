import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MentorshipStatus =
    | "pending"
    | "active"
    | "completed"
    | "cancelled"
    | "declined";

export interface ICallSession {
    callRoomId: string;
    startedAt: Date;
    endedAt?: Date;
    durationMinutes: number;
}

export interface IMentorship extends Document {
    mentorId: mongoose.Types.ObjectId;
    menteeId: mongoose.Types.ObjectId;
    status: MentorshipStatus;
    startDate: Date;
    targetEndDate: Date;
    completedAt?: Date | null;
    notes?: string;
    topics: string[];
    callSessions: ICallSession[];
    totalCallDurationMinutes: number;
    menteeRating?: number | null;
    menteeFeedback?: string;
    ratedAt?: Date | null;
    certificateIssued: boolean;
    certificateIssuedAt?: Date | null;
    certificateId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const callSessionSchema = new Schema<ICallSession>(
    {
        callRoomId: { type: String, required: true },
        startedAt: { type: Date, required: true },
        endedAt: { type: Date },
        durationMinutes: { type: Number, default: 0 },
    },
    { _id: true }
);

const mentorshipSchema = new Schema<IMentorship>(
    {
        mentorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        menteeId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "completed", "cancelled", "declined"],
            default: "pending",
            index: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        targetEndDate: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ~30 days
        },
        completedAt: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        topics: {
            type: [String],
            default: [],
        },
        callSessions: {
            type: [callSessionSchema],
            default: [],
        },
        totalCallDurationMinutes: {
            type: Number,
            default: 0,
        },
        menteeRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        menteeFeedback: {
            type: String,
            trim: true,
            default: "",
        },
        ratedAt: {
            type: Date,
            default: null,
        },
        certificateIssued: {
            type: Boolean,
            default: false,
        },
        certificateIssuedAt: {
            type: Date,
            default: null,
        },
        certificateId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index to quickly find pairings for a user
mentorshipSchema.index({ mentorId: 1, menteeId: 1, status: 1 });

const mentorshipModel: Model<IMentorship> = mongoose.model<IMentorship>(
    "Mentorship",
    mentorshipSchema
);

export default mentorshipModel;
