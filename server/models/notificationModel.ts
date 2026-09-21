import mongoose, { Schema, type Document, type Model } from "mongoose";

export type NotificationType =
    | "pr_merged"
    | "certificate_issued"
    | "general"
    | "mentorship_request"
    | "mentorship_accepted"
    | "mentorship_completed"
    | "mentorship_rating";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: {
        projectId?: string;
        contributionId?: string;
        prUrl?: string;
        companyName?: string;
        projectTitle?: string;
    };
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "pr_merged",
                "certificate_issued",
                "general",
                "mentorship_request",
                "mentorship_accepted",
                "mentorship_completed",
                "mentorship_rating",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

const notificationModel: Model<INotification> =
    mongoose.model<INotification>("Notification", notificationSchema);

export default notificationModel;
