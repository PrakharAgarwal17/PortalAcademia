# State Management & Data Schemas — PortalAcademia

> Documents client Redux slices, React contexts, browser storage contracts, and backend Mongoose database schemas.

---

## 1. Client Global State (Redux Toolkit)

Configured in [client/src/context/store.ts](file:///client/src/context/store.ts).

### Store Configuration
```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,       // from ./authSlice
    profile: profileReducer, // from ./profileSlice
  },
});
```

### Typed Hooks
- `useAppDispatch: () => AppDispatch`
- `useAppSelector: TypedUseSelectorHook<RootState>`

---

### Slice 1: `authSlice`
**Source:** [client/src/context/authSlice.ts](file:///client/src/context/authSlice.ts)  
**Role:** Manages session authentication status, current user identity, and session telemetry. Token is strictly `null` (HttpOnly cookie architecture).

#### State Shape (`AuthState`)
| Field | Type | Initial Value | Description |
| :--- | :--- | :--- | :--- |
| `user` | `AuthUser \| null` | `null` | Active user record (`{ email, isVerified, isOnboarded, role? }`) |
| `token` | `null` | `null` | Always null; authentication lives in server HttpOnly cookies |
| `isAuthenticated` | `boolean` | `false` | True when authenticated and verified |
| `isLoading` | `boolean` | `true` | True while session check is in flight on boot |
| `isInitialized` | `boolean` | `false` | Flipped to true once initial `checkAuthThunk` completes |
| `error` | `string \| null` | `null` | Error message string or null |

#### Reducers / Synchronous Actions
| Action | Payload | State Mutation |
| :--- | :--- | :--- |
| `setCredentials` | `AuthUser` | Sets `state.user = action.payload`, `isAuthenticated = true`, `error = null` |
| `clearAuth` | `void` | Resets `user = null`, `token = null`, `isAuthenticated = false`, `error = null` |
| `setError` | `string \| null` | Sets `state.error = action.payload` |
| `setLoading` | `boolean` | Sets `state.isLoading = action.payload` |

#### Async Thunks (Extra Reducers)
| Thunk | Signature / Endpoint | Handled Cases & State Mutations |
| :--- | :--- | :--- |
| `checkAuthThunk` | `POST /api/auth/checkAuth`<br>Then `GET /api/profile/me` | **pending**: `isLoading = true`, `error = null`<br>**fulfilled**: `isLoading = false`, `isInitialized = true`, if valid sets `isAuthenticated = true` and hydrates `user` (`email`, `isVerified`, `isOnboarded`, `role`); else `isAuthenticated = false`, `user = null`<br>**rejected**: `isLoading = false`, `isInitialized = true`, `isAuthenticated = false`, `user = null` |
| `signOutThunk` | `POST /api/auth/SignOut` | **fulfilled / rejected**: `user = null`, `isAuthenticated = false`, `isLoading = false` |

---

### Slice 2: `profileSlice`
**Source:** [client/src/context/profileSlice.ts](file:///client/src/context/profileSlice.ts)  
**Role:** Controls modal visibility and section focus for editing user profiles.

#### State Shape (`ProfileEditState`)
| Field | Type | Initial Value | Description |
| :--- | :--- | :--- | :--- |
| `activeSection` | `ProfileEditSection` | `null` | Active section being edited: `"headline" \| "bio" \| "skills" \| "education" \| "experience" \| "certifications" \| "roleParams" \| "visuals" \| null` |
| `editingIndex` | `number \| null` | `null` | Index of array item being edited (for education/certifications/experience) |
| `isModalOpen` | `boolean` | `false` | Controls open state of `ProfileEditModal` |

#### Reducers / Actions
| Action | Payload | State Mutation |
| :--- | :--- | :--- |
| `openEditModal` | `{ section: ProfileEditSection; index?: number \| null }` | Sets `activeSection = action.payload.section`, `editingIndex = action.payload.index ?? null`, `isModalOpen = true` |
| `closeEditModal` | `void` | Sets `activeSection = null`, `editingIndex = null`, `isModalOpen = false` |

---

## 2. React Context APIs

### `ThemeContext`
**Source:** [client/src/context/theme.tsx](file:///client/src/context/theme.tsx)  
**Role:** Controls light/dark application theme with CSS class toggling and system preference detection.

| Field / Method | Type | Description |
| :--- | :--- | :--- |
| `theme` | `"light" \| "dark"` | Current active theme |
| `toggleTheme()` | `() => void` | Inverts current theme and toggles `.dark` on `document.documentElement` |
| `setTheme(theme)`| `(theme: "light" \| "dark") => void` | Directly sets theme state |
| **Hook** | `useTheme()` | Consumer hook; throws if used outside `ThemeProvider` |

---

## 3. Browser Storage Keys

| Key | Storage API | Purpose | Lifecycle / Origin |
| :--- | :--- | :--- | :--- |
| `portalacademia_theme` | `localStorage` | Persists user theme preference (`"light"` or `"dark"`) | Persists across browser sessions |

> **Security Note:** Neither `localStorage` nor `sessionStorage` stores authentication tokens, JWTs, or user credentials. Session security relies exclusively on server-managed `HttpOnly` SameSite cookies.

---

## 4. Backend Database Schemas (MongoDB / Mongoose)

### 1. `User` Schema
**File:** [server/models/userModel.ts](file:///server/models/userModel.ts)  
**Collection:** `users`

```ts
interface UserSchema extends Document {
    email: string;        // Unique, trimmed, required
    password?: string;    // Bcrypt hashed password (optional for OAuth)
    provider: string;     // Default: "local" (or "google")
    providerID?: string;  // Google OAuth profile ID
    isVerified: boolean;  // Default: false (email OTP verified status)
    isOnboarded: boolean; // Default: false (true once persona onboarding submitted)
    createdAt: Date;
    updatedAt: Date;
}
```

---

### 2. `Profile` Schema
**File:** [server/models/profileModel.ts](file:///server/models/profileModel.ts)  
**Collection:** `profiles`  
**Relations:** `userId` -> references `User._id` (Unique index)

```ts
interface IProfile extends Document {
    userId: Types.ObjectId;                    // ref: "User", required, unique
    category: "individual" | "organization";    // default: "individual"
    accountType: "student" | "faculty" | "institution" | "industry"; // required

    // Shared Profile Metadata
    name: string;                              // required, trimmed
    headline?: string;                         // default: ""
    profileImage?: string;                     // Cloudinary CDN URL
    image?: string;                            // backward compatibility alias
    bannerImage?: string;                      // Cover preset or custom banner URL
    bio?: string;                              // trimmed
    location?: string;                         // trimmed
    website?: string;                          // trimmed

    // Individual (Student & Faculty)
    institution?: string;                      // AISHE institution name
    institutionEmail?: string;                 // Official college email
    isEmailVerified?: boolean;                 // Academic email verified status
    skills?: string[];                         // Array of skill tags
    education?: IEducation[];                  // Nested sub-documents
    certifications?: ICertification[];          // Nested sub-documents with verification metadata
    pastExperience?: IPastExperience[];        // Nested sub-documents

    // Faculty Specific
    designation?: string;                      // e.g. "Assistant Professor"
    department?: string;                       // e.g. "Computer Science"
    expertise?: string[];                      // Core domain expertise
    researchInterests?: string[];              // Research focus areas

    // Institution Specific
    institutionName?: string;
    aisheCode?: string;                        // Standard AISHE accreditation code
    officialEmail?: string;
    contact?: string;

    // Industry Specific
    companyName?: string;
    industryType?: string;                     // e.g. "Information Technology"
    officialWebsite?: string;
    workEmail?: string;
    employees?: string;                        // Headcount range

    // Professional Social Links
    linkedin?: string;
    github?: string;

    createdAt: Date;
    updatedAt: Date;
}
```

#### Nested Sub-Schemas in `Profile`:
- **`education` (`IEducation`)**: `{ education: string, course: string, description: string, timeline: string }`
- **`certifications` (`ICertification`)**: `{ title: string, description: string, issuer: string, credentialUrl: string, upload: string, isVerified: boolean, verifiedBy: ref("User"), verifiedAt: Date, verificationNotes: string }`
- **`pastExperience` (`IPastExperience`)**: `{ title: string, timeline: string, description: string, organization: string, uploadImage: string, isVerified: boolean, verifiedBy: ref("User"), verifiedAt: Date }`

---

### 3. `Opportunity` Schema
**File:** [server/models/opportunityModel.ts](file:///server/models/opportunityModel.ts)  
**Collection:** `opportunities`  
**Relations:** `createdBy` -> references `User._id`

```ts
interface IOpportunity extends Document {
    title: string;                             // required, trimmed
    description: string;                       // required
    organization: string;                      // required, trimmed
    createdBy: Types.ObjectId;                 // ref: "User", index: true
    category: "internship" | "hackathon" | "workshop" | "fdp" | "research" | "sabbatical"; // index: true
    domain: string;
    location: string;
    mode: "Remote" | "Hybrid" | "On-site";     // default: "Remote"
    duration: string;                          // e.g. "3 Months"
    stipendOrPrize: string;                    // e.g. "₹25,000/month"
    requiredSkills: string[];                  // required
    eligibility: string;
    deadline: string;
    status: "active" | "closed";               // default: "active", index: true
    targetAudience: "student" | "faculty" | "both"; // default: "both", index: true
    recommendedByColleges: string[];           // Array of college names that endorsed this opportunity
    recommendedToStudentsBy: Types.ObjectId[]; // ref: "User"
    recommendedToFacultyBy: Types.ObjectId[];  // ref: "User"
    applicantCount: number;                    // default: 0
    createdAt: Date;
    updatedAt: Date;
}
```

---

### 4. `Application` Schema
**File:** [server/models/applicationModel.ts](file:///server/models/applicationModel.ts)  
**Collection:** `applications`  
**Relations:** `opportunityId` -> references `Opportunity._id`, `applicantId` -> references `User._id`  
**Compound Index:** `{ opportunityId: 1, applicantId: 1 }` (Unique — prevents duplicate applications)

```ts
interface IApplication extends Document {
    opportunityId: Types.ObjectId;             // ref: "Opportunity", required, index: true
    applicantId: Types.ObjectId;               // ref: "User", required, index: true
    applicantName: string;
    applicantEmail: string;
    applicantInstitution: string;              // default: "Independent"
    applicantSkills: string[];
    matchScore: number;                        // 0-100 derived skill/assessment score
    atsScore: number;                          // 0-100 ATS compliance score
    resumeUrl?: string;                        // Cloudinary or generated PDF URL
    resumeData?: Record<string, any>;          // Structured ATS resume payload
    status: "Applied" | "Under Review" | "Shortlisted" | "Technical Interview" | "Offered" | "Rejected";
    appliedAt: Date;                           // default: Date.now
    notes?: string;
    reviewerNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
```

> **ATS Resume Payload (`CandidateApplication` in [IndustryDashboard.tsx](file:///client/src/pages/dashboards/IndustryDashboard.tsx)):**
> - `resumeData`: Structured ATS resume object containing `fullName`, `headline`, `email`, `phone`, `location`, `linkedin`, `github`, `website`, `summary`, `skills`, `education[]`, `experience[]`, `certifications[]`, and `projects[]` (`title`, `technologies`, `link`, `description`). Rendered in full by the ATS Resume Viewer modal with printable PDF support.

---

### 5. `Assessment` Schema
**File:** [server/models/assessmentModel.ts](file:///server/models/assessmentModel.ts)  
**Collection:** `assessments`

```ts
interface IAssessmentQuestion {
    questionId: string;
    questionText: string;
    type?: "mcq" | "writing";                 // default: "mcq"
    difficultyLevel?: "easy" | "medium" | "writing";
    concept?: string;
    options: string[];
    correctOptionIndex: number;                // 0-based option index
    explanation?: string;
    weight: number;                            // default: 1
}

interface IAssessment extends Document {
    title: string;                             // required, trimmed
    description: string;
    category: "Technical" | "Aptitude" | "Domain"; // default: "Technical"
    skillVectors: string[];                    // e.g. ["Python", "Data Engineering"]
    durationMinutes: number;                   // default: 15
    passPercentage: number;                    // default: 70
    difficulty: "Beginner" | "Intermediate" | "Advanced"; // default: "Intermediate"
    questions: IAssessmentQuestion[];
    badgeAwarded: string;                      // e.g. "Certified Python Practitioner"
    createdBy?: Types.ObjectId;                // ref: "User"
    createdAt: Date;
    updatedAt: Date;
}
```

---

### 6. `AssessmentResult` Schema
**File:** [server/models/assessmentResultModel.ts](file:///server/models/assessmentResultModel.ts)  
**Collection:** `assessmentresults`  
**Relations:** `studentId` -> references `User._id`, `assessmentId` -> references `Assessment._id`

```ts
interface IAssessmentAnswer {
    questionId: string;
    selectedOptionIndex: number;
    writtenAnswer?: string;
    timeTakenSeconds?: number;
    isFlaggedAI?: boolean;
    isCorrect: boolean;
}

interface IAssessmentResult extends Document {
    studentId: Types.ObjectId;                 // ref: "User", required, index: true
    assessmentId: Types.ObjectId;              // ref: "Assessment", required
    assessmentTitle: string;
    score: number;                             // Number of correct answers
    totalQuestions: number;
    percentage: number;                        // score / totalQuestions * 100
    passed: boolean;                           // percentage >= passPercentage
    badgeAwarded?: string;
    verifiedSkillsAdded: string[];             // Automatically injected into Profile.skills
    answers: IAssessmentAnswer[];
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
```

---

### 7. `AiLog` Schema
**File:** [server/models/aiLogModel.ts](file:///server/models/aiLogModel.ts)  
**Collection:** `ailogs`  
**TTL Index:** `createdAt: 1` with `expires: 604800` (7 days)  
**Static Cleaner:** `aiLogSchema.statics.pruneIfThresholdExceeded(maxAllowed: 500)`

```ts
interface IAiLog extends Document {
    userId?: Types.ObjectId;                   // ref: "User", index: true
    userRole: string;                          // default: "anonymous"
    query: string;                             // required user prompt
    response: string;                          // required AI response
    tokensUsed: number;                        // default: 0
    modelUsed: string;                         // default: "grok-2-1212"
    createdAt: Date;                           // auto-expires after 7 days via TTL
}
```
