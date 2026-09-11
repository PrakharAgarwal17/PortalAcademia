import mongoose, { type Document, type Model } from "mongoose";
export interface IAiLog extends Document {
    userId?: mongoose.Types.ObjectId;
    userRole: string;
    query: string;
    response: string;
    tokensUsed: number;
    modelUsed: string;
    createdAt: Date;
}
export interface IAiLogModel extends Model<IAiLog> {
    pruneIfThresholdExceeded(maxAllowed?: number): Promise<number>;
}
declare const aiLogModel: IAiLogModel;
export default aiLogModel;
//# sourceMappingURL=aiLogModel.d.ts.map