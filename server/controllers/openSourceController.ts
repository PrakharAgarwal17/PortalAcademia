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

        const { title, description, repoUrl, techStack, difficulty, issues } = req.body as {
            title?: string;
            description?: string;
            repoUrl?: string;
            techStack?: string[];
            difficulty?: Difficulty;
            issues?: Array<{
                issueNumber?: number;
                title: string;
                url: string;
                difficulty?: Difficulty;
                labels?: string[];
            }>;
        };

        if (!title?.trim() || !description?.trim() || !repoUrl?.trim()) {
            return res.status(400).json({ success: false, message: "title, description, and repoUrl are required." });
        }

        const repoFullName = extractRepoFullName(repoUrl.trim());
        const webhookSecret = crypto.randomBytes(32).toString("hex");

        const sanitizedIssues = Array.isArray(issues)
            ? issues
                .filter((iss) => iss && iss.title?.trim() && iss.url?.trim())
                .map((iss) => ({
                    issueNumber: iss.issueNumber,
                    title: iss.title.trim(),
                    url: iss.url.trim(),
                    difficulty: iss.difficulty || "intermediate",
                    labels: Array.isArray(iss.labels) ? iss.labels : [],
                }))
            : [];

        const project: any = await openSourceProjectModel.create({
            postedBy: userId as any,
            companyName: profile?.companyName || profile?.name || "Company",
            title: title.trim(),
            description: description.trim(),
            repoUrl: repoUrl.trim(),
            repoFullName,
            techStack: Array.isArray(techStack) ? techStack : [],
            difficulty: (difficulty as Difficulty) || "intermediate",
            issues: sanitizedIssues as any,
            openIssuesCount: sanitizedIssues.length,
            webhookSecret,
        });

        const serverBase = process.env.SERVER_URL || `http://localhost:3000`;

        return res.status(201).json({
            success: true,
            project: {
                _id: project._id,
                title: project.title,
                repoUrl: project.repoUrl,
                repoFullName: project.repoFullName,
                techStack: project.techStack,
                difficulty: project.difficulty,
                issues: project.issues,
                openIssuesCount: project.openIssuesCount,
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
        const now = new Date();
        const isPremiumActive = user?.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now;
        if (!isPremiumActive) {
            return res.status(403).json({ success: false, message: "Active premium membership required to access open source projects." });
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

        // Automatically push verified certification to student profile
        const companyLabel = profile?.companyName || "Industry Partner";
        await profileModel.findOneAndUpdate(
            { userId: contribution.studentId },
            {
                $push: {
                    certifications: {
                        title: `Open Source Contributor: ${project.title}`,
                        description: `Merged PR #${contribution.prNumber}: ${contribution.prTitle}`,
                        issuer: companyLabel,
                        credentialUrl: contribution.prUrl,
                        isVerified: true,
                        verifiedBy: userId as any,
                        verifiedAt: new Date(),
                        verificationNotes: "Verified via PortalAcademia GitHub Webhook Engine",
                    },
                },
            }
        );

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

        const rawPayload = (req as any).rawBody;
        if (!rawPayload) {
            return res.status(400).json({ message: "Raw webhook payload is unavailable for HMAC signature verification." });
        }

        const expectedSig =
            "sha256=" +
            crypto
                .createHmac("sha256", project.webhookSecret)
                .update(rawPayload)
                .digest("hex");

        const sigBuf = Buffer.from(sigHeader);
        const expectedBuf = Buffer.from(expectedSig);

        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
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

        const safeGithubUsername = githubUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

        // Look up student by verified githubUsername on userModel first, then profileModel
        let studentUser = await userModel.findOne({
            githubUsername: { $regex: new RegExp(`^${safeGithubUsername}$`, "i") },
        }).lean();

        let studentProfile = null;
        if (studentUser) {
            studentProfile = await profileModel.findOne({ userId: studentUser._id });
        } else {
            studentProfile = await profileModel.findOne({
                $or: [
                    { githubUsername: { $regex: new RegExp(`^${safeGithubUsername}$`, "i") } },
                    { github: { $regex: new RegExp(`(^|/)${safeGithubUsername}$`, "i") } },
                ],
            } as any);
            if (studentProfile) {
                studentUser = await userModel.findById(studentProfile.userId).lean();
            }
        }

        if (!studentProfile || !studentUser) {
            return res.status(200).json({ message: "GitHub user not found on platform." });
        }

        const now = new Date();
        const isPremium = studentUser?.isPremium && studentUser.premiumExpiresAt && new Date(studentUser.premiumExpiresAt) > now;
        if (!isPremium) {
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

export async function addProjectIssue(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const { id: projectId } = req.params;
        const { title, url, difficulty, issueNumber, labels } = req.body as {
            title?: string;
            url?: string;
            difficulty?: Difficulty;
            issueNumber?: number;
            labels?: string[];
        };

        if (!title?.trim() || !url?.trim()) {
            return res.status(400).json({ success: false, message: "Issue title and URL are required." });
        }

        const project: any = await openSourceProjectModel.findOne({
            _id: projectId,
            postedBy: userId as any,
        } as any);

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found or not owned by you." });
        }

        const newIssue = {
            issueNumber: typeof issueNumber === "number" ? issueNumber : undefined,
            title: title.trim(),
            url: url.trim(),
            difficulty: (difficulty as Difficulty) || "intermediate",
            labels: Array.isArray(labels) ? labels : [],
        };

        if (!project.issues) {
            project.issues = [];
        }
        project.issues.push(newIssue as any);
        project.openIssuesCount = project.issues.length;
        await project.save();

        return res.status(200).json({
            success: true,
            message: "Curated issue registered successfully.",
            issues: project.issues,
        });
    } catch (error) {
        console.error("[addProjectIssue]", error);
        return res.status(500).json({ success: false, message: "Failed to add issue.", error });
    }
}

export async function verifyPullRequest(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const { projectId, prUrl } = req.body as { projectId?: string; prUrl?: string };

        if (!projectId || !prUrl?.trim()) {
            return res.status(400).json({
                success: false,
                message: "projectId and prUrl are required.",
            });
        }

        // 1. Verify User and Linked GitHub Account
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const now = new Date();
        const isPremiumActive = user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now;
        if (!isPremiumActive) {
            return res.status(403).json({
                success: false,
                message: "Active premium membership required to verify and track open source contributions.",
            });
        }

        const studentProfile = await profileModel.findOne({ userId: userId as any } as any);
        const studentGithub = (user.githubUsername || studentProfile?.githubUsername || "").trim().toLowerCase();

        if (!studentGithub) {
            return res.status(400).json({
                success: false,
                message: "Please connect your GitHub account first before verifying contributions.",
            });
        }

        // 2. Parse PR URL: https://github.com/:owner/:repo/pull/:prNumber
        const prRegex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;
        const match = prUrl.trim().match(prRegex);
        if (!match || !match[1] || !match[2] || !match[3]) {
            return res.status(400).json({
                success: false,
                message: "Invalid GitHub pull request URL. Format: https://github.com/owner/repo/pull/123",
            });
        }

        const owner = match[1];
        const repo = match[2];
        const prNumber = parseInt(match[3], 10);
        const parsedRepoFullName = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

        // 3. Confirm target project exists and matches repository
        const project: any = await openSourceProjectModel.findById(projectId);
        if (!project || !project.isActive) {
            return res.status(404).json({
                success: false,
                message: "Registered open source project not found or currently inactive.",
            });
        }

        const expectedRepo = project.repoFullName.toLowerCase();
        if (parsedRepoFullName !== expectedRepo) {
            return res.status(400).json({
                success: false,
                message: `PR repository (${owner}/${repo}) does not match this project's repository (${project.repoFullName}).`,
            });
        }

        // 4. Check if contribution already recorded
        const existing = await contributionModel.findOne({
            projectId: project._id,
            prNumber,
        } as any);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "This pull request has already been verified and recorded on PortalAcademia.",
            });
        }

        // 5. Query GitHub REST API
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "PortalAcademia-PR-Engine",
        };

        const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
        if (githubToken) {
            headers["Authorization"] = `Bearer ${githubToken}`;
        }

        const ghRes = await fetch(githubApiUrl, { headers });
        if (ghRes.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull Request not found on GitHub. Please ensure the repository is public and the PR number is correct.",
            });
        }
        if (!ghRes.ok) {
            const errBody = await ghRes.text().catch(() => "");
            return res.status(ghRes.status).json({
                success: false,
                message: `GitHub API returned error: ${ghRes.statusText}`,
                details: errBody,
            });
        }

        const prData = await ghRes.json();

        // 6. Verify PR is merged
        if (!prData.merged || !prData.merged_at) {
            return res.status(400).json({
                success: false,
                message: `This Pull Request is ${prData.state} and has not been merged yet. Only merged PRs can be verified.`,
            });
        }

        // 6b. Verify the PR was merged into the company's repository
        const baseRepo = (prData.base?.repo?.full_name || "").toLowerCase();
        if (baseRepo && baseRepo !== expectedRepo) {
            return res.status(400).json({
                success: false,
                message: `PR base destination (${baseRepo}) does not match the company repository (${project.repoFullName}).`,
            });
        }

        // 7. Verify author matches student's linked GitHub account (either PR creator or commit contributor)
        const prAuthor = (prData.user?.login || "").trim().toLowerCase();
        let isVerifiedContributor = prAuthor === studentGithub;

        if (!isVerifiedContributor) {
            // Also inspect commits in the PR to verify if the student authored commits merged into the repo
            try {
                const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`;
                const commitsRes = await fetch(commitsUrl, { headers });
                if (commitsRes.ok) {
                    const commits = await commitsRes.json();
                    if (Array.isArray(commits)) {
                        const userEmail = (user.email || "").trim().toLowerCase();
                        isVerifiedContributor = commits.some((c: any) => {
                            const authorLogin = (c.author?.login || "").trim().toLowerCase();
                            const committerLogin = (c.committer?.login || "").trim().toLowerCase();
                            const gitAuthorEmail = (c.commit?.author?.email || "").trim().toLowerCase();
                            const gitCommitterEmail = (c.commit?.committer?.email || "").trim().toLowerCase();

                            return (
                                authorLogin === studentGithub ||
                                committerLogin === studentGithub ||
                                (userEmail && (gitAuthorEmail === userEmail || gitCommitterEmail === userEmail))
                            );
                        });
                    }
                }
            } catch { }
        }

        if (!isVerifiedContributor) {
            return res.status(403).json({
                success: false,
                message: `Neither the Pull Request creator (@${prData.user?.login}) nor any merged commit author matches your linked GitHub account (@${studentGithub}).`,
            });
        }

        // 8. Record the contribution atomically
        const contribution: any = await contributionModel.create({
            projectId: project._id,
            companyId: project.postedBy,
            studentId: userId as any,
            studentName: studentProfile?.name || user.email.split("@")[0] || "Student",
            githubUsername: prData.user?.login || studentGithub,
            prUrl: prData.html_url || prUrl.trim(),
            prTitle: prData.title || `Pull Request #${prNumber}`,
            prNumber,
            mergedAt: new Date(prData.merged_at),
            certificateIssued: false,
        });

        // 9. Dispatch notifications
        await notificationModel.create({
            userId: userId as any,
            type: "pr_merged",
            title: "PR Verified & Recorded!",
            message: `Your PR #${prNumber} "${prData.title}" was verified and recorded for ${project.title}!`,
            metadata: {
                projectId: project._id.toString(),
                prUrl: prData.html_url || prUrl.trim(),
                companyName: project.companyName,
                projectTitle: project.title,
                contributionId: contribution._id.toString(),
            },
        });

        await notificationModel.create({
            userId: project.postedBy,
            type: "pr_merged",
            title: "New Merged PR Verified",
            message: `@${prData.user?.login} (${studentProfile?.name || "Student"}) verified merged PR #${prNumber} in ${project.title}.`,
            metadata: {
                projectId: project._id.toString(),
                prUrl: prData.html_url || prUrl.trim(),
                studentId: String(userId),
                contributionId: contribution._id.toString(),
            },
        });

        return res.status(201).json({
            success: true,
            message: "Pull Request verified and recorded successfully!",
            contribution,
        });
    } catch (error) {
        console.error("[verifyPullRequest]", error);
        return res.status(500).json({ success: false, message: "Failed to verify pull request.", error });
    }
}

