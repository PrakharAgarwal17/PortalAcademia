import express, { type Request, type Response } from "express";
import upload from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import isloggedIn from "../middleware/isloggedIn.js";

const router = express.Router();

/**
 * POST /api/upload/single
 * Uploads a single file to Cloudinary and returns its secure URL string
 */
router.post(
    "/single",
    isloggedIn,
    upload.single("file"),
    async (req: Request, res: Response): Promise<Response> => {
        try {
            const file = (req as any).file as Express.Multer.File | undefined;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const folder = (req.body.folder as string) || "portal_academia/uploads";
            const isImage = file.mimetype.startsWith("image/");
            const resourceType = isImage ? "image" : "auto";

            const result = await uploadToCloudinary(
                file.buffer,
                folder,
                resourceType
            );

            return res.status(200).json({
                success: true,
                message: "File uploaded successfully",
                url: result.url,
                publicId: result.publicId,
            });
        } catch (error: any) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload file",
            });
        }
    }
);

export default router;
