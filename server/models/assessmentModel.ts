import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISoftSkillWeights {
    communication: number;   // 0 - 5
    teamwork: number;        // 0 - 5
    problemSolving: number;  // 0 - 5
    leadership: number;      // 0 - 5
}

export interface IAssessmentQuestion {
    questionId: string;
    questionText: string;
    type?: "mcq" | "writing" | "speaking";
    difficultyLevel?: "easy" | "medium" | "writing" | "speaking";
    concept?: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    weight: number;
    // Multi-dimensional weights for each option (for soft skills scenarios)
    optionDimensionWeights?: ISoftSkillWeights[];
    // Open-ended speaking response specifications (60-90s)
    speakingDurationSeconds?: number;
    evaluationRubric?: string[];
}

export interface IAssessment extends Document {
    title: string;
    description: string;
    category: "Technical" | "Aptitude" | "Domain" | "SoftSkills";
    assessmentType: "technical" | "soft_skills";
    skillVectors: string[]; // e.g. ["Python"] or ["Communication", "Conflict Resolution"]
    durationMinutes: number;
    passPercentage: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    questions: IAssessmentQuestion[];
    badgeAwarded: string; // e.g. "Certified Python Practitioner" or "Certified Workplace Leadership Practitioner"
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
    {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        type: { type: String, enum: ["mcq", "writing", "speaking"], default: "mcq" },
        difficultyLevel: { type: String, enum: ["easy", "medium", "writing", "speaking"], default: "easy" },
        concept: { type: String, default: "" },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true, default: 0 },
        explanation: { type: String, default: "" },
        weight: { type: Number, default: 1 },
        optionDimensionWeights: [
            {
                communication: { type: Number, default: 0 },
                teamwork: { type: Number, default: 0 },
                problemSolving: { type: Number, default: 0 },
                leadership: { type: Number, default: 0 },
            },
        ],
        speakingDurationSeconds: { type: Number, default: 60 },
        evaluationRubric: [{ type: String }],
    },
    { _id: false }
);

const assessmentSchema = new Schema<IAssessment>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["Technical", "Aptitude", "Domain", "SoftSkills"],
            required: true,
            default: "Technical",
        },
        assessmentType: {
            type: String,
            enum: ["technical", "soft_skills"],
            default: "technical",
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
