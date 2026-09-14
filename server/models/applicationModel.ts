import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ApplicationStatus =
    | "Applied"
    | "Under Review"
    | "Shortlisted"
    | "Technical Interview"
    | "Offered"
    | "Rejected";

export interface IApplication extends Document {
    opportunityId: mongoose.Types.ObjectId;
    applicantId: mongoose.Types.ObjectId;
    applicantName: string;
    applicantEmail: string;
    applicantInstitution: string;
    applicantSkills: string[];
    matchScore: number; // 0-100 derived from skill overlap and verified assessment scores
    atsScore: number;   // 0-100 ATS compliance score
    candidateEmbedding: number[]; // 384d semantic vector (bge-small-en-v1.5)
    semanticScore: number; // 0-100 semantic match against job embedding
    resumeUrl?: string; // Cloudinary or generated PDF link
    resumeData?: Record<string, any>; // Custom resume fields
    status: ApplicationStatus;
    appliedAt: Date;
    notes?: string;
    reviewerNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
    {
        opportunityId: {
            type: Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true,
            index: true,
        },
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        applicantName: { type: String, required: true },
        applicantEmail: { type: String, required: true },
        applicantInstitution: { type: String, default: "Independent" },
        applicantSkills: [{ type: String }],
        matchScore: { type: Number, default: 0 },
        atsScore: { type: Number, default: 0 },
        candidateEmbedding: { type: [Number], select: false, default: [] },
        semanticScore: { type: Number, default: 0 },
        resumeUrl: { type: String, default: "" },
        resumeData: { type: Schema.Types.Mixed, default: null },
        status: {
            type: String,
            enum: [
                "Applied",
                "Under Review",
                "Shortlisted",
                "Technical Interview",
                "Offered",
                "Rejected",
            ],
            default: "Applied",
            index: true,
        },
        appliedAt: { type: Date, default: Date.now },
        notes: { type: String, default: "" },
        reviewerNotes: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);

// Ensure a user can only apply once to a specific opportunity
applicationSchema.index({ opportunityId: 1, applicantId: 1 }, { unique: true });

const applicationModel: Model<IApplication> = mongoose.model<IApplication>(
    "Application",
    applicationSchema
);

export default applicationModel;
