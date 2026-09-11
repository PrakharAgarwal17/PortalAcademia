import mongoose, { type Document } from "mongoose";
export type CategoryType = "individual" | "organization";
export type AccountType = "student" | "faculty" | "institution" | "industry";
export interface IEducation {
    education: string;
    course?: string;
    description?: string;
    timeline?: string;
}
export interface ICertification {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    issuer?: string;
    credentialUrl?: string;
    upload?: string;
    isVerified?: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    verificationNotes?: string;
}
export interface IPastExperience {
    _id?: mongoose.Types.ObjectId;
    title: string;
    timeline?: string;
    description?: string;
    organization?: string;
    uploadImage?: string;
    isVerified?: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
}
export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    category?: CategoryType;
    accountType: AccountType;
    name: string;
    headline?: string;
    profileImage?: string;
    bannerImage?: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;
    institution?: string;
    institutionEmail?: string;
    isEmailVerified?: boolean;
    education?: IEducation[];
    certifications?: ICertification[];
    pastExperience?: IPastExperience[];
    skills?: string[];
    designation?: string;
    department?: string;
    expertise?: string[];
    researchInterests?: string[];
    institutionName?: string;
    aisheCode?: string;
    officialEmail?: string;
    contact?: string;
    companyName?: string;
    industryType?: string;
    officialWebsite?: string;
    workEmail?: string;
    employees?: string;
    linkedin?: string;
    github?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const profileModel: mongoose.Model<IProfile, {}, {}, {}, Document<unknown, {}, IProfile, {}, mongoose.DefaultSchemaOptions> & IProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProfile>;
export default profileModel;
//# sourceMappingURL=profileModel.d.ts.map