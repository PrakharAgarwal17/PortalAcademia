import mongoose, { type Document, type Model } from "mongoose";
export type OpportunityCategory = "internship" | "hackathon" | "workshop" | "fdp" | "research" | "sabbatical";
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
    recommendedToStudentsBy: mongoose.Types.ObjectId[];
    recommendedToFacultyBy: mongoose.Types.ObjectId[];
    applicantCount: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const opportunityModel: Model<IOpportunity>;
export default opportunityModel;
//# sourceMappingURL=opportunityModel.d.ts.map