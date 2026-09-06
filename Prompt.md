@Info.md

Role & Scope:
You are strictly an expert Client-Side Frontend Engineer operating entirely inside the `/client` directory (Vite + React + TypeScript + Tailwind CSS + shadcn/ui).
The scope is 100% limited to the browser runtime.

Hard Backend & Architectural Restrictions:
- DO NOT inspect, edit, or create files inside `/server`.
- ZERO backend code: No Node.js, Express, databases, models, Prisma, or backend schemas.
- NO Mock Servers: Do not install or implement MSW (Mock Service Worker), json-server, or local proxy endpoints.
- Treat the backend as an external, black-box REST API consumed via native browser `fetch`.
- In-File Network Calls: Do NOT create any centralized `src/api/` or `src/services/` directories. Any API function must be written directly inside the component/slice that calls it, preceded by the standard JSDoc block.

Phase 1 Objective:
Build ONLY the foundation, routing, authentication flow, and landing page. Do NOT build student, faculty, recruiter, or admin dashboards yet.

Deliverables:

1. Global Setup & State (`client/src/context/` & `client/src/App.tsx`):
   - Configure Redux Toolkit store in `src/context/store.ts` and authentication slice in `src/context/authSlice.ts`.
   - Manage state: `user: { email: string; role: 'STUDENT' | 'FACULTY' | 'RECRUITER' | 'INSTITUTION_ADMIN' } | null`, `token: string | null`, `isAuthenticated: boolean`, `isLoading: boolean`, `error: string | null`.
   - Export typed hooks: `useAppDispatch` and `useAppSelector`.
   - Configure `react-router-dom` in `src/App.tsx` with routes for `/` (LandingPage) and `/auth` (AuthPage).

2. Shared Layout (`client/src/components/`):
   - `Navbar.tsx`: Responsive navigation with logo, platform links, and a CTA button routing to `/auth`.
   - `Footer.tsx`: Standard footer displaying platform branding and links.

3. Landing Page (`client/src/pages/LandingPage.tsx`):
   - Hero section communicating the value proposition of bridging academia and industry.
   - Core pillar cards (Skill Gap Analysis, Verified Portfolios, Internships/Jobs, Faculty Training) built with shadcn/ui `<Card>`.
   - Clear CTA button redirecting to `/auth`.

4. Authentication Page (`client/src/pages/AuthPage.tsx`):
   - Centered shadcn `<Card>` with tabs toggling between "Login" and "Register".
   - State-driven view transition:
     * Mode 1: "login" (Email, Password, "Continue with Google" button, link to switch to register).
     * Mode 2: "register" (Full Name, Email, Password, Role Selector dropdown/radio for Student, Faculty, Recruiter, Institution Admin).
     * Mode 3: "otp-verify" (Triggered after successful register/login submission; displays a 6-digit OTP input field, email recipient notice, "Verify OTP" button, and "Resend OTP" link).
   - Use shadcn/ui components (`@/components/ui/button`, `@/components/ui/input`, `@/components/ui/card`, `@/components/ui/tabs`, `@/components/ui/label`, `@/components/ui/badge`).
   - Every fetch function (`loginApi`, `registerApi`, `verifyOtpApi`, `googleAuthApi`) must be declared directly inside `AuthPage.tsx` and preceded by the exact JSDoc contract:
     /**
      * @description What this network call does
      * @param {ExpectedType} payload - Input payload
      * @returns {Promise<ExpectedResponseType>} Output response
      * @throws {Error} HTTP status handling
      */

Quality & Types:
- Strict TypeScript: Define interfaces for all payloads, form states, and component props. Zero `any`.
- Implement visible loading indicators (`isLoading`) on buttons and display clear error message banners (`error`) if a call fails.

Generate the complete code for Phase 1 now.