import mongoose, { Schema } from "mongoose";
const assessmentAnswerSchema = new Schema({
    questionId: { type: String, required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
}, { _id: false });
const assessmentResultSchema = new Schema({
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
}, {
    timestamps: true,
});
const assessmentResultModel = mongoose.model("AssessmentResult", assessmentResultSchema);
export default assessmentResultModel;
//# sourceMappingURL=assessmentResultModel.js.map