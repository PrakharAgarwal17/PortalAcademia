import { v2 as cloudinary } from "cloudinary";
export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}
export declare function uploadToCloudinary(buffer: Buffer, folder?: string, resourceType?: "image" | "auto" | "raw"): Promise<CloudinaryUploadResult>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map