import mongoose, { Schema } from "mongoose";
const applicationSchema = new Schema({
    opportunityId: {
        type: Schema.Types.ObjectId,
        ref: "Opportunity",
        required: true,
        index: true,
    },
    applicantId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantInstitution: { type: String, default: "Independent" },
    applicantSkills: [{ type: String }],
    matchScore: { type: Number, default: 0 },
    status: {
        type: String,
        enum: [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Technical Interview",
            "Offered",
            "Rejected",
        ],
        default: "Applied",
        index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    reviewerNotes: { type: String, default: "" },
}, {
    timestamps: true,
});
// Ensure a user can only apply once to a specific opportunity
applicationSchema.index({ opportunityId: 1, applicantId: 1 }, { unique: true });
const applicationModel = mongoose.model("Application", applicationSchema);
export default applicationModel;
//# sourceMappingURL=applicationModel.js.map