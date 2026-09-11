import mongoose, { Schema } from "mongoose";
const aiLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
    },
    userRole: {
        type: String,
        default: "anonymous",
    },
    query: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    tokensUsed: {
        type: Number,
        default: 0,
    },
    modelUsed: {
        type: String,
        default: "grok-2-1212",
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Native MongoDB TTL index: automatically deletes documents older than 7 days
        expires: 60 * 60 * 24 * 7,
    },
});
/**
 * Ensures MongoDB Free-tier storage (512MB) is never saturated.
 * If total document count exceeds maxAllowed (default 500), prunes the oldest logs.
 */
aiLogSchema.statics.pruneIfThresholdExceeded = async function (maxAllowed = 500) {
    try {
        const count = await this.countDocuments();
        if (count > maxAllowed) {
            const deleteCount = count - maxAllowed;
            const oldestDocs = await this.find({})
                .sort({ createdAt: 1 })
                .limit(deleteCount)
                .select("_id");
            const idsToDelete = oldestDocs.map((d) => d._id);
            const result = await this.deleteMany({ _id: { $in: idsToDelete } });
            return result.deletedCount || 0;
        }
        return 0;
    }
    catch (err) {
        console.error("AI Log threshold pruning error:", err);
        return 0;
    }
};
const aiLogModel = mongoose.model("AiLog", aiLogSchema);
export default aiLogModel;
//# sourceMappingURL=aiLogModel.js.map