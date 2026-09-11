import { type Document, type Model } from "mongoose";
export interface UserSchema extends Document {
    email: string;
    password: string;
    provider: string;
    providerID: string;
    isVerified: boolean;
    isOnboarded: boolean;
}
declare const userModel: Model<UserSchema>;
export default userModel;
//# sourceMappingURL=userModel.d.ts.map