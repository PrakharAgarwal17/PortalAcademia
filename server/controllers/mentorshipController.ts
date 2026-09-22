import type { Request, Response } from "express";
import mongoose from "mongoose";
import mentorshipModel from "../models/mentorshipModel.js";
import mentorshipReportModel from "../models/mentorshipReportModel.js";
import profileModel from "../models/profileModel.js";
import notificationModel from "../models/notificationModel.js";
import { resolveAlumniStatus } from "../utils/alumniResolver.js";

/** Shape returned by generateMentorAssessment and expected by MentorApplicationModal */
interface AssessmentQuestion {
    id: number;
    category: string;
    scenario: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
}

const FALLBACK_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
    {
        id: 1,
        category: "Academic Honesty & Integrity",
        scenario:
            "A junior mentee asks you to write their graded assignment code for them under a tight deadline. As a verified PortalAcademia mentor, what is the required response?",
        options: [
            { id: "a", text: "Write the core logic for them since it's urgent, telling them to review it later." },
            { id: "b", text: "Decline to write the code. Help them debug, review architecture, and explain concepts while upholding academic integrity." },
            { id: "c", text: "Share your own past assignment repository and tell them to adapt it." },
            { id: "d", text: "Report them to administration without offering any educational guidance." },
        ],
        correctAnswer: "b",
        explanation:
            "Mentors guide and empower scholars through architectural review and concept explanation — never by ghostwriting or compromising academic integrity.",
    },
    {
        id: 2,
        category: "Constructive Technical Advising",
        scenario:
            "A mentee presents an MVP with clear performance issues (N+1 database queries inside an unthrottled loop). How do you provide architectural critique?",
        options: [
            { id: "a", text: "Tell them the design is fundamentally flawed and rewrite their system design document yourself." },
            { id: "b", text: "Ignore the bottlenecks entirely to protect their confidence, giving only visual praise." },
            { id: "c", text: "Acknowledge what they built, ask guiding questions about database load under concurrency, and lead them to discover indexing and caching solutions." },
            { id: "d", text: "Advise them to abandon the project and pick a simpler non-technical alternative." },
        ],
        correctAnswer: "c",
        explanation:
            "Effective mentorship uses Socratic questioning to build the mentee's critical problem-solving skills rather than giving blunt criticism or doing the work for them.",
    },
    {
        id: 3,
        category: "1-on-1 Session Conduct & Empathy",
        scenario:
            "During a scheduled 30-minute WebRTC session, a mentee appears nervous and expresses severe imposter syndrome regarding upcoming technical interviews. How do you structure the session?",
        options: [
            { id: "a", text: "Tell them that nervousness will cause them to fail and suggest cancelling their interviews." },
            { id: "b", text: "Normalise their feelings, clarify their priority topics, and break down technical interview prep into manageable, actionable milestones." },
            { id: "c", text: "Spend the entire 30 minutes reciting your own past offers and career achievements." },
            { id: "d", text: "End the call early because psychological preparation is not part of technical mentorship." },
        ],
        correctAnswer: "b",
        explanation:
            "Mentors create psychological safety, normalise common challenges like imposter syndrome, and provide structured, actionable guidance.",
    },
    {
        id: 4,
        category: "Platform Safety & Zero Solicitation",
        scenario:
            "A mentee offers to pay you privately via UPI for extra offline coaching outside PortalAcademia. What does the Mentor Honor Code mandate?",
        options: [
            { id: "a", text: "Accept as long as no payment details are mentioned inside the platform chat." },
            { id: "b", text: "Firmly and politely decline. Remind the mentee that PortalAcademia senior peer advising is 100% free and all sessions must be held through secure platform channels." },
            { id: "c", text: "Accept payment in advance before joining the scheduled call." },
            { id: "d", text: "Ask for platform gift cards or cryptocurrency transfers instead of cash." },
        ],
        correctAnswer: "b",
        explanation:
            "PortalAcademia senior peer mentorship is always free. Soliciting or accepting off-platform compensation is strictly prohibited.",
    },
    {
        id: 5,
        category: "Growth Mindset Pedagogy",
        scenario:
            "A mentee says 'I'm simply not smart enough for software engineering' after struggling with async code and race conditions. What is your pedagogical approach?",
        options: [
            { id: "a", text: "Validate that async programming is genuinely non-intuitive, share a relatable analogy, and trace through a minimal Promise example together step-by-step." },
            { id: "b", text: "Agree that software engineering requires innate talent and suggest transitioning to a non-technical role." },
            { id: "c", text: "Paste a 200-line boilerplate async utility into chat and tell them to copy-paste without understanding it." },
            { id: "d", text: "Advise them to convert all asynchronous code to synchronous blocking operations to avoid complexity." },
        ],
        correctAnswer: "a",
        explanation:
            "Growth mindset and clear analogies help mentees overcome cognitive hurdles and build long-term technical confidence.",
    },
];

/**
 * @description Senior student applies for free to become a mentor
 * @route POST /api/mentorship/apply
 * @access Authenticated (Student)
 */
export async function applyAsMentor(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Session required." });
        }

        const { mentorBio, mentorTopics, mentorTermsAccepted, testScore, testPassed, academicYear } = req.body;

        if (!mentorTermsAccepted) {
            return res.status(400).json({
                success: false,
                message: "You must accept the Mentor Honor Code and Platform Terms to register as a mentor.",
            });
        }

        const profile = await profileModel.findOne({ userId: req.userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        // Allow student to confirm 4th-year status if explicitly submitted
        if (academicYear === "4th Year" || academicYear === "Alumni") {
            profile.academicYear = academicYear;
        }

        // Strictly verify that the applicant is 4th year or alumni (or faculty)
        const alumniInfo = resolveAlumniStatus(profile);
        const isEligibleYear =
            profile.accountType === "faculty" ||
            alumniInfo.isAlumni ||
            alumniInfo.academicYear === "4th Year" ||
            profile.academicYear === "4th Year";

        if (!isEligibleYear) {
            return res.status(403).json({
                success: false,
                message: `Peer mentorship is reserved for senior 4th-year students and alumni. Your academic profile is currently registered as "${alumniInfo.academicYear}".`,
                academicYear: alumniInfo.academicYear,
            });
        }

        // Require mandatory 80% passing score on Mentor Competency & Ethics Assessment for new applicants
        if (!profile.isMentor) {
            const numericScore = typeof testScore === "number" ? testScore : Number(testScore);
            if (!testPassed || isNaN(numericScore) || numericScore < 80) {
                return res.status(400).json({
                    success: false,
                    message: "You must complete and pass the Mentor Competency & Ethics Assessment with at least 80% (4/5) to qualify.",
                });
            }
            profile.mentorTestScore = numericScore;
            profile.mentorTestPassedAt = new Date();
            if (!profile.atsBoostPoints || profile.atsBoostPoints < 20) {
                profile.atsBoostPoints = (profile.atsBoostPoints || 0) + 20;
            }
        }

        const topicsArray = Array.isArray(mentorTopics)
            ? mentorTopics.map((t: string) => String(t).trim()).filter(Boolean)
            : typeof mentorTopics === "string"
            ? mentorTopics.split(",").map((t: string) => t.trim()).filter(Boolean)
            : profile.skills || [];

        profile.isMentor = true;
        profile.isMentorVerified = true;
        profile.mentorBio = typeof mentorBio === "string" ? mentorBio.trim() : profile.bio || "";
        profile.mentorTopics = topicsArray;
        profile.mentorTermsAccepted = true;
        profile.mentorTermsAcceptedAt = new Date();
        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Mentor privileges registered successfully with verified competency credentials.",
            profile: {
                isMentor: profile.isMentor,
                mentorBio: profile.mentorBio,
                mentorTopics: profile.mentorTopics,
                isMentorVerified: profile.isMentorVerified,
                mentorTestScore: profile.mentorTestScore,
                atsBoostPoints: profile.atsBoostPoints,
            },
        });
    } catch (error) {
        console.error("applyAsMentor error:", error);
        return res.status(500).json({ success: false, message: "Failed to submit mentor application." });
    }
}

/**
 * @description List all active verified mentors
 * @route GET /api/mentorship/mentors
 * @access Authenticated
 */
export async function getMentors(req: Request, res: Response) {
    try {
        const query: any = { isMentor: true };
        if (req.userId && mongoose.Types.ObjectId.isValid(req.userId)) {
            query.userId = { $ne: new mongoose.Types.ObjectId(req.userId) };
        }

        const mentors = await profileModel
            .find(query)
            .select("userId name headline bio profileImage image institution graduationYear skills verifiedSkills mentorBio mentorTopics atsBoostPoints createdAt")
            .lean();

        // Calculate aggregate ratings for each mentor from completed mentorships
        const mentorUserIds = mentors.map((m) => m.userId);
        const ratingsAgg = await mentorshipModel.aggregate([
            {
                $match: {
                    mentorId: { $in: mentorUserIds },
                    menteeRating: { $ne: null },
                },
            },
            {
                $group: {
                    _id: "$mentorId",
                    avgRating: { $avg: "$menteeRating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const ratingsMap = new Map<string, { avgRating: number; totalReviews: number }>();
        ratingsAgg.forEach((item) => {
            ratingsMap.set(item._id.toString(), {
                avgRating: Math.round(item.avgRating * 10) / 10,
                totalReviews: item.totalReviews,
            });
        });

        const formatted = mentors.map((m) => {
            const stats = ratingsMap.get(m.userId.toString()) || { avgRating: 5.0, totalReviews: 0 };
            return {
                ...m,
                rating: stats.avgRating,
                reviewCount: stats.totalReviews,
            };
        });

        return res.status(200).json({
            success: true,
            mentors: formatted,
        });
    } catch (error) {
        console.error("getMentors error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch mentors." });
    }
}

/**
 * @description Request a mentorship pairing (Mentee requires Premium; Mentor does not)
 * @route POST /api/mentorship/request
 * @access Authenticated (Student with Premium)
 */
export async function requestMentorship(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Session required." });
        }

        const { mentorUserId, notes, topics } = req.body;
        if (!mentorUserId || !mongoose.Types.ObjectId.isValid(mentorUserId)) {
            return res.status(400).json({ success: false, message: "Invalid mentor ID specified." });
        }

        if (mentorUserId === req.userId) {
            return res.status(400).json({ success: false, message: "You cannot request mentorship with yourself." });
        }

        // Verify Mentee has Premium entitlement
        const menteeProfile = await profileModel.findOne({ userId: req.userId });
        if (!menteeProfile || !menteeProfile.isPremium) {
            return res.status(403).json({
                success: false,
                message: "Booking a 1-on-1 mentor requires an active Premium membership.",
            });
        }

        // Verify Mentor exists
        const mentorProfile = await profileModel.findOne({ userId: mentorUserId, isMentor: true });
        if (!mentorProfile) {
            return res.status(404).json({ success: false, message: "Selected mentor is not active or not verified." });
        }

        // Check for existing active/pending mentorship
        const existing = await mentorshipModel.findOne({
            mentorId: new mongoose.Types.ObjectId(mentorUserId),
            menteeId: new mongoose.Types.ObjectId(req.userId),
            status: { $in: ["pending", "active"] },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "You already have an ongoing or pending mentorship with this mentor.",
                pairingId: existing._id,
            });
        }

        const topicsArray = Array.isArray(topics)
            ? topics.map((t: string) => String(t).trim()).filter(Boolean)
            : mentorProfile.mentorTopics || [];

        const mentorship = await mentorshipModel.create({
            mentorId: new mongoose.Types.ObjectId(mentorUserId),
            menteeId: new mongoose.Types.ObjectId(req.userId),
            status: "active", // Auto-activate upon premium booking
            startDate: new Date(),
            targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day term
            notes: typeof notes === "string" ? notes.trim() : "",
            topics: topicsArray,
        });

        // Dispatch notification to mentor
        await notificationModel.create({
            userId: new mongoose.Types.ObjectId(mentorUserId),
            type: "mentorship_request",
            title: "New Mentorship Session Booked",
            message: `${menteeProfile.name} has scheduled a 1-on-1 mentorship session with you.`,
            metadata: { pairingId: mentorship._id.toString() },
        });

        return res.status(201).json({
            success: true,
            message: "Mentorship session confirmed. Direct WebRTC calling room is now active.",
            mentorship,
        });
    } catch (error) {
        console.error("requestMentorship error:", error);
        return res.status(500).json({ success: false, message: "Failed to request mentorship." });
    }
}

/**
 * @description Get all mentorship pairings for current user (as mentor or mentee)
 * @route GET /api/mentorship/my-pairings
 * @access Authenticated
 */
export async function getMyMentorships(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const pairings = await mentorshipModel
            .find({
                $or: [
                    { mentorId: new mongoose.Types.ObjectId(req.userId) },
                    { menteeId: new mongoose.Types.ObjectId(req.userId) },
                ],
            })
            .sort({ createdAt: -1 })
            .lean();

        // Populate mentor and mentee profiles
        const userIds = Array.from(
            new Set(pairings.flatMap((p) => [p.mentorId.toString(), p.menteeId.toString()]))
        );

        const profiles = await profileModel
            .find({ userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } })
            .select("userId name headline profileImage image institution")
            .lean();

        const profileMap = new Map<string, any>();
        profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

        const populated = pairings.map((p) => ({
            ...p,
            mentor: profileMap.get(p.mentorId.toString()) || null,
            mentee: profileMap.get(p.menteeId.toString()) || null,
            isUserMentor: p.mentorId.toString() === req.userId,
            requiresReview:
                p.menteeId.toString() === req.userId &&
                p.callSessions &&
                p.callSessions.length > 0 &&
                !p.menteeRating,
        }));

        return res.status(200).json({
            success: true,
            pairings: populated,
        });
    } catch (error) {
        console.error("getMyMentorships error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch mentorships." });
    }
}

/**
 * @description Mark a mentorship pairing as completed with integrity gates
 * @route POST /api/mentorship/:id/complete
 * @access Authenticated (Mentor or Mentee)
 */
export async function completeMentorship(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid pairing ID." });
        }

        const mentorship = await mentorshipModel.findById(id);
        if (!mentorship) {
            return res.status(404).json({ success: false, message: "Mentorship not found." });
        }

        const isParticipant =
            mentorship.mentorId.toString() === req.userId ||
            mentorship.menteeId.toString() === req.userId;

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Forbidden: Not a participant." });
        }

        if (mentorship.status === "completed") {
            return res.status(200).json({ success: true, message: "Mentorship already completed.", mentorship });
        }

        // Integrity Gate: Anti-gaming audit rule
        // Pairing can only complete if at least 21 days have elapsed OR at least 2 calls totaling >= 30 mins logged
        const daysElapsed = (Date.now() - new Date(mentorship.startDate).getTime()) / (1000 * 60 * 60 * 24);
        const callsCount = mentorship.callSessions ? mentorship.callSessions.length : 0;
        const totalCallMinutes = mentorship.totalCallDurationMinutes || 0;

        const meetsTimelineGate = daysElapsed >= 21;
        const meetsCallVolumeGate = callsCount >= 2 && totalCallMinutes >= 30;

        if (!meetsTimelineGate && !meetsCallVolumeGate) {
            return res.status(400).json({
                success: false,
                message: `Completion criteria not yet fulfilled. A mentorship term requires at least 21 elapsed days (current: ${Math.round(daysElapsed)} days) OR at least 2 completed advisory calls totaling 30+ minutes (current: ${callsCount} calls, ${totalCallMinutes} mins).`,
            });
        }

        mentorship.status = "completed";
        mentorship.completedAt = new Date();
        await mentorship.save();

        return res.status(200).json({
            success: true,
            message: "Mentorship marked as successfully completed.",
            mentorship,
        });
    } catch (error) {
        console.error("completeMentorship error:", error);
        return res.status(500).json({ success: false, message: "Failed to complete mentorship." });
    }
}

/**
 * @description Submit end-of-mentorship rating & award certificate if qualifying
 * @route POST /api/mentorship/:id/rate
 * @access Authenticated (Mentee only)
 */
export async function rateMentorship(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const { rating, feedback } = req.body;

        if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
        }

        const mentorship = await mentorshipModel.findById(id);
        if (!mentorship) {
            return res.status(404).json({ success: false, message: "Mentorship pairing not found." });
        }

        if (mentorship.menteeId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Forbidden: Only the mentee can review this session." });
        }

        if (mentorship.menteeRating) {
            return res.status(400).json({ success: false, message: "You have already reviewed this mentorship." });
        }

        mentorship.menteeRating = rating;
        mentorship.menteeFeedback = typeof feedback === "string" ? feedback.trim() : "";
        mentorship.ratedAt = new Date();

        // Integrity Gate: Certificate of Appreciation & ATS boost requires:
        // 1. Rating >= 4.0
        // 2. Mentorship pairing reached completion (or satisfies call duration gates)
        const qualifiesForCert = rating >= 4.0 && (
            mentorship.status === "completed" ||
            (mentorship.callSessions && mentorship.callSessions.length >= 1 && mentorship.totalCallDurationMinutes >= 15)
        );

        if (qualifiesForCert && !mentorship.certificateIssued) {
            mentorship.status = "completed";
            mentorship.completedAt = mentorship.completedAt || new Date();
            mentorship.certificateIssued = true;
            mentorship.certificateIssuedAt = new Date();
            mentorship.certificateId = `CERT-MENTOR-${mentorship._id.toString().slice(-8).toUpperCase()}`;

            // Award 20-point verified ATS boost to mentor's profile
            await profileModel.findOneAndUpdate(
                { userId: mentorship.mentorId },
                { $inc: { atsBoostPoints: 20 } }
            );

            // Notify mentor
            await notificationModel.create({
                userId: mentorship.mentorId,
                type: "mentorship_rating",
                title: "Certificate of Appreciation Awarded!",
                message: `Your mentee submitted a ${rating}★ evaluation! A verified Certificate of Appreciation and a +20 ATS Score boost have been awarded to your scholar profile.`,
                metadata: {
                    pairingId: mentorship._id.toString(),
                    certificateId: mentorship.certificateId,
                },
            });
        }

        await mentorship.save();

        return res.status(200).json({
            success: true,
            message: qualifiesForCert
                ? "Rating recorded. Certificate of Appreciation issued to mentor with ATS score boost."
                : "Rating recorded successfully.",
            certificateIssued: mentorship.certificateIssued,
            certificateId: mentorship.certificateId,
        });
    } catch (error) {
        console.error("rateMentorship error:", error);
        return res.status(500).json({ success: false, message: "Failed to record rating." });
    }
}

/**
 * @description Report misconduct or violation during mentorship or video call
 * @route POST /api/mentorship/:id/report
 * @access Authenticated
 */
export async function reportMentorship(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const { reason, details } = req.body;

        if (!reason || !details) {
            return res.status(400).json({ success: false, message: "Reason and details are mandatory." });
        }

        const mentorship = await mentorshipModel.findById(id);
        if (!mentorship) {
            return res.status(404).json({ success: false, message: "Mentorship pairing not found." });
        }

        const isMentor = mentorship.mentorId.toString() === req.userId;
        const isMentee = mentorship.menteeId.toString() === req.userId;

        if (!isMentor && !isMentee) {
            return res.status(403).json({ success: false, message: "Forbidden: Not an active participant." });
        }

        const reportedUserId = isMentor ? mentorship.menteeId : mentorship.mentorId;

        const report = await mentorshipReportModel.create({
            pairingId: mentorship._id,
            reporterId: new mongoose.Types.ObjectId(req.userId),
            reportedUserId,
            reason: String(reason).trim(),
            details: String(details).trim(),
            status: "pending",
        });

        return res.status(201).json({
            success: true,
            message: "Report logged with institutional trust & safety team. Telemetry audit initiated.",
            reportId: report._id,
        });
    } catch (error) {
        console.error("reportMentorship error:", error);
        return res.status(500).json({ success: false, message: "Failed to submit report." });
    }
}

/**
 * @description Administrative audit endpoint to retrieve misconduct reports
 * @route GET /api/mentorship/reports
 * @access Authenticated (Institution / Admin)
 */
export async function getMentorshipReports(req: Request, res: Response) {
    try {
        const reports = await mentorshipReportModel
            .find()
            .sort({ createdAt: -1 })
            .populate("reporterId", "email")
            .populate("reportedUserId", "email")
            .populate("pairingId")
            .lean();

        return res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("getMentorshipReports error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch reports." });
    }
}

/**
 * @description Administrative action on a misconduct report
 * @route PATCH /api/mentorship/reports/:id/status
 * @access Authenticated (Institution / Admin)
 */
export async function updateMentorshipReportStatus(req: Request, res: Response) {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const { status, actionNotes } = req.body;

        if (!["investigating", "action_taken", "dismissed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        const report = await mentorshipReportModel.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        report.status = status;
        report.actionNotes = actionNotes || "";
        report.actionTakenBy = new mongoose.Types.ObjectId(req.userId);
        report.actionTakenAt = new Date();
        await report.save();

        // If action taken, revoke mentor status automatically
        if (status === "action_taken") {
            await profileModel.findOneAndUpdate(
                { userId: report.reportedUserId },
                { isMentor: false, isMentorVerified: false }
            );
            await mentorshipModel.findByIdAndUpdate(report.pairingId, {
                status: "cancelled",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Report status updated to ${status}.`,
            report,
        });
    } catch (error) {
        console.error("updateMentorshipReportStatus error:", error);
        return res.status(500).json({ success: false, message: "Failed to update report status." });
    }
}

/**
 * @description Generate AI-personalised mentor competency assessment questions via Groq
 * @route GET /api/mentorship/generate-assessment
 * @access Authenticated
 */
export async function generateMentorAssessment(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const profile = await profileModel.findOne({ userId: req.userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        // Allow query param override if applicant confirmed 4th year
        const queryYear = typeof req.query.academicYear === "string" ? req.query.academicYear.trim() : "";
        if (queryYear === "4th Year" || queryYear === "Alumni") {
            profile.academicYear = queryYear;
        }

        const alumniInfo = resolveAlumniStatus(profile);
        const isEligibleYear =
            profile.accountType === "faculty" ||
            alumniInfo.isAlumni ||
            alumniInfo.academicYear === "4th Year" ||
            profile.academicYear === "4th Year";

        if (!isEligibleYear) {
            return res.status(403).json({
                success: false,
                message: `Peer mentorship is reserved for senior 4th-year students and alumni. Your academic profile is currently registered as "${alumniInfo.academicYear}".`,
                academicYear: alumniInfo.academicYear,
            });
        }

        const bio = typeof req.query.bio === "string" ? req.query.bio.trim().slice(0, 500) : "";
        const topics = typeof req.query.topics === "string" ? req.query.topics.trim().slice(0, 300) : "";

        const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ success: true, questions: FALLBACK_ASSESSMENT_QUESTIONS, source: "fallback" });
        }

        const contextClause =
            bio || topics
                ? `The applicant's advising bio is: "${bio}". Their declared advisory topics are: "${topics}". Where relevant, frame scenarios around these specific domains (e.g. if topics include 'Distributed Systems', create a scenario where they advise on a distributed systems architecture problem).`
                : "Use general software engineering and academic mentorship scenarios.";

        const prompt = `You are a senior mentorship quality auditor for PortalAcademia — an academic platform where senior students mentor juniors on technical skills, career paths, and research.

Generate EXACTLY 5 scenario-based assessment questions to evaluate whether a mentor candidate demonstrates the correct pedagogical approach, academic integrity, and professional conduct expected of a verified PortalAcademia mentor.

${contextClause}

Return ONLY a valid JSON array with exactly 5 question objects. Each object must have these exact fields:
- "id": integer 1–5
- "category": string — short name of the competency being tested (e.g. "Academic Integrity", "Technical Guidance", "Session Conduct", "Platform Safety", "Growth Mindset")
- "scenario": string — a realistic 2–3 sentence mentoring situation the candidate must respond to
- "options": array of exactly 4 objects, each with "id" (one of "a","b","c","d") and "text" (1–2 sentence option text)
- "correctAnswer": string — must be one of "a", "b", "c", "d"
- "explanation": string — 1–2 sentence rationale for why the correct answer is right

Rules:
1. Exactly one option must be clearly and unambiguously correct (the ethical, pedagogically sound choice for a responsible senior peer mentor).
2. The other three options must represent plausible but incorrect mentorship behaviours (e.g. doing the work for the mentee, being overly harsh, enabling academic dishonesty, soliciting payment).
3. Scenarios must be grounded in realistic academic/technical mentorship situations.
4. Do NOT use the word "correct" anywhere in the option texts.
5. Return ONLY the raw JSON array — no markdown fences, no extra commentary.`;

        // Active candidate models on Groq
        const groqCandidateModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];

        for (const candidateModel of groqCandidateModels) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: candidateModel,
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.5,
                        max_tokens: 2400,
                    }),
                });

                if (response.ok) {
                    const data = (await response.json()) as any;
                    const raw = data.choices?.[0]?.message?.content?.trim() || "";
                    // Robust regex extraction for JSON array
                    const match = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
                    const jsonToParse = match
                        ? match[0]
                        : raw
                              .replace(/^```json\s*/i, "")
                              .replace(/^```\s*/i, "")
                              .replace(/\s*```$/i, "")
                              .trim();

                    const parsed: AssessmentQuestion[] = JSON.parse(jsonToParse);
                    if (
                        Array.isArray(parsed) &&
                        parsed.length === 5 &&
                        parsed.every(
                            (q) =>
                                typeof q.id === "number" &&
                                typeof q.scenario === "string" &&
                                Array.isArray(q.options) &&
                                q.options.length === 4 &&
                                typeof q.correctAnswer === "string"
                        )
                    ) {
                        return res.status(200).json({ success: true, questions: parsed, source: "ai" });
                    }
                } else {
                    const errText = await response.text();
                    console.warn(`generateMentorAssessment: Groq ${candidateModel} returned HTTP ${response.status}:`, errText);
                }
            } catch (err) {
                console.warn(`generateMentorAssessment: Groq ${candidateModel} call failed:`, err);
            }
        }

        return res.status(200).json({ success: true, questions: FALLBACK_ASSESSMENT_QUESTIONS, source: "fallback" });
    } catch (error) {
        console.error("generateMentorAssessment error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate assessment questions." });
    }
}
