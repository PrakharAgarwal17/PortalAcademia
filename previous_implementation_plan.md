# Previous Implementation Plan (Initial Version before Revisions)

> **Note**: This is the initial version of the implementation plan drafted prior to incorporating your feedback regarding:
> 1. Mentor being free (4th-year student) and only mentee requiring Premium.
> 2. Real-time community channels powered by Socket.IO for students/faculty with Premium.
> 3. MongoDB Atlas mock data seeding.

---

# Master Implementation Plan: Audit, Cleanup & Premium Feature Set Completion

This document audits all changes introduced after commit `efd4a0b2956aff76c772d63ecd55bbbe2b24d01f`, details what was built vs. what was left out from the Master Prompt, removes excess mock data/placeholders, and establishes a production-grade implementation roadmap for all remaining features.

---

## 1. Audit of Commits Since `efd4a0b2956aff76c772d63ecd55bbbe2b24d01f`

### What Was Added in Commits (`2009f65` through `13accda`):
1. **Razorpay Payments & Subscription Core**:
   - `server/config/RazorPay.ts`: Lazy Proxy for Razorpay instance.
   - `server/models/membershipModel.ts`: Plan tiers (`trial`, `premium`), amounts, expiry dates.
   - `server/controllers/paymentController.ts`: Order generation and HMAC SHA-256 signature verification.
   - `server/models/userModel.ts`: `isPremium`, `planTier`, `hasUsedTrial`, `trialEndsAt`, `premiumExpiresAt`.
2. **Item 1: Open-Source Contribution Certificates via GitHub Webhooks**:
   - `server/models/openSourceProjectModel.ts`: Projects with `webhookSecret` (`select: false`).
   - `server/models/contributionModel.ts`: Contributions with unique compound index `{ projectId, prNumber }`.
   - `server/controllers/openSourceController.ts`: GitHub HMAC SHA-256 webhook handler (`X-Hub-Signature-256`), PR-merge detection, replay protection, student matching by GitHub handle, premium verification, verified certification push into `Profile.certifications` (which automatically feeds into ATS scoring in `atsScoringService.ts`).
   - `client/src/pages/dashboards/IndustryDashboard.tsx`: Open-source project publishing, webhook display, and contributor management.
   - `client/src/pages/PremiumDashboard.tsx`: Open Source tab fetching live projects, PR tracking, and printable credentials.
3. **Notification Service**:
   - `server/models/notificationModel.ts` & `server/controllers/notificationController.ts`: Event notifications for merged PRs and certificates.

---

## 2. Gap Analysis: Completed vs. Left-Out Features

| Master Prompt Feature | Status | What Exists Today | What Was Left Out / Excess to Clean Up |
| :--- | :--- | :--- | :--- |
| **Item 1: Open-Source Certificates** | **COMPLETED** | Full backend models, HMAC webhook handler, certificate issuance, ATS scoring integration, Industry & Student UI. | **Gap**: No sample OSS projects or contributions in `server/scripts/seedDatabase.ts`, leaving local dev empty. |
| **Item 2: Peer Mentorship Certificates** | **LEFT OUT / FAKED** | Tab header in `PremiumDashboard.tsx`. | **Zero backend**: 3 hardcoded static mentor cards (`Dr. A. K. Sundaram`, etc.) and a dummy state toggle. No model, no pairing flow, no 30-day window, no mentee rating, no anti-abuse guardrails, no PortalAcademia cert issuance. |
| **Item 3: Community Posts for Industry & Institutions** | **LEFT OUT / FAKED** | Tab header in `PremiumDashboard.tsx`. | **Zero backend**: 4 hardcoded static enterprise channel cards (`Google Cloud`, `Razorpay`, etc.) with a dead button. No post model, no role-gated posting routes, no HTML sanitization, no live feed. |
| **Item 4: Email Alert on New Job Posting** | **LEFT OUT / FAKED** | Radio buttons in `PremiumDashboard.tsx`. | **Zero backend**: Digest tab contains static radio options that trigger a dummy browser `alert()`. No email dispatch in `opportunityController.ts`, no skill-matching filter, no rate limit. |

### Excess / Unneeded Things to Clean Up:
1. **Hardcoded Mock Arrays in `PremiumDashboard.tsx`**:
   - Remove lines 1125–1147: static mentor cards array.
   - Remove lines 1214–1235: static enterprise space cards array.
   - Replace dummy `alert()` on line 1321 with real API-backed user preferences.
2. **Unconnected Frontend State**:
   - `mentorSessionBooked` and `selectedMentor` dummy React state in `PremiumDashboard.tsx` replaced by live mentorship status and active mentorships query.

---

## 3. Technical Design for Remaining Features

### Feature 2: Peer Mentorship Certificates (Item 2)

#### Requirements & Logic:
- **Eligible Mentors**: Senior students (4th year / final year / alumni) with verified profiles.
- **Pairing Lifecycle**:
  1. `pending`: Junior requests mentorship with a senior mentor, specifying focus topics.
  2. `active`: Mentor accepts request. `startDate` recorded, `targetEndDate` set to +30 days.
  3. `completed`: After the window expires (or early completion flag), mentee submits rating (1–5) and feedback.
  4. `cancelled`: Either party withdraws before completion.
- **Certification Threshold**:
  - Minimum rating threshold: **≥ 4.0 / 5.0** (clearly calibrated and stated per `GUIDELINES.md` §5).
  - On rating ≥ 4.0: PortalAcademia issues a verified certificate to the mentor:
    - Added to `Profile.certifications` (`issuer: "PortalAcademia Peer Mentorship Program"`, `isVerified: true`).
    - Automatically adds 20 verified certification points to the mentor's ATS profile score in `atsScoringService.ts`.
- **Anti-Abuse Guardrails**:
  - Mentor and Mentee cannot be the same user (`req.userId !== mentorId`).
  - **Reciprocal loop prevention**: If User A mentors User B, User B cannot mentor User A within a 60-day window.
  - Rate limiting: A student can have at most 2 active mentorship pairings at a time.
- **Server-Side Premium Gating**:
  - Gated server-side: Only premium subscribers (`req.user.isPremium`) can browse senior mentors and request mentorship.

#### New Data Model: `server/models/mentorshipModel.ts`
```ts
export interface IMentorship extends Document {
  mentorId: mongoose.Types.ObjectId;   // Senior Student
  menteeId: mongoose.Types.ObjectId;   // Junior Student (Requester)
  status: "pending" | "active" | "completed" | "cancelled" | "rejected";
  topic: string;
  notes?: string;
  startDate?: Date;
  targetEndDate?: Date;
  completedAt?: Date;
  menteeRating?: number;               // 1 to 5
  menteeFeedback?: string;
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
  certificateNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### New Controller & Routes: `server/controllers/mentorshipController.ts` & `server/routes/mentorshipRoute.ts`
- `GET /api/mentorship/mentors`: Returns available senior mentors (students with graduation year indicating senior/alumni, or verified skills). Premium-gated.
- `POST /api/mentorship/request`: Junior creates pairing request. Enforces anti-abuse reciprocal checks.
- `GET /api/mentorship/my-pairings`: Returns active and past pairings where caller is either mentor or mentee.
- `PUT /api/mentorship/:id/status`: Mentor accepts/rejects pairing (`active` or `rejected`).
- `POST /api/mentorship/:id/rate`: Mentee submits rating and feedback. If rating >= 4.0, triggers certificate issuance and notification.

---

### Feature 3: Community Posts for Industry & Institutions (Item 3)

#### Requirements & Logic:
- **Authors**: Only accounts with `accountType: "industry"` or `accountType: "institution"` can publish posts (enforced via `rbacMiddleware.ts`).
- **Post Fields**: `title`, `content` (plain text with line breaks, HTML stripped/sanitized to prevent XSS), `tags`, `pinned`, `imageUrl` (optional Cloudinary image).
- **Public & Premium Access**:
  - The public can view the latest 3 announcements from any institution/company profile.
  - Full premium enterprise feed is server-side gated for students (`req.user.isPremium`).
- **Data Model**: `server/models/communityPostModel.ts`
```ts
export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId;
  authorType: "industry" | "institution";
  authorName: string;
  authorLogo?: string;
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Controller & Routes: `server/controllers/communityPostController.ts` & `server/routes/communityPostRoute.ts`
- `GET /api/community/feed`: Returns chronologically sorted community posts (pinned first). Premium-gated for student accounts.
- `POST /api/community/posts`: Restricted to `industry` and `institution` roles via `rbacMiddleware`. Explicit field allow-list (`title`, `content`, `tags`, `imageUrl`).
- `DELETE /api/community/posts/:id`: Scoped authorization — only the post author can delete.

---

### Feature 4: Email Alert on New Job Posting (Item 4)

#### Requirements & Logic:
- **Trigger**: When an opportunity is created in `opportunityController.ts`.
- **Asynchronous Execution**: Dispatched non-blocking via `setImmediate` / fire-and-forget promise after the database record is created and HTTP 201 response is sent. Never blocks or delays API response.
- **Recipient Qualification & Relevance**:
  - Target student users with active premium subscriptions (`isPremium: true` and `premiumExpiresAt > now`).
  - Candidate skill overlap: Find students whose `skills` or `verifiedSkills` overlap with at least 1 required skill of the opportunity.
- **Volume & Storm Guardrails**:
  - Maximum recipient cap: Top **25** matched candidates per opportunity.
  - Minimum skill match: At least 1 exact skill overlap required.
  - Safe error handling: If SMTP credentials (`process.env.EMAIL`, `process.env.PASSWORD`) are missing or failing, log warning and fail silently without throwing or crashing the server.
- **Service Implementation**: `server/services/emailAlertService.ts` reusing existing nodemailer transport configuration from `authController.ts`.

---

### Database Seeding & Mock Data Replacement

#### Update `server/scripts/seedDatabase.ts`:
- Set `student.test@portalacademia.ac.in` with active premium status (`isPremium: true`, `planTier: "paid"`, `premiumExpiresAt` set to +30 days) for instant local verification.
- Seed a senior student (`senior.mentor@portalacademia.ac.in`, 4th year) with verified skills (`Distributed Systems`, `React`, `System Design`).
- Seed 2 real Open-Source Projects linked to `industry.test@company.com` (`PortalAcademia High-Throughput Indexer`, `Distributed Cache Engine`).
- Seed 2 Community Posts from Industry & IIT Bombay.
- Seed 1 active Mentorship pairing ready for rating.

---

## 4. User Review Required

> [!IMPORTANT]
> **Server-Side Enforcement**: All four premium modules will reject unauthenticated or non-premium requests with `HTTP 403 Forbidden` (`{ success: false, isPremiumRequired: true }`), ensuring client tampering cannot bypass access control.

> [!IMPORTANT]
> **Mentorship Rating Threshold**: Mentorship certificate issuance requires a minimum mentee rating of **4.0 / 5.0**. If a mentee rates ≤ 3.9, the mentorship is marked completed with feedback, but no certificate is awarded.

> [!NOTE]
> **Email Alert Rate Limiting**: Job alerts are capped at **25 premium students** per new opportunity posting to prevent SMTP throttling and inbox spam.

---

## 5. Verification Plan

### Automated Verification:
1. **TypeScript Build Verification**:
   ```bash
   cd "c:\Users\hp\Desktop\Learning AI DL\PortalAcademia\server" && npx tsc --noEmit
   cd "c:\Users\hp\Desktop\Learning AI DL\PortalAcademia\client" && npx tsc --noEmit
   ```
2. **Database Seeding Execution**:
   ```bash
   cd "c:\Users\hp\Desktop\Learning AI DL\PortalAcademia\server" && npx tsx scripts/seedDatabase.ts
   ```
