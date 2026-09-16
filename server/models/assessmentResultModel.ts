import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAssessmentAnswer {
    questionId: string;
    selectedOptionIndex: number;
    writtenAnswer?: string;
    timeTakenSeconds?: number;
    isFlaggedAI?: boolean;
    isCorrect: boolean;
}

export interface IDimensionalScore {
    rawScore: number;
    maxPossible: number;
    normalizedScore: number; // 0 - 100%
    verdict: string;         // "Exemplary" | "Proficient" | "Competent" | "Developing"
}

export interface ISoftSkillsReport {
    communication: IDimensionalScore;
    teamwork: IDimensionalScore;
    problemSolving: IDimensionalScore;
    leadership: IDimensionalScore;
    overallIndex: number; // 0 - 100%
    archetype: string;
    keyStrengths: string[];
    growthAreas: string[];
}

export interface IAssessmentResult extends Document {
    studentId: mongoose.Types.ObjectId;
    assessmentId: mongoose.Types.ObjectId;
    assessmentTitle: string;
    assessmentType: "technical" | "soft_skills";
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    badgeAwarded?: string;
    verifiedSkillsAdded: string[];
    relatedSkills: string[];
    answers: IAssessmentAnswer[];
    softSkillsReport?: ISoftSkillsReport;
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
        assessmentType: {
            type: String,
            enum: ["technical", "soft_skills"],
            default: "technical",
        },
        score: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        percentage: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        badgeAwarded: { type: String, default: null },
        verifiedSkillsAdded: [{ type: String }],
        relatedSkills: [{ type: String, default: [] }],
        answers: [assessmentAnswerSchema],
        softSkillsReport: {
            communication: {
                rawScore: { type: Number, default: 0 },
                maxPossible: { type: Number, default: 0 },
                normalizedScore: { type: Number, default: 0 },
                verdict: { type: String, default: "" },
            },
            teamwork: {
                rawScore: { type: Number, default: 0 },
                maxPossible: { type: Number, default: 0 },
                normalizedScore: { type: Number, default: 0 },
                verdict: { type: String, default: "" },
            },
            problemSolving: {
                rawScore: { type: Number, default: 0 },
                maxPossible: { type: Number, default: 0 },
                normalizedScore: { type: Number, default: 0 },
                verdict: { type: String, default: "" },
            },
            leadership: {
                rawScore: { type: Number, default: 0 },
                maxPossible: { type: Number, default: 0 },
                normalizedScore: { type: Number, default: 0 },
                verdict: { type: String, default: "" },
            },
            overallIndex: { type: Number, default: 0 },
            archetype: { type: String, default: "" },
            keyStrengths: [{ type: String }],
            growthAreas: [{ type: String }],
        },
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
