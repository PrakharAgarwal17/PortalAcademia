import mongoose, { Schema, type Document } from "mongoose";

export type AccountType =
    | "student"
    | "faculty"
    | "institution"
    | "industry";

export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    accountType: AccountType;

    name: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;

    // Student
    education?: {
        degree?: string;
        branch?: string;
        graduationYear?: number;
    };

    skills?: string[];
    interests?: string[];

    // Faculty
    designation?: string;
    department?: string;
    expertise?: string[];
    researchInterests?: string[];

    // Institution / Industry
    organizationName?: string;
    organizationType?: string;

    // Professional links
    linkedin?: string;
    github?: string;

    createdAt: Date;
    updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
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

        image: {
            type: String,
        },

        bio: {
            type: String,
            trim: true,
        },

        location: {
            type: String,
            trim: true,
        },

        website: {
            type: String,
            trim: true,
        },

        education: {
            degree: String,
            branch: String,
            graduationYear: Number,
        },

        skills: {
            type: [String],
            default: [],
        },

        interests: {
            type: [String],
            default: [],
        },

        designation: {
            type: String,
            trim: true,
        },

        department: {
            type: String,
            trim: true,
        },

        expertise: {
            type: [String],
            default: [],
        },

        researchInterests: {
            type: [String],
            default: [],
        },

        organizationName: {
            type: String,
            trim: true,
        },

        organizationType: {
            type: String,
            trim: true,
        },

        linkedin: {
            type: String,
            trim: true,
        },

        github: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const profileModel = mongoose.model<IProfile>("Profile", profileSchema);

export default profileModel;