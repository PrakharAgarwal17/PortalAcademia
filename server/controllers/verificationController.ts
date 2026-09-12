import type { Request, Response } from "express";
import profileModel from "../models/profileModel.js";

/**
 * @description Fetch all pending unverified credentials for students of the institution
 * @route GET /api/verification/pending
 * @access Authenticated (Institution)
 */
export async function getPendingVerifications(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const institutionProfile = await profileModel.findOne({ userId: req.userId });
        const instName = institutionProfile?.institutionName || institutionProfile?.name;

        // Query students: if institution has a known name, filter by it, otherwise show all unverified student credentials
        const studentFilter: any = { accountType: "student" };
        if (instName) {
            const escapedName = instName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            studentFilter.$or = [
                { institution: { $regex: new RegExp(escapedName, "i") } },
                { institutionName: { $regex: new RegExp(escapedName, "i") } },
            ];
        }

        const students = await profileModel.find(studentFilter);
        const pendingQueue: Array<{
            studentId: string;
            studentName: string;
            studentEmail: string;
            institution: string;
            credentialId: string;
            type: "certification" | "experience";
            title: string;
            issuer?: string;
            credentialUrl?: string;
            upload?: string;
            isVerified: boolean;
        }> = [];

        for (const student of students) {
            // Check certifications
            if (student.certifications && Array.isArray(student.certifications)) {
                for (const cert of student.certifications) {
                    if (!cert.isVerified) {
                        pendingQueue.push({
                            studentId: student.userId.toString(),
                            studentName: student.name,
                            studentEmail: student.institutionEmail || "student@portalacademia.ac.in",
                            institution: student.institution || "Institute",
                            credentialId: (cert as any)._id?.toString() || "",
                            type: "certification",
                            title: cert.title,
                            issuer: cert.issuer || "",
                            credentialUrl: cert.credentialUrl || "",
                            upload: cert.upload || "",
                            isVerified: false,
                        });
                    }
                }
            }

            // Check past experiences / projects
            if (student.pastExperience && Array.isArray(student.pastExperience)) {
                for (const exp of student.pastExperience) {
                    if (!exp.isVerified) {
                        pendingQueue.push({
                            studentId: student.userId.toString(),
                            studentName: student.name,
                            studentEmail: student.institutionEmail || "student@portalacademia.ac.in",
                            institution: student.institution || "Institute",
                            credentialId: (exp as any)._id?.toString() || "",
                            type: "experience",
                            title: exp.title,
                            issuer: exp.organization || "",
                            upload: exp.uploadImage || "",
                            isVerified: false,
                        });
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            count: pendingQueue.length,
            data: pendingQueue,
        });
    } catch (error) {
        console.error("getPendingVerifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending verification queue",
        });
    }
}

/**
 * @description Verify or reject a student's uploaded credential / certification
 * @route PUT /api/profile/verify-credential/:studentId/:credentialId
 * @route PUT /api/verification/verify/:studentId/:credentialId
 * @access Authenticated (Institution)
 */
export async function verifyCredential(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { studentId, credentialId } = req.params;
        const { isVerified = true, verificationNotes = "" } = req.body;

        // Find student profile by userId or _id
        const student = await profileModel.findOne({
            $or: [{ userId: studentId as any }, { _id: studentId as any }],
        } as any);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }

        let updatedItem: any = null;
        let itemType = "";

        // Check certifications
        if (student.certifications && Array.isArray(student.certifications)) {
            const cert = (student.certifications as any).id(credentialId);
            if (cert) {
                cert.isVerified = Boolean(isVerified);
                cert.verifiedBy = req.userId as any;
                cert.verifiedAt = new Date();
                cert.verificationNotes = verificationNotes;
                updatedItem = cert;
                itemType = "certification";
            }
        }

        // Check past experiences if not found in certifications
        if (!updatedItem && student.pastExperience && Array.isArray(student.pastExperience)) {
            const exp = (student.pastExperience as any).id(credentialId);
            if (exp) {
                exp.isVerified = Boolean(isVerified);
                exp.verifiedBy = req.userId as any;
                exp.verifiedAt = new Date();
                updatedItem = exp;
                itemType = "experience";
            }
        }

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: "Credential ID not found in student's portfolio",
            });
        }

        await student.save();

        return res.status(200).json({
            success: true,
            message: `Credential ${Boolean(isVerified) ? "verified" : "unverified"} successfully`,
            data: {
                studentId: student.userId,
                studentName: student.name,
                credentialId,
                itemType,
                isVerified: Boolean(isVerified),
                verifiedAt: updatedItem.verifiedAt,
                verificationNotes,
            },
        });
    } catch (error) {
        console.error("verifyCredential error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify credential",
        });
    }
}
