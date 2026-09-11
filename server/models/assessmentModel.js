import mongoose, { Schema } from "mongoose";
const assessmentQuestionSchema = new Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
    weight: { type: Number, default: 1 },
}, { _id: false });
const assessmentSchema = new Schema({
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
}, {
    timestamps: true,
});
const assessmentModel = mongoose.model("Assessment", assessmentSchema);
export default assessmentModel;
//# sourceMappingURL=assessmentModel.js.map