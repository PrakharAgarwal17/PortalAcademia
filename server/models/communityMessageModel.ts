import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICommunityMessage extends Document {
    spaceId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    senderAvatar?: string;
    senderRole: string;
    content: string;
    attachments?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const communityMessageSchema = new Schema<ICommunityMessage>(
    {
        spaceId: {
            type: Schema.Types.ObjectId,
            ref: "CommunitySpace",
            required: true,
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        senderName: {
            type: String,
            required: true,
            trim: true,
        },
        senderAvatar: {
            type: String,
            default: "",
        },
        senderRole: {
            type: String,
            default: "student",
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        attachments: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

// Index to retrieve chat history in chronological order
communityMessageSchema.index({ spaceId: 1, createdAt: 1 });

const communityMessageModel: Model<ICommunityMessage> = mongoose.model<ICommunityMessage>(
    "CommunityMessage",
    communityMessageSchema
);

export default communityMessageModel;
