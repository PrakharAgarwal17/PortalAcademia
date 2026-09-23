import type { Request, Response } from "express";
import mongoose from "mongoose";
import profileModel, { type IProfile } from "../models/profileModel.js";
import userModel from "../models/userModel.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { VerifiedEmailCache } from "./onboardingController.js";
import { resolveAlumniStatus } from "../utils/alumniResolver.js";

/**
 * POST /api/profile/avatar
 * Uploads profile picture using Multer & Cloudinary, updates DB, returns Cloudinary URL
 */
export async function uploadAvatar(req: Request, res: Response): Promise<Response> {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const file = (req as any).file as Express.Multer.File | undefined;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No profile image file uploaded",
            });
        }

        // Upload buffer to Cloudinary
        const result = await uploadToCloudinary(
            file.buffer,
            "portal_academia/avatars",
            "image"
        );

        const profileImage = result.url;

        // Persist Cloudinary URL to MongoDB Profile
        const profile = await profileModel.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $set: { profileImage, image: profileImage } },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully to Cloudinary",
            profileImage,
            profile,
        });
    } catch (error: any) {
        console.error("Upload avatar error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload profile image",
        });
    }
}

/**
 * GET /api/profile/me
 * Retrieves the profile of the currently authenticated user
 */
export async function getMyProfile(req: Request, res: Response): Promise<Response> {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const profile = await profileModel.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found for this user",
            });
        }

        const alumniInfo = resolveAlumniStatus(profile);
        const profileObj = profile.toObject ? profile.toObject() : profile;
        if (!profileObj.academicYear) {
            profileObj.academicYear = alumniInfo.academicYear;
        }

        return res.status(200).json({
            success: true,
            profile: profileObj,
        });
    } catch (error: any) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            message: "Failed to retrieve profile",
            error: error.message,
        });
    }
}

/**
 * POST /api/profile & PUT /api/profile
 * Creates or updates the user profile dynamically and marks isOnboarded: true.
 * Designed so that all sections (skills, education, certifications, experiences)
 * can be updated seamlessly anytime in the future!
 */
export async function createOrUpdateProfile(req: Request, res: Response): Promise<Response> {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const {
            category,
            accountType,
            name,
            headline,
            profileImage,
            image,
            bannerImage,
            bio,
            location,
            website,

            // Individual fields
            institution,
            institutionEmail,
            isEmailVerified,
            education,
            certifications,
            pastExperience,
            skills,

            // Faculty fields
            designation,
            department,
            expertise,
            researchInterests,

            // Organization: Institution
            institutionName,
            aisheCode,
            officialEmail,
            contact,

            // Organization: Industry
            companyName,
            industryType,
            officialWebsite,
            workEmail,
            employees,

            // Social links
            linkedin,
            github,
        } = req.body;

        // Retrieve existing profile first to verify state and protect immutable fields
        const existingProfile = await profileModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });

        // Build clean update object, only updating fields that are provided
        const updateData: Partial<IProfile> = {};

        if (category !== undefined) updateData.category = category;
        // Role cannot be overwritten if profile already exists with an accountType
        if (accountType !== undefined) {
            if (!existingProfile || !existingProfile.accountType) {
                updateData.accountType = accountType;
            }
        }
        if (name !== undefined) updateData.name = name;
        if (headline !== undefined) updateData.headline = headline;

        // Handle profile image
        const resolvedImage = profileImage || image;
        if (resolvedImage !== undefined) {
            updateData.profileImage = resolvedImage;
            updateData.image = resolvedImage;
        }

        if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;

        // Calculate authenticated college email verification state:
        // A user's institutional email is ONLY marked verified if:
        // 1) The user just completed OTP verification for this exact email (in VerifiedEmailCache), OR
        // 2) The profile was already verified for this exact same institutional email.
        const targetEmail = (institutionEmail !== undefined ? institutionEmail : existingProfile?.institutionEmail || "").trim().toLowerCase();

        let verifiedStatus = false;
        if (targetEmail) {
            const verifiedCacheEntry = VerifiedEmailCache.get(String(userId));
            const wasJustVerifiedByOtp = Boolean(verifiedCacheEntry && verifiedCacheEntry.email.toLowerCase() === targetEmail);
            const wasPreviouslyVerified = Boolean(existingProfile?.isEmailVerified && existingProfile?.institutionEmail?.toLowerCase() === targetEmail);

            if (wasJustVerifiedByOtp || wasPreviouslyVerified) {
                verifiedStatus = true;
            }
        }

        // Individual fields
        if (institution !== undefined) updateData.institution = institution;
        if (institutionEmail !== undefined) updateData.institutionEmail = institutionEmail.trim();
        updateData.isEmailVerified = verifiedStatus;
        if (education !== undefined && Array.isArray(education)) updateData.education = education;

        // Clean certifications: prevent client from injecting isVerified: true or fake verifiers
        if (certifications !== undefined && Array.isArray(certifications)) {
            const existingCerts = existingProfile?.certifications || [];
            updateData.certifications = certifications.map((c: any) => {
                const existing = c._id ? (existingCerts as any).id(c._id) : null;
                const isContentUnchanged = existing &&
                    existing.isVerified &&
                    existing.title === c.title &&
                    existing.issuer === c.issuer &&
                    existing.credentialUrl === c.credentialUrl &&
                    existing.upload === c.upload;

                return {
                    title: c.title,
                    issuer: c.issuer,
                    credentialUrl: c.credentialUrl,
                    upload: c.upload,
                    isVerified: Boolean(isContentUnchanged),
                    verifiedBy: isContentUnchanged ? existing.verifiedBy : undefined,
                    verifiedAt: isContentUnchanged ? existing.verifiedAt : undefined,
                    verificationNotes: isContentUnchanged ? existing.verificationNotes : undefined,
                };
            }) as any;
        }

        // Clean pastExperience: prevent client from self-verifying experiences
        if (pastExperience !== undefined && Array.isArray(pastExperience)) {
            const existingExps = existingProfile?.pastExperience || [];
            updateData.pastExperience = pastExperience.map((e: any) => {
                const existing = e._id ? (existingExps as any).id(e._id) : null;
                const isContentUnchanged = existing &&
                    existing.isVerified &&
                    existing.title === e.title &&
                    existing.organization === e.organization &&
                    existing.uploadImage === e.uploadImage;

                return {
                    title: e.title,
                    organization: e.organization,
                    uploadImage: e.uploadImage,
                    duration: e.duration,
                    description: e.description,
                    isVerified: Boolean(isContentUnchanged),
                    verifiedBy: isContentUnchanged ? existing.verifiedBy : undefined,
                    verifiedAt: isContentUnchanged ? existing.verifiedAt : undefined,
                };
            }) as any;
        }

        if (skills !== undefined && Array.isArray(skills)) updateData.skills = skills;

        // Faculty
        if (designation !== undefined) updateData.designation = designation;
        if (department !== undefined) updateData.department = department;
        if (expertise !== undefined && Array.isArray(expertise)) updateData.expertise = expertise;
        if (researchInterests !== undefined && Array.isArray(researchInterests)) updateData.researchInterests = researchInterests;

        // Organization - Institution
        if (institutionName !== undefined) updateData.institutionName = institutionName;
        if (aisheCode !== undefined) updateData.aisheCode = aisheCode;
        if (officialEmail !== undefined) updateData.officialEmail = officialEmail;
        if (contact !== undefined) updateData.contact = contact;

        // Organization - Industry
        if (companyName !== undefined) updateData.companyName = companyName;
        if (industryType !== undefined) updateData.industryType = industryType;
        if (officialWebsite !== undefined) updateData.officialWebsite = officialWebsite;
        if (workEmail !== undefined) updateData.workEmail = workEmail;
        if (employees !== undefined) updateData.employees = employees;

        // Socials
        if (linkedin !== undefined) updateData.linkedin = linkedin;
        if (github !== undefined) updateData.github = github;

        // Upsert Profile document in database
        const profile = await profileModel.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        // Mark user as onboarded and sync isEmailVerified in User collection
        await userModel.findByIdAndUpdate(userId, {
            isOnboarded: true,
            isEmailVerified: verifiedStatus,
        });

        return res.status(200).json({
            success: true,
            message: "Profile saved successfully",
            profile,
        });
    } catch (error: any) {
        console.error("Save profile error:", error);
        return res.status(500).json({
            message: error.message || "Failed to save profile",
        });
    }
}

/**
 * GET /api/profile/:id
 * Retrieves public profile by user ID or profile ID
 */
export async function getProfileById(req: Request, res: Response): Promise<Response> {
    try {
        const id = req.params.id as string | undefined;

        if (id === "me") {
            return getMyProfile(req, res);
        }

        let profile = null;
        if (id && mongoose.Types.ObjectId.isValid(id)) {
            const objectId = new mongoose.Types.ObjectId(id);
            profile = await profileModel.findOne({
                $or: [{ _id: objectId }, { userId: objectId }],
            } as any);
        }

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Mask PII / sensitive contact fields if viewer is not the profile owner
        const isOwner = req.userId && profile.userId && profile.userId.toString() === req.userId;
        const profileObj: any = profile.toObject ? profile.toObject() : { ...profile };

        if (!isOwner) {
            delete profileObj.contact;
            delete profileObj.officialEmail;
            if (profileObj.institutionEmail) {
                const parts = profileObj.institutionEmail.split("@");
                profileObj.institutionEmail = `${parts[0].slice(0, 2)}***@${parts[1] || ""}`;
            }
            if (profileObj.workEmail) {
                const parts = profileObj.workEmail.split("@");
                profileObj.workEmail = `${parts[0].slice(0, 2)}***@${parts[1] || ""}`;
            }
        }

        return res.status(200).json({
            success: true,
            profile: profileObj,
        });
    } catch (error: any) {
        console.error("Get profile by id error:", error);
        return res.status(500).json({
            message: "Failed to retrieve profile",
        });
    }
}
