import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
    },
    provider: {
        type: String,
        default: "local",
    },
    providerID: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isOnboarded: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
const userModel = mongoose.model("User", userSchema);
export default userModel;
//# sourceMappingURL=userModel.js.map