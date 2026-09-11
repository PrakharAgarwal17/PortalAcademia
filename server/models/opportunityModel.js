import mongoose, { Schema } from "mongoose";
const opportunitySchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    organization: { type: String, required: true, trim: true },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: ["internship", "hackathon", "workshop", "fdp", "research", "sabbatical"],
        required: true,
        index: true,
    },
    domain: { type: String, required: true },
    location: { type: String, required: true },
    mode: {
        type: String,
        enum: ["Remote", "Hybrid", "On-site"],
        default: "Remote",
    },
    duration: { type: String, required: true },
    stipendOrPrize: { type: String, required: true },
    requiredSkills: [{ type: String, required: true }],
    eligibility: { type: String, default: "All qualified candidates eligible." },
    deadline: { type: String, required: true },
    status: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
        index: true,
    },
    recommendedToStudentsBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    recommendedToFacultyBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    applicantCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});
const opportunityModel = mongoose.model("Opportunity", opportunitySchema);
export default opportunityModel;
//# sourceMappingURL=opportunityModel.js.map