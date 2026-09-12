# PortalAcademia

> **Smart India Hackathon 2026 — Problem Statement 26044**  
> **Enterprise Academia-Industry Collaboration & Career Readiness Platform**  
> Bridging the critical gap between institutional engineering curriculum and dynamic real-world industry demands through verified competencies, AI-driven assessments, corporate sabbaticals, and telemetry-backed talent pipelines.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Architecture & Tech Stack](#core-architecture--tech-stack)
3. [Stakeholder Portals & Capabilities](#stakeholder-portals--capabilities)
   - [Student Dashboard](#1-student-dashboard)
   - [Faculty Immersion Portal](#2-faculty-immersion-portal)
   - [Industry & Corporate Console](#3-industry--corporate-console)
   - [Institution Administration Portal](#4-institution-administration-portal)
4. [AI Engine & Real-Time Assessment System](#ai-engine--real-time-assessment-system)
5. [Market & R&D Trends Analytics](#market--rd-trends-analytics)
6. [Project Structure](#project-structure)
7. [Getting Started & Local Development](#getting-started--local-development)
   - [Prerequisites](#prerequisites)
   - [1. Clone & Dependencies](#1-clone-repository)
   - [2. MongoDB & Redis Setup](#2-start-mongodb--redis)
   - [3. Server Configuration](#3-configure-the-server)
   - [4. Client Configuration](#4-configure-the-client)
   - [5. Database Seeding](#5-seed-the-database)
8. [API Route Contract Reference](#api-route-contract-reference)
9. [Design & UI Standards](#design--ui-standards)
10. [License](#license)

---

## Platform Overview

Traditional academia-to-industry pathways suffer from fragmented syllabus alignment, delayed curriculum modernization, and superficial resume screening. **PortalAcademia** establishes an end-to-end ecosystem connecting:
- **Students** seeking vetted technical internships, hackathons, and certified competencies.
- **Faculty** advancing national R&D grants, corporate sabbaticals, FDPs, and CAS credits.
- **Industry Partners** hiring high-fit candidates with verified skill match scores and screening pipelines.
- **Institutions** tracking accreditation metrics (NBA, NAAC, OBE CO-PO mapping) and endorsing vetted opportunities.

---

## Core Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Vite + React 19)                      │
│   Tailwind CSS v3 · shadcn/ui · Redux Toolkit · Lucide · Simple Icons  │
│   Recharts Telemetry · Responsive Stakeholder Navigation & Modals      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  HTTP (Credentials: include / httpOnly Cookie)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND (Express v5 + Node.js)                 │
│   Strict TypeScript · Mongoose ODM · Session & RBAC Middleware         │
│   Nodemailer (OTP Engine) · Multer & Cloudinary (Media CDN)            │
└───────────────┬───────────────────┬───────────────────┬────────────────┘
                │                   │                   │
    ┌───────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
    │      MongoDB 7      │ │  Redis Caching │ │  Groq AI Cloud  │
    │  (Users, Profiles,  │ │  (Telemetry &  │ │ (Llama 3.3 70B  │
    │   Opps, Apps, Logs) │ │   Rate-limits) │ │  Dynamic Tests) │
    └─────────────────────┘ └────────────────┘ └─────────────────┘
```

| Layer | Technologies & Libraries |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v3, Redux Toolkit, React Router v7, Lucide Icons, Simple Icons SVG mapping, Recharts |
| **Backend** | Node.js 20+, Express v5, TypeScript, Mongoose ODM, Cookie-parser, CORS, Dotenv, Bcrypt |
| **Database & Cache** | MongoDB 7.0+, Redis (Distributed cache with graceful in-memory fallback) |
| **AI Intelligence** | Groq Cloud API (`llama-3.3-70b-versatile`) for dynamic assessment generation & contextual chat advisors |
| **Media & Storage** | Cloudinary API via Multer for high-resolution avatars and cover banners |
| **Email & Auth** | Nodemailer (secure transactional email OTPs), Google OAuth 2.0, httpOnly JWT cookies |

---

## Stakeholder Portals & Capabilities

### 1. Student Dashboard
- **Live Opportunity Feed**: Filter curated internships, hackathons, and technical masterclasses by domain, mode (Remote/Hybrid/On-site), or category.
- **Real-Time Skill Match Scoring**: Algorithmic match percentage calculating student profile competencies against opportunity prerequisites.
- **Verified Brand Badges**: Autocomplete integration with 3000+ Simple Icons SVGs for verified tech stacks (Python, Docker, React, PyTorch, Kubernetes, etc.).
- **Interactive Proposal Desk**: One-click application modal with custom cover notes and applicant tracking.
- **AI Career Mentor**: Contextual chat drawer analyzing missing skills and preparing students for competitive interviews.

### 2. Faculty Immersion Portal
- **Academic Immersion Feed**: Discovery of premier Faculty Development Programs (FDPs), DST-SERB / co-funded clean energy research grants, IEEE conferences, and corporate sabbaticals (DRDO, Intel VLSI).
- **Institutional Endorsements**: Opportunities tagged with official recommendations from academic councils and dean offices.
- **CAS & MHRD Credit Alignment**: Advisory telemetry indicating which programs grant statutory CAS points for academic promotions.
- **AI Academic Advisor**: Contextual assistant answering queries on IP frameworks, patent applications, and corporate research residencies.

### 3. Industry & Corporate Console
- **Recruitment Pipeline**: Real-time review table showing applicants, verified match scores, submitted proposals, and applicant institutions.
- **Pipeline Status Transitions**: Manage applicants with direct state actions (`Under Review`, `Shortlisted`, `Interviewing`, `Accepted`, `Rejected`).
- **Opportunity Publisher**: Create, edit, and close technical job postings, hackathons, and sabbaticals with custom skill vectors and compensation tiers.
- **Hiring Telemetry**: Visual metrics tracking applicant count, average candidate match quality, and hiring pipeline health.

### 4. Institution Administration Portal
- **Accreditation Telemetry**: Monitor institutional readiness, NIRF/NBA quality indicators, and outcome-based education metrics.
- **Opportunity Endorsement Gate**: Officially endorse and recommend corporate postings to the university's student or faculty cohorts.
- **Roster & Verification Desk**: Oversee student academic records and faculty credentials with AISHE institutional mapping.

---

## AI Engine & Real-Time Assessment System

PortalAcademia features an on-demand technical testing engine powered by Groq's high-speed Llama 3.3 70B model:

1. **On-Demand Generation (`POST /api/assessments/generate-for-user`)**:
   - Any user (student or faculty) can select any skill (or enter a custom technology).
   - Groq dynamically formats 5 targeted, conceptual multiple-choice questions with balanced weights, real-world scenarios, and detailed explanations.
2. **Standardized Assessment Runner Modal**:
   - Countdown timer per question with auto-submission on expiration.
   - Immediate scoring feedback, pass/fail thresholds (70%), and in-depth answer explanations.
3. **Automated Accreditation Badge**:
   - Passing an assessment automatically marks the skill as **Verified** across the user's public profile, dashboard badges, and recruiter candidate tables.

---

## Market & R&D Trends Analytics

Dedicated market intelligence portals built with **Recharts**:

- **Student Trends (`/trends/student`)**:
  - Top 10 in-demand industry skill vectors (AI/ML, Cloud & DevOps, Full-Stack, Cyber, VLSI).
  - Salary distribution brackets for fresh graduates (₹4 LPA to ₹45+ LPA).
  - Hiring velocity by domain and quarterly corporate recruitment volumes.
- **Faculty Trends (`/trends/faculty`)**:
  - Statutory R&D grant allocations by national agencies (MeitY C2S, DST-SERB, DRDO CARS, CSIR, ICMR Health-AI).
  - Scopus and IEEE publication velocity benchmarks.
  - National Education Policy (NEP 2020) curriculum modernization and patent indexing.

---

## Project Structure

```
PortalAcademia/
├── client/                           # Vite + React 19 Frontend SPA
│   ├── src/
│   │   ├── components/               # Navbar, SkillBadge, SkillInput, Modals
│   │   │   ├── Navbar.tsx            # Contextual multi-role header
│   │   │   ├── ProfileEditModal.tsx  # Granular section-by-section profile editor
│   │   │   ├── SkillBadge.tsx        # Dynamic brand badge with SVG & tested checkmark
│   │   │   ├── SkillInput.tsx        # Autocomplete search with Simple Icons
│   │   │   ├── SkillTestRunnerModal  # Timed assessment engine
│   │   │   └── TestConfirmationModal # AI test generation prompt
│   │   ├── context/                  # Redux store, authSlice, profileSlice, theme
│   │   ├── lib/                      # Pure utilities (cn, skillIcons, formatters)
│   │   └── pages/                    # Stakeholder dashboards & feature views
│   │       ├── dashboards/           # Student, Faculty, Industry, Institution
│   │       ├── trends/               # StudentTrendsPage, FacultyTrendsPage
│   │       ├── onboarding/           # Individual & Organization multi-step onboarding
│   │       ├── AuthPage.tsx          # Sign In & Sign Up with email OTP
│   │       ├── ProfilePage.tsx       # Comprehensive public & self profile console
│   │       ├── SkillAssessmentsPage  # Assessment directory & AI generator
│   │       └── LandingPage.tsx       # Institutional landing portal
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                           # Express v5 TypeScript Backend API
│   ├── config/                       # connectDB.ts, redisClient.ts
│   ├── controllers/                  # auth, profile, opportunity, application,
│   │                                 # assessment, analytics, ai
│   ├── middleware/                   # isloggedIn.ts, rbacMiddleware.ts
│   ├── models/                       # Mongoose schemas (User, Profile, Opportunity,
│   │                                 # Application, Assessment, AssessmentResult)
│   ├── routes/                       # Express route declarations
│   ├── scripts/                      # seedDatabase.ts seeder utility
│   ├── .env.example
│   └── package.json
│
└── docker-compose.yml                # Local MongoDB container definition
```

---

## Getting Started & Local Development

### Prerequisites
- **Node.js** v20.0.0 or higher
- **npm** v10+
- **Docker Desktop** (for local MongoDB) or an external MongoDB connection string
- *(Optional)* **Redis** for distributed cache (in-memory fallback active by default)
- **Groq API Key** (free tier available at [console.groq.com](https://console.groq.com))

---

### 1. Clone Repository

```bash
git clone https://github.com/Sparsh-2007/PortalAcademia.git
cd PortalAcademia
```

---

### 2. Start MongoDB & Redis

You can launch a local MongoDB instance using the included `docker-compose.yml`:

```bash
docker compose up -d
```

> MongoDB runs on `mongodb://root:rootpassword@localhost:27017` with database name `PortalAcademia`.

---

### 3. Configure the Server

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your environment credentials:

```env
# Database
MONGO_URL=mongodb://root:rootpassword@127.0.0.1:27017

# Security
JWT_PASS_KEY=your_super_secret_jwt_encryption_key_26044
SESSION_SECRET=your_session_secret_key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Email OTP Service (Nodemailer with Gmail App Password)
EMAIL=your_email@gmail.com
PASSWORD=your_16_digit_gmail_app_password

# Groq Cloud AI Key (Llama 3.3 70B Engine)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Cloudinary (Profile Image & Banner Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional Redis Cache
REDIS_URL=redis://127.0.0.1:6379
```

Install dependencies and start the backend development server:

```bash
npm install
npm run dev
# Server running at http://localhost:3000
```

---

### 4. Configure the Client

In a new terminal window:

```bash
cd client
cp .env.example .env
```

Ensure `client/.env` points to your backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Install dependencies and start the client:

```bash
npm install
npm run dev
# Vite dev server running at http://localhost:5173
```

---

### 5. Seed the Database

To instantly populate the database with test accounts, standardized assessments, and active profiles:

```bash
cd server
npx tsx scripts/seedDatabase.ts
```

#### Seeded Test Credentials:
| Stakeholder Role | Email | Password |
|---|---|---|
| **Student** | `student.test@portalacademia.ac.in` | `Password123!` |
| **Faculty** | `faculty.test@portalacademia.ac.in` | `Password123!` |
| **Industry Recruiter** | `industry.test@company.com` | `Password123!` |
| **Institution Admin** | `iitb.admin@portalacademia.ac.in` | `Password123!` |

---

## API Route Contract Reference

Base URL: `http://localhost:3000` (Configurable via `VITE_API_BASE_URL`)

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Send OTP email to register new user |
| `POST` | `/api/auth/verifyotp` | Public | Verify 6-digit OTP, create user, set cookie |
| `POST` | `/api/auth/signin` | Public | Authenticate user, issue httpOnly session cookie |
| `POST` | `/api/auth/SignOut` | Authenticated | Invalidate session and clear cookie |
| `POST` | `/api/auth/checkAuth` | Authenticated | Hydrate Redux state from active cookie |

### Profiles (`/api/profile`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/profile/me` | Authenticated | Retrieve current user's profile |
| `GET` | `/api/profile/:id` | Authenticated | Retrieve public profile by user/profile ID |
| `PUT` | `/api/profile` | Authenticated | Update bio, headline, skills, education, experience |
| `POST` | `/api/profile/avatar` | Authenticated | Upload profile avatar to Cloudinary |

### Opportunities (`/api/opportunities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/opportunities` | Authenticated | Query opportunities with filters (`targetAudience`, `category`, `mode`) |
| `GET` | `/api/opportunities/:id` | Authenticated | Get opportunity details |
| `POST` | `/api/opportunities` | Industry / Inst. | Publish new technical listing |
| `PUT` | `/api/opportunities/:id` | Publisher | Update existing listing details |
| `DELETE` | `/api/opportunities/:id` | Publisher | Close or withdraw listing |
| `POST` | `/api/opportunities/:id/recommend` | Institution | Officially endorse listing for cohort |

### Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/applications` | Student / Faculty | Submit proposal/application for opportunity |
| `GET` | `/api/applications/my-applications` | Authenticated | View current user's submitted proposals |
| `GET` | `/api/applications/opportunity/:id` | Industry / Inst. | Recruiter views applicants pipeline |
| `PUT` | `/api/applications/:id/status` | Industry / Inst. | Update candidate review state |

### Assessments & AI Engine (`/api/assessments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assessments` | Authenticated | List standardized assessments |
| `POST` | `/api/assessments/generate-for-user` | Authenticated | **Groq AI Engine** generates on-demand 5-question test |
| `POST` | `/api/assessments/:id/submit` | Authenticated | Submit answers, calculate score, grant badges |
| `GET` | `/api/assessments/my-results` | Authenticated | Retrieve verified test history |

### AI Advisor (`/api/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Authenticated | Query contextual AI advisor for career or grant advice |

---

## Design & UI Standards

PortalAcademia adheres to an **Anti-Slop Enterprise / Gov-Tech** design philosophy:
- **Swiss Typographic Grid**: High-contrast typography, `tabular-nums` for metrics and timestamps, clean baseline alignment.
- **Surface Architecture**: High density, structure through precise borders (`border-border`), and elimination of blurry glassmorphism blobs.
- **Micro-Radius**: Strict `rounded-sm` to `rounded-xl` boundaries; zero over-rounded bubble cards.
- **Dynamic Feedback**: Comprehensive RTK state handling covering inline skeleton loaders, distinct 2px solid active rings, and instant action feedback.

---

## License

Distributed under the **MIT License**. Created for the **Smart India Hackathon 2026** (Problem Statement 26044).
