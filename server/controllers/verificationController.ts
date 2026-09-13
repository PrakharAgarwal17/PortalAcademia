import type { Request, Response } from "express";
import mongoose from "mongoose";
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

/**
 * @description Fetch enrolled students affiliated with the logged-in institution
 * @route GET /api/verification/institution-students
 * @access Authenticated (Institution)
 */
export async function getInstitutionStudents(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const institutionProfile = await profileModel.findOne({ userId: req.userId });
        const instName = institutionProfile?.institutionName || institutionProfile?.name;

        const studentFilter: any = { accountType: "student" };
        if (instName) {
            const escapedName = instName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            studentFilter.$or = [
                { institution: { $regex: new RegExp(escapedName, "i") } },
                { institutionName: { $regex: new RegExp(escapedName, "i") } },
            ];
        }

        const rawStudents = await profileModel.find(studentFilter).sort({ createdAt: -1 });

        // Helper function to extract or estimate academic year / graduation batch
        const computeAcademicYear = (educationList?: any[]): { academicYear: string; graduationBatch: string } => {
            if (!educationList || educationList.length === 0) {
                return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
            }
            const primaryEdu = educationList[0];
            const timeline = (primaryEdu?.timeline || primaryEdu?.description || "").toLowerCase();

            if (timeline.includes("1st") || timeline.includes("first") || timeline.includes("2028")) {
                return { academicYear: "1st Year", graduationBatch: "Class of 2028" };
            }
            if (timeline.includes("2nd") || timeline.includes("second") || timeline.includes("2027")) {
                return { academicYear: "2nd Year", graduationBatch: "Class of 2027" };
            }
            if (timeline.includes("4th") || timeline.includes("final") || timeline.includes("2025")) {
                return { academicYear: "4th Year", graduationBatch: "Class of 2025" };
            }
            if (timeline.includes("3rd") || timeline.includes("third") || timeline.includes("2026")) {
                return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
            }

            const matchYear = timeline.match(/20\d{2}/g);
            if (matchYear && matchYear.length > 0) {
                const endYear = parseInt(matchYear[matchYear.length - 1], 10);
                const currentYear = new Date().getFullYear();
                const diff = endYear - currentYear;
                if (diff <= 0) return { academicYear: "4th Year", graduationBatch: `Class of ${endYear}` };
                if (diff === 1) return { academicYear: "3rd Year", graduationBatch: `Class of ${endYear}` };
                if (diff === 2) return { academicYear: "2nd Year", graduationBatch: `Class of ${endYear}` };
                return { academicYear: "1st Year", graduationBatch: `Class of ${endYear}` };
            }

            return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
        };

        const { year, search } = req.query;

        let students = rawStudents.map((s) => {
            const { academicYear, graduationBatch } = computeAcademicYear(s.education);
            const verifiedCertsCount = (s.certifications || []).filter((c) => c.isVerified).length;
            const totalCertsCount = (s.certifications || []).length;
            const firstEdu = (s.education && s.education.length > 0) ? s.education[0] : undefined;
            const primaryDegree = firstEdu
                ? `${firstEdu.education || "Undergraduate"}${firstEdu.course ? ` - ${firstEdu.course}` : ""}`
                : "B.Tech Computer Science & Engineering";

            return {
                _id: s._id,
                userId: s.userId ? s.userId.toString() : s._id.toString(),
                name: s.name,
                headline: s.headline || "",
                profileImage: s.profileImage || s.image || "",
                institution: s.institution || s.institutionName || instName || "Academic Institution",
                institutionEmail: s.institutionEmail || "",
                isEmailVerified: Boolean(s.isEmailVerified),
                skills: s.skills || [],
                education: s.education || [],
                academicYear,
                graduationBatch,
                primaryDegree,
                verifiedCertsCount,
                totalCertsCount,
                experienceCount: (s.pastExperience || []).length,
                bio: s.bio || "",
                createdAt: s.createdAt,
            };
        });

        // Apply academic year filter if provided
        if (year && typeof year === "string" && year.toLowerCase() !== "all") {
            const lowerYear = year.toLowerCase();
            students = students.filter(
                (s) =>
                    s.academicYear.toLowerCase().includes(lowerYear) ||
                    s.graduationBatch.toLowerCase().includes(lowerYear)
            );
        }

        // Apply search filter if provided
        if (search && typeof search === "string" && search.trim().length > 0) {
            const term = search.toLowerCase().trim();
            students = students.filter(
                (s) =>
                    s.name.toLowerCase().includes(term) ||
                    s.institutionEmail.toLowerCase().includes(term) ||
                    s.primaryDegree.toLowerCase().includes(term) ||
                    s.skills.some((sk) => sk.toLowerCase().includes(term))
            );
        }

        return res.status(200).json({
            success: true,
            count: students.length,
            data: students,
        });
    } catch (error) {
        console.error("getInstitutionStudents error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch enrolled students",
        });
    }
}

// 2026 Tech Market Demand Benchmarks for Institutional Skill Diagnostics
const HIGH_DEMAND_MARKET_SKILLS = [
    { skill: "Python", demandWeight: 88, category: "AI & Systems", rationale: "Mandated across AI/ML engineering, data pipelines, and backend microservices." },
    { skill: "TypeScript", demandWeight: 82, category: "Modern Fullstack", rationale: "Industry prerequisite for type-safe frontend and Node.js architectures." },
    { skill: "React", demandWeight: 79, category: "Frontend", rationale: "Dominant web application UI library across enterprise product suites." },
    { skill: "Docker", demandWeight: 74, category: "DevOps & Cloud", rationale: "Universal containerization requirement for CI/CD and production runtimes." },
    { skill: "PostgreSQL", demandWeight: 71, category: "Data Architecture", rationale: "Enterprise gold standard for relational persistence, indexing, and analytics." },
    { skill: "FastAPI", demandWeight: 68, category: "Backend", rationale: "High-velocity asynchronous Python framework for production API services." },
    { skill: "Kubernetes", demandWeight: 62, category: "Infrastructure", rationale: "Cloud-native orchestration benchmark for scalable deployments." },
    { skill: "PyTorch", demandWeight: 60, category: "Machine Learning", rationale: "Standard framework for neural networks, LLM fine-tuning, and research models." },
];

/**
 * @description Fetch all institution members (both Students & Faculty) with filtering
 * @route GET /api/verification/institution-members
 * @access Authenticated (Institution)
 */
export async function getInstitutionMembers(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const institutionProfile = await profileModel.findOne({ userId: req.userId });
        const instName = institutionProfile?.institutionName || institutionProfile?.name;

        const { role = "all", year, search } = req.query;

        const memberFilter: any = {};
        if (role === "student") {
            memberFilter.accountType = "student";
        } else if (role === "faculty") {
            memberFilter.accountType = "faculty";
        } else {
            memberFilter.accountType = { $in: ["student", "faculty"] };
        }

        if (instName) {
            const escapedName = instName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            memberFilter.$or = [
                { institution: { $regex: new RegExp(escapedName, "i") } },
                { institutionName: { $regex: new RegExp(escapedName, "i") } },
            ];
        }

        const rawMembers = await profileModel.find(memberFilter).sort({ createdAt: -1 });

        const computeAcademicYear = (educationList?: any[]): { academicYear: string; graduationBatch: string } => {
            if (!educationList || educationList.length === 0) {
                return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
            }
            const primaryEdu = educationList[0];
            const timeline = (primaryEdu?.timeline || primaryEdu?.description || "").toLowerCase();

            if (timeline.includes("1st") || timeline.includes("first") || timeline.includes("2028")) {
                return { academicYear: "1st Year", graduationBatch: "Class of 2028" };
            }
            if (timeline.includes("2nd") || timeline.includes("second") || timeline.includes("2027")) {
                return { academicYear: "2nd Year", graduationBatch: "Class of 2027" };
            }
            if (timeline.includes("4th") || timeline.includes("final") || timeline.includes("2025")) {
                return { academicYear: "4th Year", graduationBatch: "Class of 2025" };
            }
            if (timeline.includes("3rd") || timeline.includes("third") || timeline.includes("2026")) {
                return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
            }

            const matchYear = timeline.match(/20\d{2}/g);
            if (matchYear && matchYear.length > 0) {
                const endYear = parseInt(matchYear[matchYear.length - 1], 10);
                const currentYear = new Date().getFullYear();
                const diff = endYear - currentYear;
                if (diff <= 0) return { academicYear: "4th Year", graduationBatch: `Class of ${endYear}` };
                if (diff === 1) return { academicYear: "3rd Year", graduationBatch: `Class of ${endYear}` };
                if (diff === 2) return { academicYear: "2nd Year", graduationBatch: `Class of ${endYear}` };
                return { academicYear: "1st Year", graduationBatch: `Class of ${endYear}` };
            }

            return { academicYear: "3rd Year", graduationBatch: "Class of 2026" };
        };

        let members = rawMembers.map((m) => {
            const { academicYear, graduationBatch } = computeAcademicYear(m.education);
            const verifiedCertsCount = (m.certifications || []).filter((c) => c.isVerified).length;
            const totalCertsCount = (m.certifications || []).length;
            const firstEdu = (m.education && m.education.length > 0) ? m.education[0] : undefined;
            const primaryDegree = firstEdu
                ? `${firstEdu.education || "Undergraduate"}${firstEdu.course ? ` - ${firstEdu.course}` : ""}`
                : (m.accountType === "faculty" ? (m.designation || "Faculty Member") : "B.Tech Computer Science & Engineering");

            return {
                _id: m._id,
                userId: m.userId ? m.userId.toString() : m._id.toString(),
                name: m.name,
                headline: m.headline || "",
                accountType: m.accountType || "student",
                designation: m.designation || (m.accountType === "faculty" ? "Faculty Member" : undefined),
                profileImage: m.profileImage || (m as any).image || "",
                institution: m.institution || m.institutionName || instName || "Academic Institution",
                institutionEmail: m.institutionEmail || (m as any).email || "",
                isEmailVerified: Boolean(m.isEmailVerified),
                skills: m.skills || [],
                education: m.education || [],
                academicYear,
                graduationBatch,
                primaryDegree,
                verifiedCertsCount,
                totalCertsCount,
                experienceCount: (m.pastExperience || []).length,
                bio: m.bio || "",
                createdAt: m.createdAt,
            };
        });

        // Year filter (applies mostly to students)
        if (year && typeof year === "string" && year.toLowerCase() !== "all") {
            const lowerYear = year.toLowerCase();
            members = members.filter(
                (m) =>
                    m.accountType === "faculty" ||
                    m.academicYear.toLowerCase().includes(lowerYear) ||
                    m.graduationBatch.toLowerCase().includes(lowerYear)
            );
        }

        // Search term filter
        if (search && typeof search === "string" && search.trim().length > 0) {
            const term = search.toLowerCase().trim();
            members = members.filter(
                (m) =>
                    m.name.toLowerCase().includes(term) ||
                    m.institutionEmail.toLowerCase().includes(term) ||
                    m.primaryDegree.toLowerCase().includes(term) ||
                    (m.designation && m.designation.toLowerCase().includes(term)) ||
                    m.skills.some((sk) => sk.toLowerCase().includes(term))
            );
        }

        return res.status(200).json({
            success: true,
            count: members.length,
            data: members,
        });
    } catch (error) {
        console.error("getInstitutionMembers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch institution members",
        });
    }
}

/**
 * @description Fetch single student/faculty member details with verified vs lacking skills
 * @route GET /api/verification/institution-members/:id
 * @access Authenticated (Institution)
 */
export async function getInstitutionMemberById(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id } = req.params;

        // Search by profile _id or userId
        let member = null;
        if (mongoose.isValidObjectId(id)) {
            member = await profileModel.findById(id);
            if (!member) {
                member = await profileModel.findOne({ userId: id } as any);
            }
        }

        if (!member) {
            return res.status(404).json({ success: false, message: "Member profile not found" });
        }

        const memberSkills = (member.skills || []).map((s) => s.toLowerCase().trim());

        // Extract verified skills (skills backed by verified certifications, past experiences, or verified profile)
        const verifiedSkillSet = new Set<string>();
        (member.certifications || []).forEach((c) => {
            if (c.isVerified) {
                // If certification is verified, its associated skill or title keyword is verified
                member.skills?.forEach((sk) => {
                    if (c.title.toLowerCase().includes(sk.toLowerCase())) {
                        verifiedSkillSet.add(sk);
                    }
                });
            }
        });

        // Default: at least top verified profile skills or explicitly listed
        const verifiedSkills = member.skills?.filter(
            (sk) => verifiedSkillSet.has(sk) || member.isEmailVerified
        ) || [];

        // Calculate Lacking Skills based on 2026 Tech Market Trends
        const lackingSkills = HIGH_DEMAND_MARKET_SKILLS.filter((h) => {
            const norm = h.skill.toLowerCase();
            return !memberSkills.some((ms) => ms.includes(norm) || norm.includes(ms));
        });

        // Calculate Profile Readiness Score against corporate demand
        const matchedMarketSkills = HIGH_DEMAND_MARKET_SKILLS.filter((h) => {
            const norm = h.skill.toLowerCase();
            return memberSkills.some((ms) => ms.includes(norm) || norm.includes(ms));
        }).length;
        const profileReadinessScore = Math.round((matchedMarketSkills / HIGH_DEMAND_MARKET_SKILLS.length) * 100);

        return res.status(200).json({
            success: true,
            data: {
                member,
                verifiedSkills,
                lackingSkills,
                profileReadinessScore,
                totalMarketBenchmarks: HIGH_DEMAND_MARKET_SKILLS.length,
            },
        });
    } catch (error) {
        console.error("getInstitutionMemberById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch member details",
        });
    }
}
