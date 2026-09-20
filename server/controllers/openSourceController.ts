import type { Request, Response } from "express";
import crypto from "crypto";
import openSourceProjectModel, { type Difficulty } from "../models/openSourceProjectModel.js";
import contributionModel from "../models/contributionModel.js";
import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";

function extractRepoFullName(repoUrl: string): string {
    try {
        const url = new URL(repoUrl);
        return url.pathname.replace(/^\//, "").replace(/\.git$/, "");
    } catch {
        return repoUrl;
    }
}

export async function createProject(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const profile = req.userProfile;

        const { title, description, repoUrl, techStack, difficulty } = req.body as {
            title?: string;
            description?: string;
            repoUrl?: string;
            techStack?: string[];
            difficulty?: Difficulty;
        };

        if (!title?.trim() || !description?.trim() || !repoUrl?.trim()) {
            return res.status(400).json({ success: false, message: "title, description, and repoUrl are required." });
        }

        const repoFullName = extractRepoFullName(repoUrl.trim());
        const webhookSecret = crypto.randomBytes(32).toString("hex");

        const project: any = await openSourceProjectModel.create({
            postedBy: userId as any,
            companyName: profile?.companyName || profile?.name || "Company",
            title: title.trim(),
            description: description.trim(),
            repoUrl: repoUrl.trim(),
            repoFullName,
            techStack: Array.isArray(techStack) ? techStack : [],
            difficulty: (difficulty as Difficulty) || "intermediate",
            webhookSecret,
        });

        const serverBase = process.env.SERVER_URL || `http://localhost:3000`;

        return res.status(201).json({
            success: true,
            project: {
                _id: project._id,
                title: project.title,
                repoUrl: project.repoUrl,
                techStack: project.techStack,
                difficulty: project.difficulty,
                isActive: project.isActive,
                createdAt: project.createdAt,
            },
            webhookSetup: {
                webhookUrl: `${serverBase}/api/opensource/webhook/${project._id.toString()}`,
                webhookSecret,
                instructions: "Add this webhook to your GitHub repo: Settings -> Webhooks -> Add webhook. Select Content-Type: application/json, paste the Secret, and choose 'Pull requests' under events.",
            },
        });
    } catch (error) {
        console.error("[createProject]", error);
        return res.status(500).json({ success: false, message: "Failed to create project.", error });
    }
}

export async function getMyProjects(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const projects: any[] = await openSourceProjectModel
            .find({ postedBy: userId as any } as any)
            .sort({ createdAt: -1 })
            .lean();

        const projectIds = projects.map((p) => p._id);
        const contribCounts = await contributionModel.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: "$projectId", count: { $sum: 1 } } },
        ]);
        const countMap = new Map(contribCounts.map((c) => [c._id.toString(), c.count as number]));

        const result = projects.map((p) => ({
            ...p,
            contributionCount: countMap.get(p._id.toString()) ?? 0,
        }));

        return res.status(200).json({ success: true, projects: result });
    } catch (error) {
        console.error("[getMyProjects]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch projects.", error });
    }
}

export async function getAllProjects(req: Request, res: Response) {
    try {
        const userId = req.userId;

        const user = await userModel.findById(userId).lean();
        if (!user?.isPremium) {
            return res.status(403).json({ success: false, message: "Premium membership required to access open source projects." });
        }

        const { tech, difficulty, company } = req.query;
        const filter: Record<string, any> = { isActive: true };

        if (tech) filter.techStack = { $in: [new RegExp(String(tech), "i")] };
        if (difficulty) filter.difficulty = String(difficulty);
        if (company) filter.companyName = { $regex: new RegExp(String(company), "i") };

        const projects = await openSourceProjectModel
            .find(filter)
            .select("-webhookSecret")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error("[getAllProjects]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch projects.", error });
    }
}

export async function getProjectContributions(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const { id: projectId } = req.params;

        const project = await openSourceProjectModel.findOne({ _id: projectId, postedBy: userId as any } as any);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found or not yours." });
        }

        const contributions = await contributionModel
            .find({ projectId: projectId as any } as any)
            .sort({ mergedAt: -1 })
            .lean();

        return res.status(200).json({ success: true, contributions });
    } catch (error) {
        console.error("[getProjectContributions]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch contributions.", error });
    }
}

export async function issueCertificate(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const profile = req.userProfile;
        const { contributionId } = req.body as { contributionId?: string };

        if (!contributionId) {
            return res.status(400).json({ success: false, message: "contributionId is required." });
        }

        const contribution: any = await contributionModel.findById(contributionId);
        if (!contribution) {
            return res.status(404).json({ success: false, message: "Contribution not found." });
        }

        const project: any = await openSourceProjectModel.findOne({
            _id: contribution.projectId,
            postedBy: userId as any,
        } as any);
        if (!project) {
            return res.status(403).json({ success: false, message: "You can only issue certificates for your own projects." });
        }

        if (contribution.certificateIssued) {
            return res.status(409).json({ success: false, message: "Certificate already issued for this contribution." });
        }

        contribution.certificateIssued = true;
        contribution.certificateIssuedAt = new Date();
        await contribution.save();

        await notificationModel.create({
            userId: contribution.studentId,
            type: "certificate_issued",
            title: "Certificate Issued!",
            message: `${profile?.companyName || "A company"} has issued you a certificate for your contribution to "${project.title}"!`,
            metadata: {
                projectId: project._id.toString(),
                contributionId: contribution._id.toString(),
                companyName: profile?.companyName || "",
                projectTitle: project.title,
            },
        });

        return res.status(200).json({ success: true, message: "Certificate issued and student notified." });
    } catch (error) {
        console.error("[issueCertificate]", error);
        return res.status(500).json({ success: false, message: "Failed to issue certificate.", error });
    }
}

export async function getMyContributions(req: Request, res: Response) {
    try {
        const userId = req.userId;

        const contributions = await contributionModel
            .find({ studentId: userId as any } as any)
            .populate("projectId", "title repoUrl companyName techStack")
            .sort({ mergedAt: -1 })
            .lean();

        return res.status(200).json({ success: true, contributions });
    } catch (error) {
        console.error("[getMyContributions]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch contributions.", error });
    }
}

export async function handleGithubWebhook(req: Request, res: Response) {
    try {
        const { projectId } = req.params;

        const project: any = await openSourceProjectModel
            .findById(projectId)
            .select("+webhookSecret");

        if (!project || !project.isActive) {
            return res.status(404).json({ message: "Project not found." });
        }

        const sigHeader = req.headers["x-hub-signature-256"];
        if (!sigHeader || typeof sigHeader !== "string") {
            return res.status(401).json({ message: "Missing GitHub signature." });
        }

        const rawBody = JSON.stringify(req.body);
        const expectedSig =
            "sha256=" +
            crypto
                .createHmac("sha256", project.webhookSecret)
                .update(rawBody)
                .digest("hex");

        if (!crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expectedSig))) {
            return res.status(401).json({ message: "Invalid signature." });
        }

        const event = req.headers["x-github-event"];
        if (event !== "pull_request") {
            return res.status(200).json({ message: "Event ignored." });
        }

        const payload = req.body as {
            action: string;
            pull_request: {
                merged: boolean;
                number: number;
                title: string;
                html_url: string;
                merged_at: string;
                user: { login: string };
            };
            repository: { full_name: string };
        };

        if (payload.action !== "closed" || !payload.pull_request.merged) {
            return res.status(200).json({ message: "PR not merged — ignored." });
        }

        const githubUsername = payload.pull_request.user.login;
        const prNumber = payload.pull_request.number;

        const existing = await contributionModel.findOne({ projectId: projectId as any, prNumber } as any);
        if (existing) {
            return res.status(200).json({ message: "Contribution already recorded." });
        }

        const studentProfile = await profileModel.findOne({
            github: { $regex: new RegExp(`(^|/)${githubUsername}$`, "i") },
        } as any);

        if (!studentProfile) {
            return res.status(200).json({ message: "GitHub user not found on platform." });
        }

        const studentUser = await userModel.findById(studentProfile.userId).lean();
        if (!studentUser?.isPremium) {
            return res.status(200).json({ message: "Student not premium — contribution not recorded." });
        }

        await contributionModel.create({
            projectId: project._id,
            companyId: project.postedBy,
            studentId: studentProfile.userId,
            studentName: studentProfile.name,
            githubUsername,
            prUrl: payload.pull_request.html_url,
            prTitle: payload.pull_request.title,
            prNumber,
            mergedAt: new Date(payload.pull_request.merged_at),
        });

        await notificationModel.create({
            userId: studentProfile.userId,
            type: "pr_merged",
            title: "PR Merged!",
            message: `Your PR "${payload.pull_request.title}" was merged into ${project.companyName}'s project "${project.title}"!`,
            metadata: {
                projectId: project._id.toString(),
                prUrl: payload.pull_request.html_url,
                companyName: project.companyName,
                projectTitle: project.title,
            },
        });

        return res.status(200).json({ message: "Contribution recorded and student notified." });
    } catch (error) {
        console.error("[handleGithubWebhook]", error);
        return res.status(500).json({ message: "Webhook processing failed.", error });
    }
}

export async function getStudentContributionsForCompany(req: Request, res: Response) {
    try {
        const companyUserId = req.userId;
        const { studentId } = req.params;

        const companyProjects: any[] = await openSourceProjectModel
            .find({ postedBy: companyUserId as any, isActive: true } as any)
            .select("_id title")
            .lean();

        const projectIds = companyProjects.map((p) => p._id);

        const contributions: any[] = await contributionModel
            .find({ studentId: studentId as any, projectId: { $in: projectIds } } as any)
            .sort({ mergedAt: -1 })
            .lean();

        const projectTitleMap = new Map(companyProjects.map((p) => [p._id.toString(), p.title]));
        const enriched = contributions.map((c) => ({
            ...c,
            projectTitle: projectTitleMap.get(c.projectId.toString()) ?? "",
        }));

        return res.status(200).json({ success: true, contributions: enriched });
    } catch (error) {
        console.error("[getStudentContributionsForCompany]", error);
        return res.status(500).json({ success: false, message: "Failed to fetch contributions.", error });
    }
}
