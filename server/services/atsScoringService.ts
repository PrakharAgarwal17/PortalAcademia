/**
 * ATS Scoring Service — Single Authoritative Source of Truth
 * 
 * Formula:
 * - Total Score = min(100, max(0, round(0.60 * SkillScore + 0.40 * CompletenessScore)))
 * - Skill Weighting:
 *     - Verified Skill with Assessment: 0.70 + 0.30 * (avgScore / 100) -> 0.70 to 1.00
 *     - Institution-Verified Credential (no assessment score): 0.96 (calibrated default for 85%)
 *     - Explicitly Verified Profile Skill: 0.96
 *     - Self-Reported Skill: 0.45
 *     - Unmatched: 0.00
 * - Completeness Breakdown (100 points total):
 *     - Contact Info: 20 pts (Name: 5, Email: 5, Phone: 5, Location: 5)
 *     - Professional Summary: 15 pts
 *     - Education: 15 pts
 *     - Work Experience / Projects: 15 pts
 *     - Certifications / Credentials: 20 pts (Verified = 20, Self-Reported = 10)
 *     - Section Structure: 15 pts
 */

export interface CandidateAtsInput {
    fullName?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    location?: string | undefined;
    summary?: string | undefined;
    skills?: string[] | undefined;
    verifiedSkills?: string[] | undefined;
    assessmentScores?: Array<{ skill: string; score: number }> | undefined;
    institutionCredentials?: Array<{ title: string; isVerified: boolean }> | undefined;
    education?: Array<{ education?: string | undefined; course?: string | undefined; institution?: string | undefined; timeline?: string | undefined }> | undefined;
    experience?: Array<{ title?: string | undefined; organization?: string | undefined; description?: string | undefined; timeline?: string | undefined }> | undefined;
    certifications?: Array<{ title?: string | undefined; issuer?: string | undefined; isVerified?: boolean | undefined; timeline?: string | undefined }> | undefined;
}

export interface JobAtsInput {
    requiredSkills: string[];
    title?: string | undefined;
    category?: string | undefined;
}

export interface AtsScoreBreakdown {
    totalScore: number;
    skillScore: number;
    completenessScore: number;
    matchedSkills: Array<{
        skill: string;
        weight: number;
        source: "assessment" | "credential" | "verified_profile" | "self_reported" | "unmatched";
        score?: number;
    }>;
    missingSkills: string[];
    completenessDetails: {
        contact: number;
        summary: number;
        education: number;
        experience: number;
        certifications: number;
        structure: number;
    };
}

export function calculateAtsScore(
    candidate: CandidateAtsInput,
    job: JobAtsInput
): AtsScoreBreakdown {
    const rawRequired = (job.requiredSkills || []).map((s) => s.trim().toLowerCase()).filter(Boolean);
    // Deduplicate required skills
    const requiredSkills = Array.from(new Set(rawRequired));

    const candidateSkills = (candidate.skills || []).map((s) => s.trim().toLowerCase());
    const verifiedSkills = new Set((candidate.verifiedSkills || []).map((s) => s.trim().toLowerCase()));

    const assessmentMap = new Map<string, number>();
    (candidate.assessmentScores || []).forEach((a) => {
        const k = a.skill.trim().toLowerCase();
        // If multiple attempts, keep highest or last
        const prev = assessmentMap.get(k) ?? 0;
        assessmentMap.set(k, Math.max(prev, a.score));
    });

    const verifiedCredSet = new Set<string>();
    (candidate.institutionCredentials || []).forEach((c) => {
        if (c.isVerified) {
            verifiedCredSet.add(c.title.trim().toLowerCase());
        }
    });

    const matchedSkills: AtsScoreBreakdown["matchedSkills"] = [];
    const missingSkills: string[] = [];
    let totalSkillWeight = 0;

    for (const reqSkill of requiredSkills) {
        // 1. Check for assessment match
        let foundAssessmentScore: number | undefined = undefined;
        for (const [aSkill, aScore] of assessmentMap.entries()) {
            if (aSkill === reqSkill || aSkill.includes(reqSkill) || reqSkill.includes(aSkill)) {
                foundAssessmentScore = aScore;
                break;
            }
        }

        if (foundAssessmentScore !== undefined) {
            const clampedScore = Math.min(100, Math.max(0, foundAssessmentScore));
            const weight = +(0.70 + 0.30 * (clampedScore / 100)).toFixed(4);
            totalSkillWeight += weight;
            matchedSkills.push({
                skill: reqSkill,
                weight,
                source: "assessment",
                score: clampedScore,
            });
            continue;
        }

        // 2. Check for institution-verified credential
        let hasVerifiedCred = false;
        for (const credTitle of verifiedCredSet) {
            if (credTitle.includes(reqSkill) || reqSkill.includes(credTitle)) {
                hasVerifiedCred = true;
                break;
            }
        }

        if (hasVerifiedCred) {
            const weight = 0.96; // Calibrated default for 85% passed score
            totalSkillWeight += weight;
            matchedSkills.push({
                skill: reqSkill,
                weight,
                source: "credential",
                score: 85,
            });
            continue;
        }

        // 3. Check for explicitly verified profile skill
        let isProfileVerified = false;
        for (const vSkill of verifiedSkills) {
            if (vSkill === reqSkill || vSkill.includes(reqSkill) || reqSkill.includes(vSkill)) {
                isProfileVerified = true;
                break;
            }
        }

        if (isProfileVerified) {
            const weight = 0.96;
            totalSkillWeight += weight;
            matchedSkills.push({
                skill: reqSkill,
                weight,
                source: "verified_profile",
                score: 85,
            });
            continue;
        }

        // 4. Check for self-reported skill
        let hasSelfReported = false;
        for (const cSkill of candidateSkills) {
            if (cSkill === reqSkill || cSkill.includes(reqSkill) || reqSkill.includes(cSkill)) {
                hasSelfReported = true;
                break;
            }
        }

        if (hasSelfReported) {
            const weight = 0.45; // Meaningful separation from verified skills
            totalSkillWeight += weight;
            matchedSkills.push({
                skill: reqSkill,
                weight,
                source: "self_reported",
            });
            continue;
        }

        // 5. Unmatched
        missingSkills.push(reqSkill);
        matchedSkills.push({
            skill: reqSkill,
            weight: 0.0,
            source: "unmatched",
        });
    }

    // Calculate raw skill score (0 - 100)
    let rawSkillScore = 0;
    if (requiredSkills.length > 0) {
        rawSkillScore = Math.min(100, Math.max(0, (totalSkillWeight / requiredSkills.length) * 100));
    } else {
        // If no skills are specifically required, base on applicant's skill inventory
        const hasAnyVerified = verifiedSkills.size > 0 || assessmentMap.size > 0 || verifiedCredSet.size > 0;
        rawSkillScore = hasAnyVerified ? 85 : 70;
    }

    // Completeness Score Calculation (100 points total)
    let contactPts = 0;
    if (candidate.fullName && candidate.fullName.trim().length >= 2) contactPts += 5;
    if (candidate.email && candidate.email.includes("@")) contactPts += 5;
    if (candidate.phone && candidate.phone.trim().length >= 6) contactPts += 5;
    if (candidate.location && candidate.location.trim().length >= 2) contactPts += 5;

    let summaryPts = 0;
    const summaryLen = (candidate.summary || "").trim().length;
    if (summaryLen >= 30) {
        summaryPts = 15;
    } else if (summaryLen > 0) {
        summaryPts = 8;
    }

    let educationPts = 0;
    if (candidate.education && candidate.education.length > 0) {
        const hasValidEdu = candidate.education.some(
            (e) => (e.education && e.education.trim().length > 0) || (e.institution && e.institution.trim().length > 0)
        );
        if (hasValidEdu) educationPts = 15;
    }

    let experiencePts = 0;
    if (candidate.experience && candidate.experience.length > 0) {
        const hasValidExp = candidate.experience.some(
            (e) => (e.title && e.title.trim().length > 0) || (e.organization && e.organization.trim().length > 0)
        );
        if (hasValidExp) experiencePts = 15;
    }

    let certPts = 0;
    const hasVerifiedCert =
        (candidate.certifications || []).some((c) => c.isVerified) ||
        (candidate.institutionCredentials || []).some((c) => c.isVerified) ||
        assessmentMap.size > 0;
    const hasAnyCert = (candidate.certifications && candidate.certifications.length > 0) || hasVerifiedCert;

    if (hasVerifiedCert) {
        certPts = 20;
    } else if (hasAnyCert) {
        certPts = 10;
    }

    let structurePts = 0;
    let filledSections = 0;
    if (contactPts >= 10) filledSections += 1;
    if (summaryPts > 0) filledSections += 1;
    if (educationPts > 0) filledSections += 1;
    if (experiencePts > 0) filledSections += 1;
    if (candidateSkills.length > 0) filledSections += 1;

    if (filledSections >= 4) {
        structurePts = 15;
    } else if (filledSections === 3) {
        structurePts = 10;
    } else {
        structurePts = 5;
    }

    const completenessScore = contactPts + summaryPts + educationPts + experiencePts + certPts + structurePts;

    // Composite Final ATS Score
    const totalScore = Math.min(
        100,
        Math.max(0, Math.round(0.60 * rawSkillScore + 0.40 * completenessScore))
    );

    return {
        totalScore,
        skillScore: Math.round(rawSkillScore),
        completenessScore,
        matchedSkills,
        missingSkills,
        completenessDetails: {
            contact: contactPts,
            summary: summaryPts,
            education: educationPts,
            experience: experiencePts,
            certifications: certPts,
            structure: structurePts,
        },
    };
}
