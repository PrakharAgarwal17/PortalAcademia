import multer from "multer";
// Configure in-memory storage so uploaded files can be piped directly to Cloudinary
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
export default upload;
//# sourceMappingURL=multer.js.map