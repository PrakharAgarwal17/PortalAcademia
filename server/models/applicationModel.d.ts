import mongoose, { type Document, type Model } from "mongoose";
export type ApplicationStatus = "Applied" | "Under Review" | "Shortlisted" | "Technical Interview" | "Offered" | "Rejected";
export interface IApplication extends Document {
    opportunityId: mongoose.Types.ObjectId;
    applicantId: mongoose.Types.ObjectId;
    applicantName: string;
    applicantEmail: string;
    applicantInstitution: string;
    applicantSkills: string[];
    matchScore: number;
    status: ApplicationStatus;
    appliedAt: Date;
    notes?: string;
    reviewerNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const applicationModel: Model<IApplication>;
export default applicationModel;
//# sourceMappingURL=applicationModel.d.ts.map