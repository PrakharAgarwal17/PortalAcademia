# API Contracts & Endpoint Specifications — PortalAcademia

> Base URL: `http://localhost:3000` (or `process.env.VITE_API_BASE_URL`)  
> Transport: JSON over HTTP REST.  
> Authentication: Cookie-based sessions via `credentials: "include"`. Active token stored in `accesstoken` and `refreshtoken` HttpOnly cookies.

---

## 1. Authentication Endpoints (`/api/auth`)
**Router:** [server/routes/authRoute.ts](file:///server/routes/authRoute.ts)  
**Controller:** [server/controllers/authController.ts](file:///server/controllers/authController.ts)

### `POST /api/auth/signin`
- **Handler:** `SignIn`
- **Auth & Middleware:** Public
- **Request Body:**
  ```json
  {
    "email": "user@domain.com",
    "password": "SecurePassword123",
    "rememberMe": true
  }
  ```
- **Success Response:** `200 OK`
  - Sets Cookies: `accesstoken` (15m), `refreshtoken` (7d or 30d)
  - Body:
    ```json
    {
      "message": "Sign in successful",
      "user": {
        "id": "65e0a...",
        "email": "user@domain.com",
        "isVerified": true,
        "isOnboarded": true
      }
    }
    ```
- **Error Responses:** `400 Bad Request` (Missing fields), `401 Unauthorized` (Invalid credentials).

---

### `POST /api/auth/signup`
- **Handler:** `SignUp`
- **Auth & Middleware:** Public
- **Request Body:**
  ```json
  {
    "email": "candidate@univ.edu",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123",
    "rememberMe": false
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "message": "OTP sent successfully to candidate@univ.edu. Valid for 10 minutes."
  }
  ```
- **Error Responses:** `400 Bad Request` (Passwords mismatch, invalid email format), `409 Conflict` (Email already registered).

---

### `POST /api/auth/verifyotp`
- **Handler:** `VerifyOtp`
- **Auth & Middleware:** Public
- **Request Body:**
  ```json
  {
    "email": "candidate@univ.edu",
    "otp": "482910"
  }
  ```
- **Success Response:** `201 Created`
  - Sets Cookies: `accesstoken`, `refreshtoken`
  - Body:
    ```json
    {
      "message": "Account verified and created successfully",
      "user": {
        "id": "65e0b...",
        "email": "candidate@univ.edu",
        "isVerified": true,
        "isOnboarded": false
      }
    }
    ```
- **Error Responses:** `400 Bad Request` (Invalid or expired OTP).

---

### `POST /api/auth/checkAuth` / `GET /api/auth/checkAuth`
- **Handler:** `checkAuth`
- **Auth & Middleware:** Cookie-based (`accesstoken` or `refreshtoken`)
- **Request Body:** None
- **Success Response:** `200 OK`
  ```json
  {
    "valid": true,
    "user": {
      "id": "65e0b...",
      "email": "candidate@univ.edu",
      "isVerified": true,
      "isOnboarded": true
    }
  }
  ```
- **Error Response:** `401 Unauthorized` (`{ "valid": false, "message": "Unauthorized" }`).

---

### `POST /api/auth/signout`
- **Handler:** `SignOut`
- **Auth & Middleware:** Public
- **Success Response:** `200 OK` (Clears cookies `accesstoken` and `refreshtoken`)
  ```json
  { "message": "Logged out successfully" }
  ```

---

### `POST /api/auth/refresh`
- **Handler:** `RefreshToken`
- **Auth & Middleware:** Requires `refreshtoken` cookie
- **Success Response:** `200 OK` (Sets new `accesstoken` cookie)
  ```json
  { "message": "Access token refreshed" }
  ```

---

### `GET /api/auth/google` & `/api/auth/google/callback`
- **Handler:** Passport Google Strategy & `googleSuccess`
- **Auth & Middleware:** Passport OAuth 2.0
- **Redirection:** On success, sets session cookies and redirects to `${FRONTEND_URL}/dashboard`. On failure, redirects to `${FRONTEND_URL}/auth?error=google_failed`.

---

## 2. Onboarding Endpoints (`/api/onboarding`)
**Router:** [server/routes/onboardingRoute.ts](file:///server/routes/onboardingRoute.ts)  
**Controller:** [server/controllers/onboardingController.ts](file:///server/controllers/onboardingController.ts)

### `GET /api/onboarding/institutions`
- **Handler:** `searchInstitutions`
- **Auth & Middleware:** Public
- **Query Params:** `query` (string, min 2 chars), `state` (optional string), `limit` (optional number)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "count": 10,
    "data": [
      {
        "name": "Indian Institute of Technology Bombay",
        "aisheCode": "U-0294",
        "state": "Maharashtra"
      }
    ]
  }
  ```

---

### `POST /api/onboarding/send-verification-otp`
- **Handler:** `sendVerificationOtp`
- **Auth & Middleware:** `isloggedIn`
- **Request Body:** `{ "email": "student@institution.edu" }`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Verification code dispatched to institutional inbox"
  }
  ```

---

### `POST /api/onboarding/verify-otp`
- **Handler:** `verifyOnboardingOtp`
- **Auth & Middleware:** `isloggedIn`
- **Request Body:** `{ "email": "student@institution.edu", "otp": "918234" }`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Institutional affiliation confirmed and email verified"
  }
  ```

---

## 3. Profile Management Endpoints (`/api/profile`)
**Router:** [server/routes/profileRoute.ts](file:///server/routes/profileRoute.ts)  
**Controller:** [server/controllers/profileController.ts](file:///server/controllers/profileController.ts)

### `GET /api/profile/me`
- **Handler:** `getMyProfile`
- **Auth & Middleware:** `isloggedIn`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "profile": {
      "_id": "65e1c...",
      "userId": "65e0b...",
      "name": "Alex Mercer",
      "accountType": "student",
      "institution": "Delhi Technological University",
      "skills": ["Python", "React", "PyTorch"],
      "education": [...],
      "certifications": [...],
      "pastExperience": [...]
    }
  }
  ```

---

### `POST /api/profile` & `PUT /api/profile`
- **Handler:** `createOrUpdateProfile`
- **Auth & Middleware:** `isloggedIn`
- **Request Body (Example: Student Onboarding / Update):**
  ```json
  {
    "name": "Alex Mercer",
    "accountType": "student",
    "category": "individual",
    "institution": "Delhi Technological University",
    "institutionEmail": "alex@dtu.ac.in",
    "skills": ["Python", "Machine Learning", "Docker"],
    "headline": "Aspiring AI Engineer",
    "bio": "Undergraduate researcher focused on LLMs.",
    "education": [
      {
        "education": "B.Tech Computer Science",
        "course": "CSE",
        "timeline": "2023-2027",
        "description": "GPA 8.9"
      }
    ],
    "certifications": [
      {
        "title": "Deep Learning Specialization",
        "issuer": "Coursera / DeepLearning.AI",
        "credentialUrl": "https://coursera.org/verify/...",
        "upload": "https://res.cloudinary.com/..."
      }
    ]
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "profile": { ... }
  }
  ```

---

### `POST /api/profile/avatar`
- **Handler:** `uploadAvatar`
- **Auth & Middleware:** `isloggedIn`, `multer.single("profileImage")`
- **Request:** `multipart/form-data` with field `profileImage`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "profileImage": "https://res.cloudinary.com/..."
  }
  ```

---

### `GET /api/profile/:id`
- **Handler:** `getProfileById`
- **Auth & Middleware:** `isloggedIn`
- **Path Params:** `id` (User ID or Profile ID)
- **Success Response:** `200 OK` (`{ "success": true, "profile": { ... } }`)

---

## 4. Opportunity Endpoints (`/api/opportunities`)
**Router:** [server/routes/opportunityRoute.ts](file:///server/routes/opportunityRoute.ts)  
**Controller:** [server/controllers/opportunityController.ts](file:///server/controllers/opportunityController.ts)

### `GET /api/opportunities`
- **Handler:** `getOpportunities`
- **Auth & Middleware:** `isloggedIn`
- **Query Params:**
  - `category`: `"internship" | "hackathon" | "workshop" | "fdp" | "research" | "sabbatical" | "all"`
  - `mode`: `"Remote" | "Hybrid" | "On-site" | "all"`
  - `targetAudience`: `"student" | "faculty" | "both" | "all"`
  - `search`: Keyword string matching title, org, domain, skills
  - `page`, `limit`: Pagination parameters
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "count": 12,
    "page": 1,
    "totalPages": 2,
    "data": [
      {
        "_id": "65e3d...",
        "title": "Machine Learning Research Intern",
        "organization": "AeroDynamics Corp",
        "category": "internship",
        "mode": "Remote",
        "stipendOrPrize": "₹45,000/month",
        "requiredSkills": ["PyTorch", "Python", "Computer Vision"],
        "recommendedByColleges": ["Delhi Technological University"],
        "deadline": "2026-10-15"
      }
    ]
  }
  ```

---

### `POST /api/opportunities`
- **Handler:** `createOpportunity`
- **Auth & Middleware:** `isloggedIn`, `isPublisher` (`industry` or `institution`)
- **Side Effect:** Computes 384d semantic vector embedding via `vectorService.ts` and saves to `jobEmbedding`.
- **Request Body:**
  ```json
  {
    "title": "Cloud Infrastructure Engineer Intern",
    "description": "Design and manage Kubernetes clusters and Terraform deployments.",
    "category": "internship",
    "domain": "DevOps & Cloud",
    "location": "Bengaluru, Karnataka",
    "mode": "Hybrid",
    "duration": "6 Months",
    "stipendOrPrize": "₹35,000/month",
    "requiredSkills": ["Docker", "Kubernetes", "AWS Architecture"],
    "eligibility": "Final year CSE / IT undergraduates",
    "deadline": "2026-11-01",
    "targetAudience": "student"
  }
  ```
- **Success Response:** `201 Created` (`{ "success": true, "data": { ... } }`)

---

### `POST /api/opportunities/:id/recommend`
- **Handler:** `recommendOpportunity`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Path Params:** `id` (Opportunity ID)
- **Request Body:** `{ "target": "students" | "faculty" | "both" }`
- **Operation:** Appends institution name to `recommendedByColleges` array and user ID to `recommendedToStudentsBy`.
- **Success Response:** `200 OK` (`{ "success": true, "message": "Opportunity endorsed" }`)

---

## 5. Application & Candidate Pipeline Endpoints (`/api/applications`)
**Router:** [server/routes/applicationRoute.ts](file:///server/routes/applicationRoute.ts)  
**Controller:** [server/controllers/applicationController.ts](file:///server/controllers/applicationController.ts)

### `POST /api/applications`
- **Handler:** `applyToOpportunity`
- **Auth & Middleware:** `isloggedIn`
- **Request Body:**
  ```json
  {
    "opportunityId": "65e3d...",
    "resumeUrl": "https://res.cloudinary.com/...",
    "resumeData": { "name": "...", "skills": [...] },
    "notes": "Cover letter statement..."
  }
  ```
- **Computation:** Computes candidate skill vector match score (0-100) and ATS compliance score.
- **Success Response:** `201 Created` (`{ "success": true, "data": { ... } }`)
- **Error Response:** `409 Conflict` ("You have already applied to this opportunity").

---

### `GET /api/applications/my-applications`
- **Handler:** `getMyApplications`
- **Auth & Middleware:** `isloggedIn`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65e4e...",
        "opportunityId": {
          "title": "Machine Learning Research Intern",
          "organization": "AeroDynamics Corp",
          "category": "internship"
        },
        "matchScore": 88,
        "atsScore": 92,
        "status": "Under Review",
        "appliedAt": "2026-09-10T12:00:00.000Z"
      }
    ]
  }
  ```

---

### `GET /api/applications/opportunity/:opportunityId`
- **Handler:** `getApplicantsForOpportunity`
- **Auth & Middleware:** `isloggedIn`, `isPublisher`
- **Path Params:** `opportunityId`
- **Success Response:** `200 OK` (Array of candidate submissions sorted by `matchScore` desc).

---

### `PATCH /api/applications/:id/status`
- **Handler:** `updateApplicationStatus`
- **Auth & Middleware:** `isloggedIn`, `isPublisher`
- **Path Params:** `id` (Application ID)
- **Request Body:**
  ```json
  {
    "status": "Shortlisted",
    "reviewerNotes": "Strong portfolio in PyTorch and verified benchmark tests."
  }
  ```
- **Allowed Statuses:** `"Applied"`, `"Under Review"`, `"Shortlisted"`, `"Technical Interview"`, `"Offered"`, `"Rejected"`.
- **Success Response:** `200 OK` (`{ "success": true, "data": { ... } }`)



---

## 6. Skill Assessment Endpoints (`/api/assessments`)
**Router:** [server/routes/assessmentRoute.ts](file:///server/routes/assessmentRoute.ts)  
**Controller:** [server/controllers/assessmentController.ts](file:///server/controllers/assessmentController.ts)

### `GET /api/assessments`
- **Handler:** `getAssessments`
- **Auth & Middleware:** `isloggedIn`
- **Security:** Correct answer keys and explanations are masked out (`.select("-questions.correctOptionIndex -questions.explanation")`).
- **Success Response:** `200 OK` (List of standardized tests).

---

### `POST /api/assessments/:id/submit`
- **Handler:** `submitAssessment`
- **Auth & Middleware:** `isloggedIn`
- **Path Params:** `id` (Assessment ID)
- **Request Body:**
  ```json
  {
    "answers": [
      { "questionId": "q1", "selectedOptionIndex": 2, "timeTakenSeconds": 18 },
      { "questionId": "q2", "selectedOptionIndex": 0, "timeTakenSeconds": 24 }
    ]
  }
  ```
- **Evaluation:** Evaluates submitted answers against actual schema keys, computes percentage score, checks against `passPercentage`.
- **Retest & Average Calculation:** Retesting preserves all attempts on record; calculates cumulative average percentage across all attempts for this assessment.
- **Side Effect:** If `passed === true`, appends `verifiedSkillsAdded` to candidate's `Profile.skills` and `Profile.verifiedSkills` and awards digital badge.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "result": {
      "score": 9,
      "totalQuestions": 10,
      "percentage": 90,
      "passed": true,
      "badgeAwarded": "Certified Python Practitioner",
      "verifiedSkillsAdded": ["Python"],
      "attemptNumber": 2,
      "cumulativeAveragePercentage": 85,
      "totalAttemptsOnRecord": 2,
      "bestPercentageOnRecord": 90,
      "skillAverages": [
        { "skill": "Python", "averagePercentage": 85, "totalAttempts": 2, "bestPercentage": 90 }
      ]
    }
  }
  ```

---

### `GET /api/assessments/my-results`
- **Handler:** `getMyResults`
- **Auth & Middleware:** `isloggedIn`
- **Operation:** Returns all assessment attempts for the authenticated student, enriched with cumulative attempt counts, average percentages per assessment, and grouped `skillStats` aggregate summaries.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "_id": "65f0...",
        "assessmentTitle": "Python Competency Exam",
        "percentage": 90,
        "passed": true,
        "attemptNumber": 2,
        "totalAttemptsOnRecord": 2,
        "cumulativeAveragePercentage": 85
      }
    ],
    "skillStats": [
      {
        "skill": "Python",
        "totalAttempts": 2,
        "averagePercentage": 85,
        "bestPercentage": 90,
        "latestPercentage": 90,
        "isPassed": true,
        "badgeAwarded": "Certified Python Practitioner",
        "lastAttemptDate": "2026-09-16T12:00:00.000Z",
        "attempts": [...]
      }
    ]
  }
  ```

---

### `POST /api/assessments/generate`
- **Handler:** `generateSkillAssessment`
- **Auth & Middleware:** `isloggedIn`
- **Request Body:** `{ "skill": "Kubernetes" }`
- **Operation:** Generates on-the-spot standardized MCQ assessment for that skill vector.
- **Success Response:** `200 OK` (Assessment payload).

---

## 7. Institutional Verification Queue (`/api/verification`)
**Router:** [server/routes/verificationRoute.ts](file:///server/routes/verificationRoute.ts)  
**Controller:** [server/controllers/verificationController.ts](file:///server/controllers/verificationController.ts)

### `GET /api/verification/pending`
- **Handler:** `getPendingVerifications`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "count": 4,
    "data": [
      {
        "studentId": "65e0b...",
        "studentName": "Alex Mercer",
        "credentialId": "65e5f...",
        "title": "Certified Kubernetes Administrator (CKA)",
        "issuer": "Linux Foundation",
        "credentialUrl": "https://...",
        "upload": "https://res.cloudinary.com/..."
      }
    ]
  }
  ```

---

### `PUT /api/verification/verify/:studentId/:credentialId`
- **Handler:** `verifyCredential`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Request Body:**
  ```json
  {
    "decision": "approve",
    "notes": "Verified against official Linux Foundation registry."
  }
  ```
- **Operation:** Flips `isVerified: true`, stamps `verifiedBy: institutionId`, records `verifiedAt: new Date()`.
- **Success Response:** `200 OK` (`{ "success": true, "message": "Credential verified" }`)

---

### `GET /api/verification/institution-students`
- **Handler:** `getInstitutionStudents`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Query Params:** `status=enrolled|alumni` (optional)
- **Scoping & IDOR Defense:** Strictly scoped to the authenticated institution's profile name (`instName`). If unconfigured, returns an empty array immediately to prevent leaking cross-institution student records.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "count": 120,
    "data": [
      {
        "_id": "65e0b...",
        "name": "Priya Patel",
        "email": "priya@univ.edu",
        "isAlumni": false,
        "academicYear": "3rd Year",
        "verifiedSkillsCount": 4
      }
    ]
  }
  ```

---

### `GET /api/verification/institution-members/:id`
- **Handler:** `getInstitutionMemberById`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Security Check:** Strictly enforces resource-level authorization. Compares requested member's `institutionName` against caller's institution name. Returns `403 Forbidden` if mismatched, preventing cross-institution IDOR data leaks.
- **Success Response:** `200 OK` (Full member profile payload with resolved `isAlumni` and `academicYear`).

---

## 8. Telemetry & Analytics Endpoints (`/api/analytics`)
**Router:** [server/routes/analyticsRoute.ts](file:///server/routes/analyticsRoute.ts)  
**Controller:** [server/controllers/analyticsController.ts](file:///server/controllers/analyticsController.ts)

### `GET /api/analytics/institution/cohort`
- **Handler:** `getCohortAnalytics`
- **Auth & Middleware:** `isloggedIn`, `isInstitution`
- **Operation:** Native MongoDB aggregation pipelines computing:
  - Skill distribution across enrolled students
  - Overall student readiness score
  - Credential verification rate
  - Top curriculum deficit skills compared against live industry demand
- **Success Response:** `200 OK`

---

### `GET /api/analytics/industry/market-trends`
- **Handler:** `getMarketTrends`
- **Auth & Middleware:** `isloggedIn`
- **Operation:** Aggregates live opportunity skill vectors vs applicant skill pools to produce deficit curves.
- **Success Response:** `200 OK`

---

### `GET /api/analytics/student/gap`
- **Handler:** `getStudentSkillGap`
- **Auth & Middleware:** `isloggedIn`
- **Operation:** Computes distance vector between current student skills and top 10 trending market skills.
- **Success Response:** `200 OK`

---

## 9. AI Career Guide Endpoint (`/api/ai`)
**Router:** [server/routes/aiRoute.ts](file:///server/routes/aiRoute.ts)  
**Controller:** [server/controllers/aiController.ts](file:///server/controllers/aiController.ts)

### `POST /api/ai/chat`
- **Handler:** `chatWithAI`
- **Auth & Middleware:** `isloggedIn`
- **Request Body:**
  ```json
  {
    "message": "Why is my match score low for cloud engineering roles?"
  }
  ```
- **Operation:**
  1. Injects live profile context (skills, degrees, verified credentials, target roles) into hidden system prompt.
  2. Queries Groq API (or grounded domain fallback engine).
  3. Prunes AI chat logs via `AiLog.pruneIfThresholdExceeded(500)` to safeguard MongoDB Atlas storage.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "reply": "Based on your verified skills (Python, Docker), you are missing Kubernetes and Terraform which account for 65% of required competencies in active listings."
  }
  ```

---

## 10. File Upload Endpoints (`/api/upload`)
**Router:** [server/routes/uploadRoute.ts](file:///server/routes/uploadRoute.ts)

### `POST /api/upload/single`
- **Auth & Middleware:** `isloggedIn`, `multer.single("file")`
- **Request:** `multipart/form-data` with fields `file` and optional `folder`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "url": "https://res.cloudinary.com/demo/image/upload/v.../portal_academia/uploads/sample.pdf",
    "publicId": "portal_academia/uploads/sample"
  }
  ```

---

### `POST /api/upload/resume-score`
- **Auth & Middleware:** `isloggedIn`, Redis/Memory Rate Limiter (`10 uploads / 15m`), `multer.single("file")` (PDF / DOCX $\le 5\text{MB}$)
- **Request:** `multipart/form-data` with:
  - `file`: Resume document (PDF or DOCX)
  - `opportunityId`: Target opportunity ObjectId (optional)
  - `requiredSkills`: Fallback JSON array or comma-separated string of required skills (optional)
- **Operation:**
  1. Extracts text from buffer via `pdf-parse` (v2 `PDFParse`) or `mammoth.extractRawText`.
  2. Fetches user profile, verified credentials, and passed assessment scores.
  3. Reconciles candidate skills from document text + profile.
  4. Runs authoritative unified ATS scoring engine (`calculateAtsScore`).
  5. Uploads document buffer to Cloudinary (`portal_academia/resumes`).
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Resume uploaded and scored successfully",
    "url": "https://res.cloudinary.com/.../resume.pdf",
    "publicId": "portal_academia/resumes/resume_12345",
    "filename": "Aarav_Sharma_Resume.pdf",
    "atsAnalysis": {
      "score": 88,
      "technicalScore": 85,
      "completenessScore": 92,
      "matchedSkills": ["React", "TypeScript"],
      "missingSkills": ["GraphQL"],
      "details": { ... }
    }
  }
  ```
- **Error Responses:** `400 Bad Request` (No file, unsupported file type), `429 Too Many Requests` (Rate limit exceeded: >10 in 15m).
