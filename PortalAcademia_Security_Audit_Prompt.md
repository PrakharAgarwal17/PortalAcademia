# TASK: Full-Repository Security, Bug & Guardrail Audit — PortalAcademia

## MISSION
You are performing a comprehensive security and correctness audit of the PortalAcademia codebase (MERN-based: React 19 client, Express 5 + TypeScript server, MongoDB/Mongoose, Redis, Cloudinary, Passport/JWT auth, local vector embeddings via Transformers.js). This is a live SIH submission handling real student PII, institutional credentials, and industry recruiting data — treat findings with the severity that implies.

Do not fix everything blindly. **Audit first, report findings with severity + exact file/line references, then only apply fixes I explicitly approve** — except for trivial, unambiguous, zero-risk fixes (e.g., adding a missing null check), which you may apply directly and note.

---

## 1. AUTHENTICATION & SESSION SECURITY

Inspect: `server/controllers/authController.ts`, `server/config/Passport.ts`, `server/middleware/isloggedIn.ts`, `client/src/context/authSlice.ts`

- [ ] **JWT handling**: Confirm `JWT_SECRET` is never hardcoded/defaulted in code (only via `.env`). Check expiry is set and enforced — no non-expiring tokens.
- [ ] **Cookie flags**: Confirm the `token` cookie is set with `HttpOnly`, `Secure` (in production), and appropriate `SameSite`. Flag if `Secure` is missing or hardcoded false, which would allow the cookie over plain HTTP in prod.
- [ ] **Password storage**: Confirm bcrypt (or equivalent) hashing with adequate salt rounds (≥10) in `userModel.ts` / `authController.ts` — flag any plaintext comparison or weak hashing.
- [ ] **OTP flow**: Check OTP generation entropy (is it a secure random, not `Math.random()`), OTP expiry window, and whether OTPs are single-use (invalidated after one successful verification or after N failed attempts).
- [ ] **Brute-force protection**: Is there rate limiting or attempt-lockout on `/api/auth/login` and OTP verification endpoints? If none exists, flag as **HIGH** — this is a classic missing guardrail.
- [ ] **Google OAuth callback**: Confirm the callback validates `state` (CSRF protection) and doesn't trust client-supplied role/redirect params blindly.
- [ ] **Session fixation**: Confirm a new JWT/session is issued on login rather than reusing a pre-auth token.
- [ ] **`check-auth` endpoint**: Confirm it doesn't leak sensitive profile fields (password hash, internal flags) in its response payload.

---

## 2. AUTHORIZATION & ACCESS CONTROL (Broken Object-Level Auth)

Inspect: `server/middleware/rbacMiddleware.ts`, all controllers in `server/controllers/`

- [ ] **Horizontal privilege escalation (IDOR)**: For every route taking an `:id` param (e.g., `PUT /api/profile/credential/:id`, `GET /api/applications/:id`, `PUT /api/verification/approve/:credentialId`), confirm the handler checks that the resource actually belongs to (or is scoped to) the requesting user/institution — not just that *a* valid session exists. This is the single most common real-world vuln class; check every controller method individually.
- [ ] **Vertical privilege escalation**: Confirm `rbacMiddleware.ts`'s `isStudent`/`isFaculty`/`isInstitution`/`isIndustry` guards are actually applied on every route that needs them in each `routes/*.ts` file — not just present in the middleware file but unused/misapplied on the actual route definitions. Cross-check each route file against the middleware import list.
- [ ] **Institution scoping**: Confirm `verificationController.ts`'s pending-credentials queue only returns students affiliated with the requesting institution's ID — not all pending credentials platform-wide.
- [ ] **Industry scoping**: Confirm an Industry account can only view/edit/delete opportunities and applicant data tied to its own account — not other companies' postings or applicant pools.
- [ ] **Mass assignment**: Check controllers that accept a body object and pass it near-directly into `Model.create()` / `Model.findByIdAndUpdate()` — could a client inject `role: "industry"`, `isVerified: true`, or `credits: 99999` into a request body meant only to update `name`/`bio`? Flag any handler not using an explicit allow-list of fields.

---

## 3. NoSQL INJECTION & INPUT VALIDATION

Inspect: all controllers, especially any using `req.query`, `req.body` directly in Mongoose queries.

- [ ] Search for patterns like `Model.find(req.body)` or `Model.find({ field: req.query.x })` without sanitization — a client could inject Mongo operators (`{"$gt": ""}`, `{"$ne": null}`) to bypass filters or auth checks.
- [ ] Confirm request bodies are validated against a schema (Zod/Joi/express-validator or manual checks) before touching the database — not just TypeScript compile-time types, which offer zero runtime protection.
- [ ] Check `opportunityController.ts` search/filter endpoints specifically, since these likely accept the most complex user-supplied query shapes.
- [ ] Confirm string inputs rendered anywhere back to a client (profile bios, opportunity descriptions) are not vulnerable to stored XSS if ever rendered as raw HTML on the client (check for `dangerouslySetInnerHTML` usage in `client/src`).

---

## 4. FILE UPLOAD SECURITY

Inspect: `server/config/multer.ts`, `server/middleware/multer.ts`, `server/config/cloudinary.ts`, any upload routes.

- [ ] **File type validation**: Confirm uploads are validated by actual content/MIME sniffing, not just trusting the client-supplied `Content-Type` header or file extension.
- [ ] **File size limits**: Confirm Multer has a `limits.fileSize` set — unbounded uploads are a DoS vector, especially with an Atlas free-tier / storage-conscious deployment.
- [ ] **Path traversal**: If any local disk storage is used before Cloudinary upload, confirm filenames are sanitized/regenerated (not using the raw client-supplied filename) to prevent path traversal or overwrite attacks.
- [ ] **Unrestricted upload endpoint**: Confirm the general `/api/upload` route requires authentication and is not open to unauthenticated abuse (e.g., using your Cloudinary quota for arbitrary file hosting).

---

## 5. RATE LIMITING & ABUSE GUARDRAILS

Inspect: `server/app.ts`, `server/config/redisClient.ts`, any middleware pipeline setup.

- [ ] Confirm rate limiting exists (e.g., `express-rate-limit` or Redis-backed) on: login, OTP request/verify, AI Guide chat endpoint (`aiController.ts` — LLM calls cost money and are abusable), and opportunity application submission (to prevent application-spam).
- [ ] Confirm the Redis in-memory fallback (mentioned in ARCHITECTURE.md) doesn't silently disable rate limiting when Redis is unreachable — an attacker could potentially force a Redis outage (or it could just fail in prod) and lose all abuse protection without anyone noticing. Flag if there's no logging/alerting on fallback activation.
- [ ] Check the AI chat log cleanup (`AiLog` TTL + 500-document count threshold cleaner mentioned in ARCHITECTURE.md) — confirm the count-threshold cleaner actually runs reliably (cron/scheduled job vs. only running opportunistically on request) and can't be bypassed by rapid-fire requests that outpace cleanup.

---

## 6. DATA EXPOSURE & OVER-FETCHING

Inspect: all controllers using `.populate()`, and every response payload shape.

- [ ] Check every Mongoose `.select()` / `.populate()` call — confirm password hashes, OTP secrets, and internal admin flags are explicitly excluded (`.select('-password -otp')`) rather than relying on omission by convention.
- [ ] Confirm `userModel.ts` has `password`/OTP fields marked `select: false` at the schema level as a defense-in-depth measure, not just excluded ad hoc per-query.
- [ ] Check `profileController.ts` and any public-facing profile/directory endpoints (`InstitutionDirectoryPage.tsx`'s backing API) — confirm private contact info isn't exposed to unauthenticated or cross-role viewers who shouldn't see it.
- [ ] Confirm error responses (especially from Mongoose/DB errors) don't leak stack traces, internal file paths, or query structure to the client in production mode.

---

## 7. BUSINESS LOGIC INTEGRITY

Inspect: `applicationController.ts`, `opportunityController.ts`, `verificationController.ts`, `assessmentController.ts`

- [ ] **Duplicate applications**: Can a student submit multiple applications to the same opportunity by replaying the request? Confirm a unique constraint or existence check on `(studentId, opportunityId)`.
- [ ] **Application status tampering**: Confirm only the owning Industry account (or Institution, where applicable) can transition an application's status — a student shouldn't be able to PATCH their own application to "Accepted."
- [ ] **Verification integrity**: Confirm a credential, once verified (`isVerified: true`, `verifiedBy: institutionId`), cannot be silently re-edited by the student afterward without resetting verification status — otherwise a student could get a credential verified, then edit the underlying content post-approval.
- [ ] **Assessment integrity**: Confirm assessment questions/answers aren't fetchable by the client before or during a test in a way that exposes correct answers (check `assessmentController.ts` response shape sent when a test starts vs. when it's submitted/graded).
- [ ] **Race conditions**: For any "apply" or "verify" action with side effects (counters, status flags), confirm atomic updates (`findOneAndUpdate` with conditions) rather than read-then-write patterns vulnerable to race conditions under concurrent requests.
- [ ] **Featured-opportunity scoping** *(known issue from prior discussion — re-verify if already addressed)*: Confirm "Featured" status is scoped per-college and not a global flag on the opportunity.

---

## 8. CORS, HEADERS & TRANSPORT SECURITY

Inspect: `server/app.ts`

- [ ] Confirm CORS `origin` is the exact whitelisted `FRONTEND_URL`, not a wildcard `*` combined with `credentials: true` (this combination is invalid/dangerous and browsers will reject or it indicates a misconfiguration).
- [ ] Check for security headers — is `helmet` (or equivalent) in use? Flag if missing (no `X-Content-Type-Options`, `X-Frame-Options`, CSP, etc.).
- [ ] Confirm production deployment enforces HTTPS (cookies with `Secure` flag are meaningless without it).

---

## 9. SECRETS & ENVIRONMENT HYGIENE

- [ ] Grep the entire repo (including git history if accessible) for hardcoded secrets: API keys, `JWT_SECRET`, `MONGO_URI` with embedded credentials, Cloudinary/Groq keys. Flag any found — even in comments or seed scripts.
- [ ] Confirm `server/scripts/seedDatabase.ts` doesn't insert accounts with weak/default passwords that could persist into a production database if accidentally run there.
- [ ] Confirm `.env` files are properly gitignored and not committed.
- [ ] Check whether `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, etc. are ever exposed to the client bundle (e.g., accidentally prefixed with `VITE_` when they shouldn't be — anything with a `VITE_` prefix ships to the browser).

---

## 10. AI GUIDE / LLM-SPECIFIC RISKS

Inspect: `aiController.ts`, `aiLogModel.ts`

- [ ] **Prompt injection**: Confirm user-supplied chat input can't manipulate the system prompt or exfiltrate other users' profile context if profile data is injected dynamically per the ARCHITECTURE.md description ("dynamic profile context injection").
- [ ] **Data leakage across sessions**: Confirm one user's AI Guide conversation/context can never be returned to a different user (check `aiLogModel.ts` queries are always scoped by the authenticated `userId`).
- [ ] **Cost/abuse control**: Confirm there's a per-user message limit or cooldown on the Groq-backed endpoint, since LLM calls have direct cost implications and no limit was mentioned in the architecture doc.
- [ ] Confirm the TTL index (7-day expiry) mentioned in ARCHITECTURE.md is actually present on `aiLogModel.ts` in the schema definition, not just documented as intended.

---

## 11. VECTOR SEARCH / EMBEDDING INTEGRITY

Inspect: `server/services/vectorService.ts`, `opportunityModel.ts`

- [ ] Confirm embeddings are regenerated when an opportunity's `title`/`description`/`requiredSkills` are edited — a stale `jobEmbedding` after an edit would silently degrade match quality with no error surfaced.
- [ ] Confirm the embedding generation step has a failure fallback (what happens if Transformers.js fails to load the model or times out — does opportunity creation fail entirely, or silently save with no embedding and get lost from search forever?).

---

## 12. DEPENDENCY & CONFIG AUDIT

- [ ] Run/check for known-vulnerable dependencies (`npm audit` equivalent) across both `client/package.json` and `server/package.json`. Report any high/critical findings.
- [ ] Confirm the TypeScript version discrepancy noted in ARCHITECTURE.md (client `~6.0.2` vs server `^7.0.2`) doesn't cause type-checking or build inconsistencies — flag if this looks like a typo rather than intentional.
- [ ] Check `docker-compose.yml` for any exposed ports/default credentials (e.g., default MongoDB root password) that would be dangerous if this compose file were ever used as-is in a non-local environment.

---

## 13. OUTPUT FORMAT FOR THIS AUDIT

Produce a report (not silent fixes) structured as:

```
## Finding [N]: <short title>
- **Severity:** Critical / High / Medium / Low
- **File(s):** exact path(s)
- **Description:** what's wrong and why it matters
- **Exploit scenario:** concrete example of how this could be abused
- **Recommended fix:** specific, actionable
- **Status:** Flagged only / Auto-fixed (trivial)
```

Group findings by section (1–12 above). At the end, provide a one-paragraph executive summary ranking the top 5 most urgent issues regardless of category.

If `.repo_docs/` exists, do not modify it as part of this audit pass — this is a read-and-report task, not a doc-sync task. Only update `.repo_docs/` afterward, in a separate pass, once fixes are actually applied.
