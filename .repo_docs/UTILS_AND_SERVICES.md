# Utilities & Services Index — PortalAcademia

> Maps pure helper functions, client utilities, vector matching algorithms, server integrations, and middleware interceptors.

---

## 1. Client Utilities

### `cn`
- **Signature:** `cn(...inputs: ClassValue[]): string`
- **Source File:** [client/src/lib/utils.ts](file:///client/src/lib/utils.ts)
- **Operation:** Combines class lists with `clsx` and resolves Tailwind CSS rule collisions deterministically via `twMerge`.
- **Edge Cases Handled:** Null/undefined inputs, empty strings, conditional booleans, conflicting Tailwind classes (e.g. `px-2 px-4` -> `px-4`).

---

### `getSkillIcon`
- **Signature:** `getSkillIcon(skillName: string): SkillIconData | null`
- **Source File:** [client/src/lib/skillIcons.ts](file:///client/src/lib/skillIcons.ts)
- **Operation:** Resolves user-entered skill strings to official Simple Icons SVG path and brand hex color using aliases (e.g., `"py"` -> `"python"`, `"k8s"` -> `"kubernetes"`, `"cpp"` -> `"cplusplus"`).
- **Edge Cases Handled:** Empty string returns `null`, case-insensitivity, stripped punctuation fallback (`c++` -> `cplusplus`), multi-word prefixes.

---

### `searchSkillSuggestions`
- **Signature:** `searchSkillSuggestions(query: string, limit?: number): SkillIconData[]`
- **Source File:** [client/src/lib/skillIcons.ts](file:///client/src/lib/skillIcons.ts)
- **Operation:** Searches the Simple Icons registry for typeahead autocomplete. If `query` is empty, returns curated list of top 10 foundational tech stacks (Python, Java, C++, JavaScript, TypeScript, React, Node.js, Docker, Rust, Go).
- **Edge Cases Handled:** Returns empty-query defaults; deduplicates via `seenSlugs: Set<string>`; prioritizes alias matches before fuzzy title matches.

---

## 2. Server Configuration Singletons

### `connectDB`
- **Signature:** `connectDB(): void`
- **Source File:** [server/config/connectDB.ts](file:///server/config/connectDB.ts)
- **Operation:** Establishes connection to MongoDB Atlas or local MongoDB instance using Mongoose.
- **Edge Cases Handled:** Catches connection errors and logs diagnostics to console without crashing Node.js runtime.

---

### `getCache`
- **Signature:** `async getCache<T = any>(key: string): Promise<T | null>`
- **Source File:** [server/config/redisClient.ts](file:///server/config/redisClient.ts)
- **Operation:** Reads JSON-deserialized value from Redis. If Redis is unavailable or unconfigured, retrieves entry from the internal `memoryCache` Map.
- **Edge Cases Handled:** Evicts expired in-memory items on read; catches deserialization errors and returns `null`.

---

### `setCache`
- **Signature:** `async setCache(key: string, value: any, ttlSeconds?: number): Promise<void>`
- **Source File:** [server/config/redisClient.ts](file:///server/config/redisClient.ts)
- **Operation:** Serializes and writes a key-value pair to Redis with `EX` expiry. If Redis is disconnected, writes to `memoryCache` Map with calculated `expiresAt` timestamp.
- **Edge Cases Handled:** Handles Redis connection drops transparently; automatically cleans expired Map entries via background 5-minute interval timer (`unref()`).

---

### `deleteCache`
- **Signature:** `async deleteCache(keyOrPrefix: string): Promise<void>`
- **Source File:** [server/config/redisClient.ts](file:///server/config/redisClient.ts)
- **Operation:** Deletes a specific key or invalidates all keys matching a wildcard pattern (`prefix*`).
- **Edge Cases Handled:** Handles wildcard pattern matching across both Redis `redisClient.keys()` and local Map iteration.

---

### `isRedisAvailable`
- **Signature:** `isRedisAvailable(): boolean`
- **Source File:** [server/config/redisClient.ts](file:///server/config/redisClient.ts)
- **Operation:** Returns boolean indicating whether live Redis socket connection is established. Used by health endpoint `/api/health`.

---

### `uploadToCloudinary`
- **Signature:** `async uploadToCloudinary(buffer: Buffer, folder?: string, resourceType?: "image" | "auto" | "raw"): Promise<CloudinaryUploadResult>`
- **Source File:** [server/config/cloudinary.ts](file:///server/config/cloudinary.ts)
- **Operation:** Pipes a file buffer into Cloudinary's upload stream.
- **Edge Cases Handled:** If `CLOUDINARY_*` credentials are absent from `.env`, generates a secure inline Base64 data URL (`data:mime;base64,...`) and pseudo-ID so local development and file uploads function with zero external dependencies.

---

## 4. Middleware Handlers & Route Guards

### `isloggedIn`
- **Signature:** `isloggedIn(req: Request, res: Response, next: NextFunction): Response | void`
- **Source File:** [server/middleware/isloggedIn.ts](file:///server/middleware/isloggedIn.ts)
- **Operation:**
  1. Inspects `req.cookies.accesstoken`. If valid, verifies JWT and populates `req.userId`.
  2. If `accesstoken` is expired, falls back to `req.cookies.refreshtoken`. If valid, decodes user, generates a fresh `accesstoken`, sets it in `res.cookie` (15-minute sliding window), and attaches `req.userId`.
  3. If both tokens are missing or invalid, halts with `401 Unauthorized`.

---

### `authorizeRoles`
- **Signature:** `authorizeRoles(...allowedRoles: AccountType[])`
- **Source File:** [server/middleware/rbacMiddleware.ts](file:///server/middleware/rbacMiddleware.ts)
- **Operation:** Intercepts incoming requests, fetches `Profile` record matching `req.userId`, validates that `profile.accountType` is member of `allowedRoles`. Caches profile on `req.userProfile` to eliminate redundant database reads in downstream controllers.
- **Edge Cases Handled:**
  - Missing `req.userId`: Returns `401 Unauthorized`.
  - Profile not created yet: Returns `404 Not Found` instructing user to complete onboarding.
  - Mismatched role: Returns `403 Forbidden` with detailed role requirement message.

#### Pre-configured Guard Exports:
- `isStudent`: Enforces `accountType === "student"`
- `isFaculty`: Enforces `accountType === "faculty"`
- `isInstitution`: Enforces `accountType === "institution"`
- `isIndustry`: Enforces `accountType === "industry"`
- `isPublisher`: Allows `accountType` in `["industry", "institution"]`
- `isAcademic`: Allows `accountType` in `["student", "faculty", "institution"]`

---

## 5. Pure Scoring & Alumni Resolvers

### `calculateAtsScore`
- **Signature:** `calculateAtsScore(candidate: CandidateAtsInput, job: JobAtsInput): AtsScoreBreakdown`
- **Source Files:** [server/services/atsScoringService.ts](file:///server/services/atsScoringService.ts) and [client/src/utils/atsScoring.ts](file:///client/src/utils/atsScoring.ts)
- **Operation:**
  1. Computes Technical Skills Match (60% weight):
     - Verified assessment score $\in [70\%, 100\%]$ scaled between $0.70$ and $1.00$.
     - Unassessed verified institution credential fallback: $0.96$ weight.
     - Unassessed verified profile skill: $0.96$ weight.
     - Self-reported skill: $0.45$ weight.
     - Proves statistical separation $\ge 30\%$ between verified and unverified profiles.
  2. Computes Profile & Resume Completeness (40% weight):
     - Contact details (email, phone, location): up to 8 points.
     - Professional summary ($\ge 30$ chars): 6 points.
     - Education entries with institutions: 8 points.
     - Experience / Projects: 8 points.
     - Certifications: 5 points.
     - Skill inventory density: 5 points.
  3. Total ATS Score bounded strictly in $[0, 100]$ with zero artificial floors (empty candidate naturally scores $\le 5\%$).
- **Test Suite:** Automated parity & separation benchmark in `server/scripts/testAtsParity.ts`.

---

### `resolveAlumniStatus`
- **Signature:** `resolveAlumniStatus(profile: { education?: any[]; isAlumni?: boolean; graduationYear?: number }): AlumniResolution`
- **Source File:** [server/utils/alumniResolver.ts](file:///server/utils/alumniResolver.ts)
- **Operation:** Single authoritative resolver reconciling timeline-derived academic year with explicit database flags.
  - If `isAlumni === true`, returns `{ isAlumni: true, academicYear: "Alumni", graduationBatch }`.
  - If timeline has elapsed (end year $\le$ current year), resolves to `isAlumni: true`.
  - Otherwise resolves to active year (`1st Year`, `2nd Year`, etc.) and `isAlumni: false`.
- **Test Suite:** Automated scoping & gating tests in `server/scripts/testInstitutionScoping.ts`.

