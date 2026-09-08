import mongoose, { Schema, type Document } from "mongoose";

export type CategoryType = "individual" | "organization";

export type AccountType =
    | "student"
    | "faculty"
    | "institution"
    | "industry";

export interface IEducation {
    education: string;
    course?: string;
    description?: string;
    timeline?: string;
}

export interface ICertification {
    title: string;
    description?: string;
    upload?: string; // Cloudinary URL
}

export interface IPastExperience {
    title: string;
    timeline?: string;
    description?: string;
    uploadImage?: string; // Cloudinary URL
}

export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    category?: CategoryType;
    accountType: AccountType;

    name: string;
    profileImage?: string;
    image?: string; // backward compatibility
    bio?: string;
    location?: string;
    website?: string;

    // Individual (Student & Faculty) fields
    institution?: string;
    institutionEmail?: string;
    isEmailVerified?: boolean;

    // Individual optional sections
    education?: IEducation[];
    certifications?: ICertification[];
    pastExperience?: IPastExperience[];
    skills?: string[];

    // Faculty specific
    designation?: string;
    department?: string;
    expertise?: string[];
    researchInterests?: string[];

    // Organization: Institution specific
    institutionName?: string;
    aisheCode?: string;
    officialEmail?: string;
    contact?: string;

    // Organization: Industry specific
    companyName?: string;
    industryType?: string;
    officialWebsite?: string;
    workEmail?: string;
    employees?: string;

    // Professional links
    linkedin?: string;
    github?: string;

    createdAt: Date;
    updatedAt: Date;
}

const educationSubSchema = new Schema<IEducation>(
    {
        education: { type: String, required: true },
        course: { type: String, default: "" },
        description: { type: String, default: "" },
        timeline: { type: String, default: "" },
    },
    { _id: false }
);

const certificationSubSchema = new Schema<ICertification>(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        upload: { type: String, default: "" },
    },
    { _id: false }
);

const pastExperienceSubSchema = new Schema<IPastExperience>(
    {
        title: { type: String, required: true },
        timeline: { type: String, default: "" },
        description: { type: String, default: "" },
        uploadImage: { type: String, default: "" },
    },
    { _id: false }
);

const profileSchema = new Schema<IProfile>(
    {
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

        profileImage: {
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
    },
    {
        timestamps: true,
    }
);

const profileModel = mongoose.model<IProfile>("Profile", profileSchema);

export default profileModel;