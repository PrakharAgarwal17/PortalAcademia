import mongoose, { Schema, type Document, type Model } from "mongoose";

export type OpportunityCategory =
    | "internship"
    | "hackathon"
    | "workshop"
    | "fdp"
    | "research"
    | "sabbatical";

export type OpportunityMode = "Remote" | "Hybrid" | "On-site";

export interface IOpportunity extends Document {
    title: string;
    description: string;
    organization: string;
    createdBy: mongoose.Types.ObjectId;
    category: OpportunityCategory;
    domain: string;
    location: string;
    mode: OpportunityMode;
    duration: string;
    stipendOrPrize: string;
    requiredSkills: string[];
    eligibility: string;
    deadline: string;
    status: "active" | "closed";
    targetAudience: "student" | "faculty" | "both";
    recommendedByColleges: string[];
    recommendedToStudentsBy: mongoose.Types.ObjectId[];
    recommendedToFacultyBy: mongoose.Types.ObjectId[];
    jobEmbedding: number[]; // 384d semantic vector (bge-small-en-v1.5)
    applicantCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const opportunitySchema = new Schema<IOpportunity>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        organization: { type: String, required: true, trim: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ["internship", "hackathon", "workshop", "fdp", "research", "sabbatical"],
            required: true,
            index: true,
        },
        domain: { type: String, required: true },
        location: { type: String, required: true },
        mode: {
            type: String,
            enum: ["Remote", "Hybrid", "On-site"],
            default: "Remote",
        },
        duration: { type: String, required: true },
        stipendOrPrize: { type: String, required: true },
        requiredSkills: [{ type: String, required: true }],
        eligibility: { type: String, default: "All qualified candidates eligible." },
        deadline: { type: String, required: true },
        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
            index: true,
        },
        targetAudience: {
            type: String,
            enum: ["student", "faculty", "both"],
            default: "both",
            index: true,
        },
        recommendedByColleges: [{ type: String, trim: true }],
        recommendedToStudentsBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        recommendedToFacultyBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        jobEmbedding: { type: [Number], select: false, default: [] },
        applicantCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

const opportunityModel: Model<IOpportunity> = mongoose.model<IOpportunity>(
    "Opportunity",
    opportunitySchema
);

export default opportunityModel;
