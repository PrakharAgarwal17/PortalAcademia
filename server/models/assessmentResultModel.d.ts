import mongoose, { type Document, type Model } from "mongoose";
export interface IAssessmentAnswer {
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
}
export interface IAssessmentResult extends Document {
    studentId: mongoose.Types.ObjectId;
    assessmentId: mongoose.Types.ObjectId;
    assessmentTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    badgeAwarded?: string;
    verifiedSkillsAdded: string[];
    answers: IAssessmentAnswer[];
    completedAt: Date;
}
declare const assessmentResultModel: Model<IAssessmentResult>;
export default assessmentResultModel;
//# sourceMappingURL=assessmentResultModel.d.ts.map