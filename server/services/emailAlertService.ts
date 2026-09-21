import nodemailer from "nodemailer";
import profileModel from "../models/profileModel.js";
import userModel from "../models/userModel.js";
import type { IOpportunity } from "../models/opportunityModel.js";

/**
 * Dispatches skill-matched job/internship email alerts asynchronously
 * Capped at top 25 candidates per opportunity to prevent SMTP throttling
 */
export async function sendOpportunitySkillMatchAlerts(opportunity: IOpportunity) {
    // Execute asynchronously in background
    setImmediate(async () => {
        try {
            const senderEmail = process.env.EMAIL;
            const senderPassword = process.env.PASSWORD;

            if (!senderEmail || !senderPassword) {
                console.warn("[EmailAlertService] EMAIL and PASSWORD environment variables not set; skipping email alert dispatch.");
                return;
            }

            const requiredSkills = opportunity.requiredSkills || [];
            if (requiredSkills.length === 0) {
                return;
            }

            // Find student profiles that possess at least one of the required skills
            const matchingProfiles = await profileModel
                .find({
                    accountType: "student",
                    $or: [
                        { skills: { $in: requiredSkills } },
                        { verifiedSkills: { $in: requiredSkills } },
                    ],
                })
                .limit(25)
                .select("userId name skills")
                .lean();

            if (matchingProfiles.length === 0) {
                return;
            }

            const userIds = matchingProfiles.map((p) => p.userId);
            const users = await userModel
                .find({ _id: { $in: userIds } })
                .select("email")
                .lean();

            const userEmailMap = new Map<string, string>();
            users.forEach((u) => userEmailMap.set(u._id.toString(), u.email));

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: senderEmail,
                    pass: senderPassword,
                },
            });

            const frontendBase = process.env.FRONTEND_URL?.replace(/\/+$/, "") || "http://localhost:5173";
            const opportunityUrl = `${frontendBase}/dashboard/student?view=opportunities&id=${opportunity._id}`;

            for (const profile of matchingProfiles) {
                const recipientEmail = userEmailMap.get(profile.userId.toString());
                if (!recipientEmail) continue;

                // Calculate matched skills
                const matched = (profile.skills || []).filter((s) =>
                    requiredSkills.some((req) => req.toLowerCase() === s.toLowerCase())
                );

                const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #ffffff;">
                    <div style="margin-bottom: 20px; border-bottom: 1px solid #f4f4f5; padding-bottom: 12px;">
                        <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #71717a;">PortalAcademia Verified Opportunity Alert</span>
                        <h2 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; color: #09090b;">${opportunity.title}</h2>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">${opportunity.organization} · ${opportunity.location} (${opportunity.mode})</p>
                    </div>

                    <p style="font-size: 13px; color: #27272a; line-height: 1.5;">
                        Hello <strong>${profile.name}</strong>, a new opportunity has been published that matches your verified technical skill profile.
                    </p>

                    <div style="background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 6px; padding: 14px; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a;">Matching Skills</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${matched.map((m) => `<span style="display: inline-block; background-color: #e4e4e7; color: #18181b; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: monospace; margin-right: 4px; margin-bottom: 4px;">${m}</span>`).join("")}
                        </div>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #52525b;"><strong>Stipend / Prize:</strong> ${opportunity.stipendOrPrize || "Not disclosed"}</p>
                    </div>

                    <div style="margin-top: 24px;">
                        <a href="${opportunityUrl}" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 6px;">
                            View Opportunity &amp; Apply →
                        </a>
                    </div>

                    <div style="margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 11px; color: #a1a1aa;">
                        You received this automated dispatch because your scholar profile has skill-matched telemetry enabled.
                    </div>
                </div>
                `;

                try {
                    await transporter.sendMail({
                        from: `"PortalAcademia Alerts" <${senderEmail}>`,
                        to: recipientEmail,
                        subject: `[New Opportunity] ${opportunity.title} at ${opportunity.organization}`,
                        html: htmlContent,
                    });
                } catch (sendErr) {
                    console.error(`[EmailAlertService] Failed sending to ${recipientEmail}:`, sendErr);
                }
            }
        } catch (error) {
            console.error("[EmailAlertService] Critical error in alert dispatch:", error);
        }
    });
}
