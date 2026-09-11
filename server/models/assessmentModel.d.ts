import mongoose, { type Document, type Model } from "mongoose";
export interface IAssessmentQuestion {
    questionId: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    weight: number;
}
export interface IAssessment extends Document {
    title: string;
    description: string;
    category: "Technical" | "Aptitude" | "Domain";
    skillVectors: string[];
    durationMinutes: number;
    passPercentage: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    questions: IAssessmentQuestion[];
    badgeAwarded: string;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const assessmentModel: Model<IAssessment>;
export default assessmentModel;
//# sourceMappingURL=assessmentModel.d.ts.map