import { v2 as cloudinary } from "cloudinary";
function cleanEnv(val) {
    if (!val)
        return "";
    return val.replace(/^["']|["']$/g, "").trim();
}
const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);
if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
}
export async function uploadToCloudinary(buffer, folder = "portal_academia", resourceType = "auto") {
    const cName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
    const cKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
    const cSec = cleanEnv(process.env.CLOUDINARY_API_SECRET);
    // Safe fallback if Cloudinary credentials are not configured yet
    if (!cName || !cKey || !cSec) {
        console.warn("Cloudinary credentials not set, using secure fallback storage");
        const mimeType = resourceType === "image" ? "image/png" : "application/octet-stream";
        const base64Data = buffer.toString("base64");
        return {
            url: `data:${mimeType};base64,${base64Data}`,
            publicId: `mock_${Date.now()}`,
        };
    }
    // Ensure Cloudinary SDK is initialized with valid credentials
    cloudinary.config({
        cloud_name: cName,
        api_key: cKey,
        api_secret: cSec,
        secure: true,
    });
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: resourceType,
        }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (!result) {
                return reject(new Error("Cloudinary upload failed: no result"));
            }
            resolve({
                url: result.secure_url || result.url,
                publicId: result.public_id,
            });
        });
        uploadStream.end(buffer);
    });
}
export default cloudinary;
//# sourceMappingURL=cloudinary.js.map