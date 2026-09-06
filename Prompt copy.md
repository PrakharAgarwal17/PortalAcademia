@Info.md

Role & Operating Scope:
You are strictly an expert Client-Side Frontend Engineer working inside `/client` (Vite + React + TypeScript + Tailwind CSS + shadcn/ui).
The backend server is already implemented in `../server`. 
- DO NOT edit, modify, or create files inside `/server`.
- Inspect the `/server` routes solely as a reference contract to confirm exact endpoint paths, request bodies, and token payloads for Auth.
- ZERO mock servers (no MSW, no local proxy tools). Consume the backend directly via client-side `fetch`.

Architecture & File Organization Rules:
1. Routing & State:
   - Root routing: `src/App.tsx` via `react-router-dom` (v6+).
   - Redux store in `src/context/store.ts` with `authSlice.ts` managing:
     `user: { email: string; role?: string; isVerified: boolean; isOnboarded: boolean } | null`
     `token: string | null`
     `isAuthenticated: boolean`
     `isLoading: boolean`
     `error: string | null`
   - Export typed hooks: `useAppDispatch` and `useAppSelector`.
2. In-File API Contracts:
   - Do NOT create any centralized `src/api/` or `src/services/` directories.
   - All `fetch` calls must live directly inside the consuming component/page (or its RTK slice), preceded by:
     /**
      * @description What this network call does
      * @param {ExpectedType} payload - Input payload or parameters
      * @returns {Promise<ExpectedResponseType>} Output response
      * @throws {Error} HTTP status handling
      */
3. UI Components:
   - Build upon shadcn/ui components (`@/components/ui/*`).

---

UI Flow to Implement (STRICTLY Page-by-Page):
Do NOT build the Student, Faculty, Recruiter, or Admin dashboards yet. Build ONLY the following:

1. Landing Page (`src/pages/LandingPage.tsx`):
   - Hero banner: Academia-Industry Collaboration platform.
   - Platform feature cards and CTA buttons routing to `/auth`.

2. Authentication Page (`src/pages/AuthPage.tsx`):
   - Dual Mode tabs: "Sign In" and "Sign Up".
   - Sign In: Email, Password, "Forgot Password?", and "Continue with Google" button.
   - Sign Up: Email, Password, Confirm Password, and "Continue with Google" button.
   - OTP Verification Modal/Screen: Triggered after SignUp submission. Accepts 6-digit OTP sent to the user's email.
   - On verification success, inspect `isOnboarded`:
     * If `isOnboarded === false` -> Redirect to `/onboarding/select-type`.
     * If `isOnboarded === true` -> Redirect to `/dashboard` (just create a blank placeholder for `/dashboard` for now).

3. Multi-Step Onboarding Flow:
   - Screen A: Account Type Selector (`src/pages/onboarding/SelectAccountType.tsx`):
     * Choose between: "Individual" or "Organization".
   - Screen B: Individual Onboarding (`src/pages/onboarding/IndividualOnboarding.tsx`):
     * Profile Image upload preview.
     * Full Name (required).
     * Role Selector toggle: "Student" or "Faculty".
     * Institution Email & Institution dropdown selector.
     * OTP verification trigger for the institution email (showing a verified badge like LinkedIn upon confirmation).
     * Accordion / Collapsible section for Optional Data (Note: "Too much to fill at start"):
       - Education: Degree/Course, Timeline, Description, "+ Add Education".
       - Past Experience: Title, Timeline, Description, Image Upload.
       - Certifications: Upload certificate file, Title, Description.
       - Skills tag selector.
   - Screen C: Organization Onboarding (`src/pages/onboarding/OrganizationOnboarding.tsx`):
     * Organization Type toggle: "Institution" or "Industry".
     * If Institution:
       - Institution Name (dropdown with AISHE database reference indicator).
       - Official institutional domain email selector/crawler dropdown with OTP trigger.
       - Location dropdown.
     * If Industry:
       - Industry Type & Company Name.
       - Official Website URL.
       - Work Email with Send OTP / OTP verification.
       - Company Location & Employee size bracket dropdown.

Ensure strict TypeScript (no `any`), full loading/error states, and pixel-accurate alignment with the provided Excalidraw design. Begin generating the codebase starting from the Redux store, App routing, and Auth flow.