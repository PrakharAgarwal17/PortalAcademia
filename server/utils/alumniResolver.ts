/**
 * @description Single authoritative helper for resolving academic year and alumni status.
 * Reconciles stored isAlumni flag with education timeline to prevent derived-vs-stored drift.
 */

export interface AlumniResolution {
    isAlumni: boolean;
    academicYear: string;
    graduationBatch: string;
    graduationYear: number;
}

export function computeAcademicYear(educationList?: any[]): { academicYear: string; graduationBatch: string; graduationYear: number } {
    const currentYear = new Date().getFullYear();

    if (!educationList || educationList.length === 0) {
        return { academicYear: "3rd Year", graduationBatch: "Class of 2026", graduationYear: 2026 };
    }

    const primaryEdu = educationList[0];
    const timeline = (primaryEdu?.timeline || primaryEdu?.description || "").toLowerCase();

    const matchYear = timeline.match(/20\d{2}/g);
    if (matchYear && matchYear.length > 0) {
        const endYear = parseInt(matchYear[matchYear.length - 1], 10);
        const diff = endYear - currentYear;

        // If endYear is in the past or current year graduation has elapsed -> Alumni
        if (diff <= 0) {
            return {
                academicYear: "Alumni",
                graduationBatch: `Class of ${endYear}`,
                graduationYear: endYear,
            };
        }
        if (diff === 1) {
            return {
                academicYear: "3rd Year",
                graduationBatch: `Class of ${endYear}`,
                graduationYear: endYear,
            };
        }
        if (diff === 2) {
            return {
                academicYear: "2nd Year",
                graduationBatch: `Class of ${endYear}`,
                graduationYear: endYear,
            };
        }
        return {
            academicYear: "1st Year",
            graduationBatch: `Class of ${endYear}`,
            graduationYear: endYear,
        };
    }

    if (timeline.includes("1st") || timeline.includes("first")) {
        return { academicYear: "1st Year", graduationBatch: `Class of ${currentYear + 3}`, graduationYear: currentYear + 3 };
    }
    if (timeline.includes("2nd") || timeline.includes("second")) {
        return { academicYear: "2nd Year", graduationBatch: `Class of ${currentYear + 2}`, graduationYear: currentYear + 2 };
    }
    if (timeline.includes("3rd") || timeline.includes("third")) {
        return { academicYear: "3rd Year", graduationBatch: `Class of ${currentYear + 1}`, graduationYear: currentYear + 1 };
    }
    if (timeline.includes("4th") || timeline.includes("final")) {
        return { academicYear: "4th Year", graduationBatch: `Class of ${currentYear}`, graduationYear: currentYear };
    }
    if (timeline.includes("alumni") || timeline.includes("graduated")) {
        return { academicYear: "Alumni", graduationBatch: `Class of ${currentYear - 1}`, graduationYear: currentYear - 1 };
    }

    return { academicYear: "3rd Year", graduationBatch: "Class of 2026", graduationYear: 2026 };
}

/**
 * Authoritative single resolution of whether a profile is an alumnus.
 * Reconciles stored isAlumni flag with education timeline.
 */
export function resolveAlumniStatus(profile: {
    education?: any[];
    isAlumni?: boolean;
    graduationYear?: number;
}): AlumniResolution {
    const computed = computeAcademicYear(profile?.education);

    // If explicitly marked isAlumni === true, respect it
    if (profile?.isAlumni === true) {
        return {
            isAlumni: true,
            academicYear: "Alumni",
            graduationBatch: profile.graduationYear ? `Class of ${profile.graduationYear}` : computed.graduationBatch,
            graduationYear: profile.graduationYear || computed.graduationYear,
        };
    }

    // Otherwise, derive from education timeline calculation
    const isAlumni = computed.academicYear === "Alumni";
    return {
        isAlumni,
        academicYear: computed.academicYear,
        graduationBatch: computed.graduationBatch,
        graduationYear: computed.graduationYear,
    };
}
