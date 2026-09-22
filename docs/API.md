# API Reference — PortalAcademia

> **Base URL**: `http://localhost:3000` (Local) / `https://api.portalacademia.ac.in` (Production)  
> **Transport**: JSON over HTTP REST with CORS credentials enabled.  
> **Authentication**: Dual HttpOnly cookies (`accesstoken`, `refreshtoken`). Requests must include `credentials: "include"`.

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/signin` | Public | Sign in with email & password. Sets `accesstoken` & `refreshtoken` cookies. |
| `POST` | `/api/auth/signup` | Public | Initiates signup by dispatching a 6-digit OTP to the user's email. |
| `POST` | `/api/auth/verifyotp` | Public | Validates OTP and creates verified user account. Returns auth cookies. |
| `GET` / `POST` | `/api/auth/checkAuth` | Session | Validates session cookies and returns current authenticated user state. |
| `POST` | `/api/auth/signout` | Session | Clears session cookies (`accesstoken`, `refreshtoken`). |
| `POST` | `/api/auth/refresh` | Cookie | Explicitly exchanges valid `refreshtoken` for fresh `accesstoken`. |
| `GET` | `/api/auth/google` | Public | Initiates Google OAuth 2.0 flow. |
| `GET` | `/api/auth/google/callback`| Public | Google OAuth redirect callback; issues JWT cookies and redirects. |
| `POST` | `/api/auth/oauth-exchange` | Public | Exchanges short-lived (60s) OAuth exchange token for first-party session cookies. |

### Sign In Request Payload
```json
POST /api/auth/signin
{
  "email": "student.test@portalacademia.ac.in",
  "password": "Password123!",
  "rememberMe": true
}
```

### OAuth Exchange Request Payload
```json
POST /api/auth/oauth-exchange
{
  "exchangeToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 2. Profile & Identity (`/api/profile`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/profile/me` | Authenticated | Retrieves profile of the logged-in user. |
| `POST` / `PUT` | `/api/profile` | Authenticated | Creates or updates profile (skills, bio, education, experience). |
| `POST` | `/api/profile/avatar` | Authenticated | Multipart upload (`profileImage`) to Cloudinary; updates user avatar. |
| `GET` | `/api/profile/:id` | Authenticated | Retrieves public profile view by user ID or profile ObjectId. |
| `PUT` | `/api/profile/verify-credential/:studentId/:credentialId` | Institution | Approves or rejects a student's certificate or experience item. |

---

## 3. Opportunities Desk (`/api/opportunities`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/opportunities` | Authenticated | Query active listings with filters (`category`, `mode`, `targetAudience`, `search`). |
| `GET` | `/api/opportunities/:id` | Authenticated | Retrieve details for a single opportunity. |
| `GET` | `/api/opportunities/my-published` | Industry / Inst | Retrieve listings published by the authenticated recruiter or college. |
| `POST` | `/api/opportunities` | Industry / Inst | Publish a new job, internship, FDP, or hackathon. |
| `PUT` | `/api/opportunities/:id` | Publisher Owner | Edit an existing listing owned by the requester. |
| `DELETE` | `/api/opportunities/:id` | Publisher Owner | Close or archive an active opportunity. |
| `POST` | `/api/opportunities/:id/recommend` | Institution | Endorse an opportunity to the institution's student or faculty cohort. |

---

## 4. Application Pipeline (`/api/applications`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/applications` | Student / Faculty | Submit application with dynamic ATS score and skill overlap evaluation. |
| `GET` | `/api/applications/my-applications` | Applicant | View all opportunities applied to, along with live recruiter status. |
| `GET` | `/api/applications/opportunity/:opportunityId` | Listing Owner | View candidate pipeline ranked by ATS and competency match scores. |
| `PATCH` | `/api/applications/:id/status` | Listing Owner | Transition applicant status (`Under Review`, `Shortlisted`, `Offered`, `Rejected`). |

### Submit Application Payload
```json
POST /api/applications
{
  "opportunityId": "65e0a1...",
  "notes": "Interested in distributed systems role",
  "resumeUrl": "https://res.cloudinary.com/...",
  "customAtsScore": 88
}
```

---

## 5. Benchmark Assessments (`/api/assessments`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/assessments` | Authenticated | List standardized skill exams (answer keys and weights stripped). |
| `GET` | `/api/assessments/:id` | Authenticated | Fetch questions for examination test runner. |
| `POST` | `/api/assessments/:id/submit` | Authenticated | Grade submitted answers; calculates cumulative average and awards badge. |
| `GET` | `/api/assessments/my-results` | Authenticated | View past test scores aggregated into average-of-attempts per skill. |
| `POST` | `/api/assessments/generate` | Authenticated | Dynamically generate tailored technical skill assessment. |
| `POST` | `/api/assessments/generate-soft-skills` | Authenticated | Generate multi-dimensional behavioral scenario assessment. |

---

## 6. Institution Verifications & Directory (`/api/verification`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/verification/pending` | Institution | Queue of unverified student credentials scoped to the caller's college. |
| `PUT` | `/api/verification/verify/:studentId/:credentialId` | Institution | Verify or reject student credential with audit notes. |
| `GET` | `/api/verification/institution-students` | Institution | View all enrolled students and alumni of the institution. |
| `GET` | `/api/verification/institution-members` | Institution | Directory of students and faculty with status filters (`enrolled`, `alumni`). |
| `GET` | `/api/verification/institution-members/:id` | Institution | Detailed member profile with skill gap analytics. |

---

## 7. Open Source Contributions & Webhooks (`/api/opensource`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/opensource/projects` | Premium Student | Browse active open-source projects with optional filters (`tech`, `difficulty`, `company`). |
| `POST` | `/api/opensource/projects` | Industry | Register an enterprise repository with auto-generated webhook secret. |
| `GET` | `/api/opensource/projects/mine` | Industry | View company's registered repositories and contribution counts. |
| `GET` | `/api/opensource/projects/:id/contributions` | Industry | List merged PR contributions for a specific company project. |
| `POST` | `/api/opensource/webhook/:projectId` | GitHub (Public) | Ingests merged PR events via HMAC SHA256 signature verification. |
| `GET` | `/api/opensource/contributions/me` | Student | View student's verified merged PR contributions and certificate status. |
| `POST` | `/api/opensource/certificate` | Industry | Issue verified certificate of achievement for a student contribution. |
| `GET` | `/api/opensource/student/:studentId/contributions` | Industry | View student contributions relevant to company projects. |

---

## 8. Payments & Memberships (`/api/payment`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/payment/create-order` | Authenticated | Creates Razorpay order for ₹200 / 30 days (`planType: "premium"`) or activates free trial (`planType: "trial"`). |
| `POST` | `/api/payment/verify` | Authenticated | Verifies Razorpay HMAC signature, activates 30-day membership, and upgrades account to Premium. |
| `GET` | `/api/payment/status` | Authenticated | Returns current subscription status, plan tier, trial usage, and expiration timestamp. |

---

## 9. Real-Time Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/notifications` | Authenticated | Paginated feed of notifications for the authenticated user, plus unread count. |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Marks a specific notification as read. |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Marks all unread notifications as read. |

---

## 10. Telemetry & Analytics (`/api/analytics`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/analytics/industry/market-trends` | Authenticated | Live telemetry on top in-demand skills, salary bands, and hiring growth. |
| `GET` | `/api/analytics/institution/cohort` | Institution | Real-time curriculum deficit analysis comparing college skills to market quotas. |

---

## 11. AI Career & Academic Guide (`/api/ai`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/ai/chat` | Authenticated | Contextual AI mentor backed by Groq LLaMA-3.3 70B with profile context injection. |

### AI Chat Payload
```json
POST /api/ai/chat
{
  "query": "How do I improve my match score for backend roles?",
  "history": [
    { "role": "user", "content": "What skills are missing?" },
    { "role": "assistant", "content": "You have Docker but need Kubernetes..." }
  ]
}
```

---

## 12. Uploads & Document OCR (`/api/upload`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/upload/single` | Authenticated | Multipart upload (`file`) persisting images and documents to Cloudinary. |
| `POST` | `/api/upload/resume-score` | Authenticated | Upload PDF/DOCX resume; parses text and calculates unified ATS score. |

---

## 13. Onboarding (`/api/onboarding`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/onboarding/institutions` | Public | Autocomplete university/college names from AISHE dataset. |
| `POST` | `/api/onboarding/send-verification-otp` | Authenticated | Sends verification code to college/work email during onboarding. |
| `POST` | `/api/onboarding/verify-otp` | Authenticated | Verifies code and records institutional email verification. |
| `POST` | `/api/onboarding/crawl-college-emails` | Authenticated | Extracts institutional domain format from college directory. |


---

## 14. Peer Mentorship & WebRTC Video (`/api/mentorship`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/mentorship/mentors` | Authenticated | Discover verified senior peer mentors with average ratings. |
| `POST` | `/api/mentorship/apply` | Authenticated (Student) | Final-year students apply for free by agreeing to Mentor Honor Code. |
| `POST` | `/api/mentorship/request` | Authenticated (Premium) | Premium students schedule 1-on-1 advisory session with a mentor. |
| `GET` | `/api/mentorship/my-pairings` | Authenticated | Retrieve active and completed sessions (as mentor or mentee). |
| `POST` | `/api/mentorship/:id/complete` | Authenticated (Pairing) | Gated completion: requires $\ge 21$ days timeline or 2 calls $\ge 30$ mins. |
| `POST` | `/api/mentorship/:id/rate` | Mentee | 1-5 star evaluation. Ratings $\ge 4.0$ on completed terms award Certificate & +20 ATS boost. |
| `POST` | `/api/mentorship/:id/report` | Authenticated (Pairing) | Submit in-call misconduct report for administrative audit. |
| `GET` | `/api/mentorship/reports` | Institution / Admin | Administrative review of misconduct reports. |
| `PATCH`| `/api/mentorship/reports/:id/status` | Institution / Admin | Update report status (`action_taken` auto-revokes mentor status). |

### WebRTC Socket Signaling (`Socket.IO`)
- Handshake Authentication: Cookie verification (`accesstoken`/`refreshtoken`).
- Rooms: `mentorship_<pairingId>` (participant authorization strictly enforced).
- Events: `join_call_room`, `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`, `call_message`, `end_call`.

---

## 15. Enterprise Technical Spaces (`/api/community`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/community/spaces` | Authenticated | List all enterprise community spaces with member counts. |
| `POST` | `/api/community/spaces` | Industry / Faculty / Admin | Create a new verified discussion space. |
| `POST` | `/api/community/spaces/:id/join` | Premium / Faculty / Industry | Join space (requires Premium for students; free for faculty/industry). |
| `GET` | `/api/community/spaces/:id/messages` | Authenticated | Fetch latest 100 chat messages chronologically. |

### Real-time Space Chat (`Socket.IO`)
- Rooms: `community_<spaceId>` (socket-level premium and role entitlement checked).
- Events: `join_community_space`, `send_community_message`, `new_community_message`, `leave_community_space`.

---

## Standard Error Response Format
All non-2xx responses return a standardized JSON error payload:
```json
{
  "success": false,
  "message": "Specific, actionable error description."
}
```
Common HTTP Status Codes:
- `400 Bad Request`: Validation error or missing mandatory parameters.
- `401 Unauthorized`: Session cookie missing or expired.
- `403 Forbidden`: Role permission denied or cross-tenant boundary breach.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Duplicate submission or active application already recorded.
- `429 Too Many Requests`: Rate limiter triggered.
- `500 Internal Server Error`: Unhandled server fault.
