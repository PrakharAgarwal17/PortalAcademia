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
