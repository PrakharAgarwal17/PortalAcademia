import mongoose, { Schema } from "mongoose";
const educationSubSchema = new Schema({
    education: { type: String, required: true },
    course: { type: String, default: "" },
    description: { type: String, default: "" },
    timeline: { type: String, default: "" },
}, { _id: false });
const certificationSubSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    issuer: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    upload: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    verificationNotes: { type: String, default: "" },
}, { _id: true });
const pastExperienceSubSchema = new Schema({
    title: { type: String, required: true },
    timeline: { type: String, default: "" },
    description: { type: String, default: "" },
    organization: { type: String, default: "" },
    uploadImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
}, { _id: true });
const profileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    category: {
        type: String,
        enum: ["individual", "organization"],
        default: "individual",
    },
    accountType: {
        type: String,
        enum: ["student", "faculty", "institution", "industry"],
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    headline: {
        type: String,
        trim: true,
        default: "",
    },
    profileImage: {
        type: String,
        default: "",
    },
    bannerImage: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        trim: true,
        default: "",
    },
    location: {
        type: String,
        trim: true,
        default: "",
    },
    website: {
        type: String,
        trim: true,
        default: "",
    },
    // Individual fields
    institution: {
        type: String,
        trim: true,
        default: "",
    },
    institutionEmail: {
        type: String,
        trim: true,
        default: "",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    education: {
        type: [educationSubSchema],
        default: [],
    },
    certifications: {
        type: [certificationSubSchema],
        default: [],
    },
    pastExperience: {
        type: [pastExperienceSubSchema],
        default: [],
    },
    skills: {
        type: [String],
        default: [],
    },
    // Faculty
    designation: {
        type: String,
        trim: true,
        default: "",
    },
    department: {
        type: String,
        trim: true,
        default: "",
    },
    expertise: {
        type: [String],
        default: [],
    },
    researchInterests: {
        type: [String],
        default: [],
    },
    // Organization - Institution
    institutionName: {
        type: String,
        trim: true,
        default: "",
    },
    aisheCode: {
        type: String,
        trim: true,
        default: "",
    },
    officialEmail: {
        type: String,
        trim: true,
        default: "",
    },
    contact: {
        type: String,
        trim: true,
        default: "",
    },
    // Organization - Industry
    companyName: {
        type: String,
        trim: true,
        default: "",
    },
    industryType: {
        type: String,
        trim: true,
        default: "",
    },
    officialWebsite: {
        type: String,
        trim: true,
        default: "",
    },
    workEmail: {
        type: String,
        trim: true,
        default: "",
    },
    employees: {
        type: String,
        trim: true,
        default: "",
    },
    // Professional links
    linkedin: {
        type: String,
        trim: true,
        default: "",
    },
    github: {
        type: String,
        trim: true,
        default: "",
    },
}, {
    timestamps: true,
});
const profileModel = mongoose.model("Profile", profileSchema);
export default profileModel;
//# sourceMappingURL=profileModel.js.map