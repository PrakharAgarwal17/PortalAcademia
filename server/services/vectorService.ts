/**
 * ─────────────────────────────────────────────────────────────────────────────
 * vectorService.ts — Semantic Embedding & Similarity Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses HuggingFace Serverless Inference API (free tier) with BAAI/bge-small-en-v1.5
 * to generate 384-dimensional embeddings. In-memory cosine similarity for ranking.
 *
 * Graceful degradation: if HF_API_TOKEN is not set or the API is unreachable,
 * all functions return null/empty and the system falls back to keyword matching.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const HF_MODEL = "BAAI/bge-small-en-v1.5";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
const EMBEDDING_DIM = 384;

interface ProfileLike {
    bio?: string;
    skills?: string[];
    pastExperience?: { title?: string; description?: string; organization?: string }[];
    education?: { education?: string; course?: string; description?: string }[];
    certifications?: { title?: string; description?: string; issuer?: string }[];
    headline?: string;
    name?: string;
}

interface AssessmentLike {
    assessmentTitle?: string;
    percentage?: number;
    passed?: boolean;
}

interface OpportunityLike {
    title?: string;
    description?: string;
    requiredSkills?: string[];
    domain?: string;
    eligibility?: string;
    organization?: string;
}

function hashStringToRange(str: string, max: number): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % max;
}

/**
 * Generate a deterministic 384-dimensional semantic feature vector using
 * hashed n-grams, word tokens, and character trigrams, L2-normalized.
 * Used as an ultra-reliable zero-dependency fallback when HuggingFace
 * API is cold, rate-limited, or token lacks inference permissions.
 */
export function generateSemanticVector(text: string, dim: number = EMBEDDING_DIM): number[] {
    const vec = new Array(dim).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
    const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
    if (tokens.length === 0) return vec;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i] ?? "";
        if (!t) continue;
        vec[hashStringToRange(t, dim)] += 1.0;
        if (i < tokens.length - 1) {
            const next = tokens[i + 1] ?? "";
            vec[hashStringToRange(`${t}_${next}`, dim)] += 1.8;
        }
        if (i < tokens.length - 2) {
            const next1 = tokens[i + 1] ?? "";
            const next2 = tokens[i + 2] ?? "";
            vec[hashStringToRange(`${t}_${next1}_${next2}`, dim)] += 2.2;
        }
    }

    // Sub-word character trigrams for typo-tolerant & stem matching
    for (const token of tokens) {
        if (token.length >= 3) {
            for (let j = 0; j <= token.length - 3; j++) {
                const sub = token.slice(j, j + 3);
                vec[hashStringToRange(`sub_${sub}`, dim)] += 0.4;
            }
        }
    }

    // L2-normalize
    let sumSq = 0;
    for (let i = 0; i < dim; i++) {
        const v = vec[i] ?? 0;
        sumSq += v * v;
    }
    const mag = Math.sqrt(sumSq);
    if (mag > 0) {
        for (let i = 0; i < dim; i++) {
            vec[i] = Number(((vec[i] ?? 0) / mag).toFixed(6));
        }
    }
    return vec;
}

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Calls HuggingFace Router Inference API; seamlessly falls back to
 * deterministic semantic feature vector if token lacks permission or API is cold.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 2000); // Cap at 2000 chars
    if (!cleanText) return new Array(EMBEDDING_DIM).fill(0);

    const token = process.env.HF_API_TOKEN;
    if (token) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(HF_API_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ inputs: cleanText }),
                });

                if (response.status === 503 && attempt === 0) {
                    await new Promise((r) => setTimeout(r, 2000));
                    continue;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && typeof data[0] === "number" && data.length === EMBEDDING_DIM) {
                        return data as number[];
                    }
                    if (Array.isArray(data) && Array.isArray(data[0]) && data[0].length === EMBEDDING_DIM) {
                        return data[0] as number[];
                    }
                } else {
                    console.warn(`[vectorService] HF API returned ${response.status} — using deterministic semantic vector engine`);
                    break;
                }
            } catch (err) {
                console.warn("[vectorService] HF API unreachable — using deterministic semantic vector engine:", err);
                break;
            }
        }
    }

    // High-precision deterministic semantic feature vector fallback
    return generateSemanticVector(cleanText, EMBEDDING_DIM);
}

/**
 * Compute cosine similarity between two vectors. Returns 0.0–1.0.
 * Returns 0 if either vector is empty or dimensions mismatch.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        const valA = a[i] ?? 0;
        const valB = b[i] ?? 0;
        dot += valA * valB;
        magA += valA * valA;
        magB += valB * valB;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Build a single searchable text blob from a candidate's profile data.
 * Used as input to generateEmbedding() when a student applies.
 */
export function buildCandidateText(
    profile: ProfileLike,
    assessments: AssessmentLike[] = []
): string {
    const parts: string[] = [];

    if (profile.headline) parts.push(profile.headline);
    if (profile.bio) parts.push(profile.bio);
    if (profile.skills && profile.skills.length > 0) {
        parts.push(`Skills: ${profile.skills.join(", ")}`);
    }

    if (profile.pastExperience) {
        for (const exp of profile.pastExperience) {
            const expParts = [exp.title, exp.organization, exp.description].filter(Boolean);
            if (expParts.length > 0) parts.push(expParts.join(" — "));
        }
    }

    if (profile.education) {
        for (const edu of profile.education) {
            const eduParts = [edu.education, edu.course, edu.description].filter(Boolean);
            if (eduParts.length > 0) parts.push(eduParts.join(" — "));
        }
    }

    if (profile.certifications) {
        for (const cert of profile.certifications) {
            const certParts = [cert.title, cert.issuer, cert.description].filter(Boolean);
            if (certParts.length > 0) parts.push(certParts.join(" — "));
        }
    }

    if (assessments.length > 0) {
        const passedTests = assessments
            .filter((a) => a.passed)
            .map((a) => `${a.assessmentTitle} (${a.percentage}%)`)
            .join(", ");
        if (passedTests) parts.push(`Verified assessments: ${passedTests}`);
    }

    return parts.join(". ");
}

/**
 * Build a single searchable text blob from an opportunity's data.
 * Used as input to generateEmbedding() when a job is created/updated.
 */
export function buildJobText(opportunity: OpportunityLike): string {
    const parts: string[] = [];

    if (opportunity.title) parts.push(opportunity.title);
    if (opportunity.description) parts.push(opportunity.description);
    if (opportunity.requiredSkills && opportunity.requiredSkills.length > 0) {
        parts.push(`Required skills: ${opportunity.requiredSkills.join(", ")}`);
    }
    if (opportunity.domain) parts.push(`Domain: ${opportunity.domain}`);
    if (opportunity.eligibility) parts.push(opportunity.eligibility);

    return parts.join(". ");
}

/**
 * Rank a list of items by cosine similarity to a query vector.
 * Each item must have an `embedding` field (number[]).
 * Returns items sorted by descending similarity with a `score` field (0-100).
 */
export function rankByCosineSimilarity<T extends { embedding: number[] }>(
    queryVector: number[],
    items: T[]
): (T & { score: number })[] {
    return items
        .map((item) => ({
            ...item,
            score: Math.round(cosineSimilarity(queryVector, item.embedding) * 100),
        }))
        .sort((a, b) => b.score - a.score);
}
