import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAssessmentQuestion {
    questionId: string;
    questionText: string;
    type?: "mcq" | "writing";
    difficultyLevel?: "easy" | "medium" | "writing";
    concept?: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    weight: number;
}

export interface IAssessment extends Document {
    title: string;
    description: string;
    category: "Technical" | "Aptitude" | "Domain";
    skillVectors: string[]; // e.g. ["Python", "Data Engineering"]
    durationMinutes: number;
    passPercentage: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    questions: IAssessmentQuestion[];
    badgeAwarded: string; // e.g. "Certified Python Practitioner"
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
    {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        type: { type: String, enum: ["mcq", "writing"], default: "mcq" },
        difficultyLevel: { type: String, enum: ["easy", "medium", "writing"], default: "easy" },
        concept: { type: String, default: "" },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true, default: 0 },
        explanation: { type: String, default: "" },
        weight: { type: Number, default: 1 },
    },
    { _id: false }
);

const assessmentSchema = new Schema<IAssessment>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["Technical", "Aptitude", "Domain"],
            required: true,
            default: "Technical",
        },
        skillVectors: [{ type: String, required: true }],
        durationMinutes: { type: Number, required: true, default: 15 },
        passPercentage: { type: Number, required: true, default: 70 },
        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Intermediate",
        },
        questions: [assessmentQuestionSchema],
        badgeAwarded: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    {
        timestamps: true,
    }
);

const assessmentModel: Model<IAssessment> = mongoose.model<IAssessment>(
    "Assessment",
    assessmentSchema
);

export default assessmentModel;
