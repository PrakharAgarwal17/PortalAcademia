# Architecture & System Design — PortalAcademia

> **SIH 2026 Problem Statement 26044 (Ministry of Ayush)**  
> Centralized, high-density Academia–Industry Collaboration Platform connecting Students, Faculty, Higher Education Institutions, and Industry Partners into a unified four-sided competency and opportunity exchange.

---

## 1. System Overview

PortalAcademia addresses the structural gap between university curricula and enterprise workforce demands. It eliminates unverified resumes, unmeasured skill claims, and isolated academic research through five integrated subsystems:
1. **Four-Pillar Role Subsystems**: Dedicated workspaces with role-locked navigation and tailored capabilities for **Student**, **Faculty**, **Institution**, and **Industry**.
2. **Deterministic Credential Verification Gate**: Institutions cryptographically verify student certifications, research, and projects before they appear on enterprise talent pipelines.
3. **Objective Skill Match & ATS Scoring**: Direct competency overlap and ATS formatting scoring matching student capabilities to live industry opportunities.
4. **Objective Skill Assessment Engine**: Standardized technical benchmark assessments yielding tamper-evident competency badges and verified skill tags.
5. **Contextual AI Career Guide**: LLaMA-3/Groq-powered conversational mentor with dynamic profile context injection and storage-preserving TTL safeguards.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + TypeScript + Vite)"]
        UI[Tailwind CSS v3 + Radix UI]
        Router[React Router DOM v7]
        Store[Redux Toolkit Store\nauthSlice & profileSlice]
    end

    subgraph Gateway ["Transport & Security"]
        CORS[CORS credentials:true]
        Cookie[HttpOnly JWT Cookie / Session]
        RBAC[RBAC Middleware\nStudent | Faculty | Institution | Industry]
    end

    subgraph Server ["Server Layer (Express 5 + TypeScript / tsx)"]
        Controllers[9 Specialized Controllers]
        Routes[10 Express Route Modules]
        GroqEngine[Groq AI Mentor\nLLaMA-3 API]
    end

    subgraph Storage ["Data & Cache Infrastructure"]
        MongoDB[(MongoDB 7.0 / Atlas\nMongoose 9)]
        Redis[(Redis 7 / In-Memory Fallback\nioredis 6)]
        Cloudinary[Cloudinary CDN\nResumes & Verification Media]
    end

    Client <-->|fetch credentials:include| Gateway
    Gateway <--> Server
    Server <--> MongoDB
    Server <--> Redis
    Server <--> Cloudinary
    Server <-->|Mentorship Inference| GroqEngine
```

---

## 2. Technology Stack

### Client Architecture
| Category | Technology | Version | Purpose / Scope |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.2.8` | Core UI rendering engine |
| **Language** | TypeScript | `~6.0.2` | Strict client-side typing across components and store |
| **Build Tool** | Vite | `^8.2.2` | Fast HMR dev server and ESBuild/Rollup production bundling |
| **Routing** | React Router DOM | `^7.18.3` | Client-side routing, route-level role protection, route guards |
| **State Management** | Redux Toolkit | `^2.12.0` | Global state for auth session and profile entities |
| **React-Redux** | React-Redux | `^9.3.0` | Typed hooks (`useAppDispatch`, `useAppSelector`) |
| **Styling** | Tailwind CSS | `^3.4.19` | Anti-slop enterprise UI, Swiss typographic density, 0-6px radiuses |
| **UI Primitives** | Radix UI | Various | Unstyled accessible primitives (Dialog, Tabs, Accordion, Checkbox) |
| **Icons** | Lucide React / Simple Icons | `^1.41.0` / `^16.30.0` | Enterprise iconography and verified brand/tech logos |
| **Charts / Telemetry**| Recharts | `^3.10.1` | Cohort distributions, radar competency maps, trend analytics |
| **PDF Generation** | jsPDF | `^4.2.1` | Client-side ATS resume export directly from verified profile |
| **Institutions DB** | aishe-institutions-list | `^1.0.7` | AISHE standardized university/college autocomplete |

### Server Architecture
| Category | Technology | Version | Purpose / Scope |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js (ESM) | `>= 20.x` | Modern ECMAScript Modules runtime |
| **Framework** | Express | `^5.2.1` | REST API routes, middleware pipeline, and error handling |
| **Language** | TypeScript | `^7.0.2` | Transpiled and watched via `tsx watch app.ts` |
| **Database** | MongoDB / Mongoose | `^9.9.5` | Document database, relational population, aggregation pipelines |
| **In-Memory Cache** | Redis / ioredis | `^6.0.0` | OTP rate limiting, transient caching with in-memory fallback |
| **Authentication** | Passport.js / JWT | `^0.7.0` / `^9.0.3`| Google OAuth 2.0, local bcrypt hashing, httpOnly JWT cookies |
| **Media Storage** | Cloudinary | `^2.11.0` | Storage for resumes, verified certificates, and brand logos |
| **File Uploads** | Multer | `^2.3.0` | Multipart form processing for media and documents |
| **Email Transporter**| Nodemailer | `^10.0.0` | Cryptographic OTP delivery to institutional emails |
| **AI / Mentorship** | Groq | `API` | Conversational career mentorship via LLaMA-3 |

---

## 3. Directory Blueprint

```
PortalAcademia/
├── .agents/                      # Agent rules, enterprise anti-slop guidelines, IDE skills
├── .repo_docs/                   # Compressed system documentation layer (Active context)
│   ├── ARCHITECTURE.md           # High-level architecture, stack, directory tree, workflows
│   ├── ROUTES_AND_PAGES.md       # Client routes, views, role guards, user flows
│   ├── STATE_AND_DATA.md         # Redux slices, Context APIs, Mongoose schemas, storage keys
│   ├── API_CONTRACTS.md          # Backend REST contracts, payloads, responses, errors
│   ├── COMPONENTS.md             # UI component library, props interfaces, event bindings
│   └── UTILS_AND_SERVICES.md     # Pure utilities, helper functions, vector engine, configs
├── client/                       # Client SPA workspace
│   ├── public/                   # Static assets, SVG icons, role artwork
│   ├── src/
│   │   ├── assets/               # Local bundled illustrations and icons
│   │   ├── components/           # Shared modal and interactive components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProfileEditModal.tsx
│   │   │   ├── ResumeBuilderModal.tsx
│   │   │   ├── SkillBadge.tsx
│   │   │   ├── SkillInput.tsx
│   │   │   ├── SkillTestRunnerModal.tsx
│   │   │   ├── TestConfirmationModal.tsx
│   │   │   └── UserProfileModal.tsx
│   │   ├── context/              # RTK store, slices, and React context
│   │   │   ├── authSlice.ts      # Authentication state and async thunks
│   │   │   ├── profileSlice.ts   # Profile state and async thunks
│   │   │   ├── store.ts          # Store configuration and typed hooks
│   │   │   └── theme.tsx         # Light/Dark mode ThemeContext
│   │   ├── lib/                  # Utilities
│   │   │   ├── skillIcons.ts     # Map skills to icons and badges
│   │   │   └── utils.ts          # cn() Tailwind class merge utility
│   │   ├── pages/                # Page route views
│   │   │   ├── dashboards/       # Role-specific workspaces
│   │   │   │   ├── DashboardRouter.tsx       # Dynamic router based on user role
│   │   │   │   ├── StudentDashboard.tsx      # Student metrics, jobs, assessments
│   │   │   │   ├── FacultyDashboard.tsx      # Sabbaticals, FDPs, research
│   │   │   │   ├── InstitutionDashboard.tsx  # Verification queue, endorsements, telemetry
│   │   │   │   └── IndustryDashboard.tsx     # Postings, candidate funnel, analytics
│   │   │   ├── institution/      # Institution directory and member profiles
│   │   │   │   ├── InstitutionDirectoryPage.tsx
│   │   │   │   └── InstitutionMemberProfilePage.tsx
│   │   │   ├── onboarding/       # Multi-step persona onboarding
│   │   │   │   ├── OnboardingIndividual.tsx   # Student / Faculty onboarding
│   │   │   │   └── OnboardingOrganization.tsx # Institution / Industry onboarding
│   │   │   ├── trends/           # Advanced analytics and market trend views
│   │   │   │   ├── FacultyTrendsPage.tsx
│   │   │   │   ├── InstitutionTrendsPage.tsx
│   │   │   │   ├── StudentDiagnosisPage.tsx
│   │   │   │   └── StudentTrendsPage.tsx
│   │   │   ├── AiGuidePage.tsx               # Context-aware AI career counselor
│   │   │   ├── ApplicationsTrackerPage.tsx   # Student job application pipeline tracker
│   │   │   ├── AuthPage.tsx                  # Sign In / Sign Up with Google & Email OTP
│   │   │   ├── DashboardPlaceholder.tsx      # Fallback/skeleton dashboard
│   │   │   ├── FAQPage.tsx                   # Platform FAQs
│   │   │   ├── LandingPage.tsx               # Public high-converting homepage
│   │   │   ├── MarketTrendsPage.tsx          # Public macro market demand trends
│   │   │   ├── OnboardingSelectType.tsx      # Persona selector gate
│   │   │   ├── PrivacyPage.tsx               # Legal privacy policy
│   │   │   ├── ProfilePage.tsx               # Full stakeholder portfolio view
│   │   │   ├── SkillAssessmentsPage.tsx      # MCQ & technical test catalog
│   │   │   └── TermsPage.tsx                 # Terms of service
│   │   ├── App.tsx               # Root route declarations & route protections
│   │   ├── main.tsx              # React DOM mounting & Store/Provider injection
│   │   └── index.css             # Tailwind base tokens, Swiss typography, variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                       # Backend API service
│   ├── config/                   # Integrations and database connection singletons
│   │   ├── Passport.ts           # Google OAuth 2.0 Passport strategy
│   │   ├── cloudinary.ts         # Cloudinary SDK client configuration
│   │   ├── connectDB.ts          # Mongoose MongoDB connection pooling
│   │   ├── multer.ts             # Disk storage engine for uploads
│   │   └── redisClient.ts        # Redis client with in-memory cache fallback
│   ├── controllers/              # REST request handlers and business logic
│   │   ├── aiController.ts
│   │   ├── analyticsController.ts
│   │   ├── applicationController.ts
│   │   ├── assessmentController.ts
│   │   ├── authController.ts
│   │   ├── onboardingController.ts
│   │   ├── opportunityController.ts
│   │   ├── profileController.ts
│   │   └── verificationController.ts
│   ├── middleware/               # Express request interceptors
│   │   ├── isloggedIn.ts         # JWT verification & session hydration
│   │   ├── multer.ts             # File upload processor
│   │   └── rbacMiddleware.ts     # Role-based route guard gates
│   ├── models/                   # Mongoose schemas and indexes
│   │   ├── aiLogModel.ts         # AI chat logs with TTL indexes
│   │   ├── applicationModel.ts   # Opportunity submissions & status tracking
│   │   ├── assessmentModel.ts    # Question banks & benchmark tests
│   │   ├── assessmentResultModel.ts # Completed test records & scores
│   │   ├── opportunityModel.ts   # Job, internship, FDP listings & criteria
│   │   ├── profileModel.ts       # Detailed user profile & credentials
│   │   └── userModel.ts          # Core authentication credentials & role
│   ├── routes/                   # REST endpoint definitions
│   │   ├── aiRoute.ts
│   │   ├── analyticsRoute.ts
│   │   ├── applicationRoute.ts
│   │   ├── assessmentRoute.ts
│   │   ├── authRoute.ts
│   │   ├── onboardingRoute.ts
│   │   ├── opportunityRoute.ts
│   │   ├── profileRoute.ts
│   │   ├── uploadRoute.ts
│   │   └── verificationRoute.ts
│   ├── scripts/
│   │   └── seedDatabase.ts       # Database seeder with sample accounts & listings
│   ├── app.ts                    # Express app initialization, middleware, routes, listener
│   └── package.json
└── docker-compose.yml            # Local development orchestration (MongoDB 7 & Redis 7)
```

---

## 4. Core Global Workflows

### 4.1 Authentication & Session Hydration
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client (Redux)
    participant Server as Express Server
    participant DB as MongoDB

    alt Local Credentials & OTP
        User->>Client: Submit Email & Password
        Client->>Server: POST /api/auth/login {email, password}
        Server->>DB: Validate User & Hash
        Server-->>Client: Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax
    else Google OAuth
        User->>Client: Click "Sign in with Google"
        Client->>Server: GET /api/auth/google
        Server->>User: Redirect to Google Accounts
        User->>Server: Callback /api/auth/google/callback
        Server-->>Client: Set-Cookie: token=<jwt>; HttpOnly; Redirect to /dashboard
    end

    Note over Client,Server: Hydration on Mount (App.tsx)
    Client->>Server: GET /api/auth/check-auth (credentials: "include")
    Server->>Server: isloggedIn middleware decodes JWT
    Server->>DB: Fetch User & Profile
    Server-->>Client: Return { user, profile }
    Client->>Client: Redux store receives checkAuthThunk.fulfilled
```

### 4.2 Role-Based Access Control & Dynamic Routing
1. Client-Side: `DashboardRouter.tsx` inspects `user.role` from Redux:
   - `student` -> Renders `StudentDashboard.tsx`
   - `faculty` -> Renders `FacultyDashboard.tsx`
   - `institution` -> Renders `InstitutionDashboard.tsx`
   - `industry` -> Renders `IndustryDashboard.tsx`
2. Server-Side: `rbacMiddleware.ts` enforces strict boundary checking:
   - `isStudent`: Only students can apply to opportunities or take skill assessments.
   - `isFaculty`: Access to academic sabbaticals, research listings, and FDP registries.
   - `isInstitution`: Access to credential verification queue and institutional endorsements.
   - `isIndustry`: Access to posting opportunities and candidate shortlisting pipeline.

### 4.3 Opportunity Application & Competency Matching
1. Opportunity Publication: When Industry creates an opportunity (`POST /api/opportunities`), required skills and criteria are indexed.
2. Candidate Application: Students apply (`POST /api/applications`), submitting structured ATS resume data.
3. Competency Matching:
   - System calculates deterministic match score ($0-100\%$) based on candidate skills overlapping with required skills.
   - Computes ATS compliance score ($0-100\%$) evaluating profile completeness and structural clarity.
   - Opportunity applications are sorted by match score descending.

### 4.4 Institutional Credential Verification Gate
```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Client
    participant Server
    actor College as Institution Admin

    Student->>Client: Upload Certificate / Project proof
    Client->>Server: POST /api/upload (Cloudinary)
    Server-->>Client: Secure URL
    Client->>Server: PUT /api/profile/credential (Added with isVerified: false)
    College->>Server: GET /api/verification/pending
    Server-->>College: List unverified credentials for affiliated students
    College->>Server: PUT /api/verification/approve/:credentialId
    Server->>Server: Set isVerified: true, verifiedBy: institutionId, timestamp
    Server-->>College: 200 OK
    Note over Student,College: Verified badge is now visible to Recruiters in applicant pool
```

---

## 5. Security & Network Topology

### HttpOnly Cookie Specification
- Authentication tokens are stored strictly inside HTTP-only cookies (`token`), rendering them immune to XSS token theft.
- No JWTs or sensitive user credentials are saved in `localStorage` or `sessionStorage`.
- `credentials: "include"` is mandatorily attached to every client `fetch` call.

### CORS Architecture
- Whitelisted origin: `process.env.FRONTEND_URL` (defaulting locally to `http://localhost:5173`).
- Allowed HTTP Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- `credentials: true` enabled on both Express `cors()` middleware and Vite client proxy.

### Database Guardrails & MongoDB Atlas Free-Tier Protection
- `AiLog` documents have an active MongoDB TTL index (`expireAfterSeconds: 604800` / 7 days).
- Automatic document count threshold cleaner ensures total chat log count stays under 500 documents.
- Redis client utilizes automatic graceful fallback to in-memory key-value maps if external Redis server is unreachable.

---

## 6. Environment Configuration Reference

### Server Environment (`server/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | No | Express HTTP server port | `3000` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://root:rootpassword@localhost:27017/PortalAcademia?authSource=admin` |
| `JWT_SECRET` | Yes | Secret key for signing session tokens | `supersecretjwtkey...` |
| `SESSION_SECRET`| Yes | Secret for Express session middleware | `default_session_secret_portal_academia` |
| `FRONTEND_URL` | Yes | Client origin for CORS headers | `http://localhost:5173` |
| `REDIS_URL` | No | Connection URI for Redis | `redis://localhost:6379` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API public key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | `your_api_secret` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth 2.0 Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth 2.0 Secret | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | No | Google OAuth Redirect URI | `http://localhost:3000/api/auth/google/callback` |
| `EMAIL_USER` | No | SMTP user for OTP delivery | `admin@portalacademia.edu` |
| `EMAIL_PASS` | No | SMTP password / app password | `app_password` |
| `GROQ_API_KEY` | No | API Key for Groq LLaMA-3 Career Bot | `gsk_...` |

### Client Environment (`client/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | Backend server root endpoint | `http://localhost:3000` |
