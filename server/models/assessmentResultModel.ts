import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAssessmentAnswer {
    questionId: string;
    selectedOptionIndex: number;
    writtenAnswer?: string;
    timeTakenSeconds?: number;
    isFlaggedAI?: boolean;
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

const assessmentAnswerSchema = new Schema<IAssessmentAnswer>(
    {
        questionId: { type: String, required: true },
        selectedOptionIndex: { type: Number, default: -1 },
        writtenAnswer: { type: String, default: "" },
        timeTakenSeconds: { type: Number, default: 0 },
        isFlaggedAI: { type: Boolean, default: false },
        isCorrect: { type: Boolean, required: true },
    },
    { _id: false }
);

const assessmentResultSchema = new Schema<IAssessmentResult>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        assessmentId: {
            type: Schema.Types.ObjectId,
            ref: "Assessment",
            required: true,
        },
        assessmentTitle: { type: String, required: true },
        score: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        percentage: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        badgeAwarded: { type: String, default: null },
        verifiedSkillsAdded: [{ type: String }],
        answers: [assessmentAnswerSchema],
        completedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

const assessmentResultModel: Model<IAssessmentResult> = mongoose.model<IAssessmentResult>(
    "AssessmentResult",
    assessmentResultSchema
);

export default assessmentResultModel;
