# Project Specification: Academia-Industry Collaboration Portal (SIH 26044)

## 1. Scope & Execution Context
* **Execution Boundary:** Client-Side Single Page Application (SPA) only.
* **Workspace Context:** Target root is `client/` (Vite + React + TypeScript). Do not alter or inspect `server/`.
* **UI/UX Foundation:** Tailwind CSS utility styling with accessible Radix / shadcn-style component patterns.

---

## 2. Core Stakeholders & Present Feature Scope

### A. Students
* **Skill Assessment:** Questionnaires and aptitude evaluations computing category-wise competencies.
* **Skill Gap Visualization:** Radar / visual comparison showing student proficiency against industry role requirements.
* **Curated Learning Paths:** Dynamic learning recommendations targeting identified skill gaps.
* **Digital Portfolio:** Verified showcase aggregating projects, credentials, and achievements.
* **Resume Builder:** Dynamic ATS-friendly CV tailoring based on selected job/internship criteria.
* **Internship & Placement Desk:** Search, filter, apply, and monitor active application states.
* **AI HelpBot Drawer:** Client-side contextual chat drawer for platform navigation and guidance.
* **Peer Community:** Collaborative discussion feeds, doubts, and peer learning threads.

### B. Faculty
* **Industry Exposure Portal:** Discovery feed to explore and apply for domain-specific industry internships.
* **Faculty Upskilling:** Directory of Faculty Development Programs (FDPs) and corporate technical workshops.
* **Collaboration Board:** Proposal submission and tracking for industrial consultancy and research.

### C. Industry / Recruiters
* **Opportunity Management:** Interface to publish jobs, internships, apprenticeships, and live projects.
* **Applicant Review Desk:** Pipeline tracking candidate stages, skill compatibility scores, and resumes.
* **Corporate Initiatives:** Announce sponsored training tracks, hackathons, and webinars.

### D. Institutions / Placement Cell
* **Cohort Analytics:** High-level metrics tracking cohort placement rates, readiness distributions, and market trends.
* **Roster Management:** Central directory of student, faculty, and alumni records.
* **Document Verification Queue:** Interface to review, approve, or reject student credentials.

---

## 3. Future Scope / Roadmap (Marked as [FUTURE])
> **Notice:** The following features are strictly future enhancements. In the present frontend build, render them ONLY as disabled UI badges, placeholders, or informational roadmap tooltips:

1. **[FUTURE] Vector Hybrid Shortlisting:** Embedding-based semantic candidate ranker (`pgvector` + cosine similarity).
2. **[FUTURE] RAG-Powered AI Screener:** Contextual interview agent & dynamic syllabus synthesizer.
3. **[FUTURE] Cryptographic Credential Verification:** On-chain / SHA-256 tamper-proof credential verification tokens.
4. **[FUTURE] Closed-Loop Curriculum Telemetry:** Automated institutional alerts for systemic student skill deficits.
5. **[FUTURE] Ayush & AIIA Domain Taxonomies:** Domain-specific modules for EHR/FHIR, pharmacovigilance, and phytochemistry.

---

## 4. Architectural Rules & Code Standards

1. **Role-Based Access Control (RBAC):**
   * Routes wrapped with protection for 4 distinct scopes: `STUDENT`, `FACULTY`, `RECRUITER`, `INSTITUTION_ADMIN`.
2. **State Management:**
   * Redux Toolkit store in `client/src/context/` exporting typed `useAppDispatch` and `useAppSelector` hooks.
3. **In-File API Boundaries:**
   * No standalone `api/` or `services/` directory. Network calls reside directly within the consuming component or page.
   * Every network call must include the following JSDoc block:
     ```typescript
     /**
      * @description What this network call does
      * @param {ExpectedType} payload - Input payload or parameters
      * @returns {Promise<ExpectedResponseType>} Output response
      * @throws {Error} HTTP status handling
      */
     ```
4. **UI Quality & Async States:**
   * Explicit handling for `isLoading`, `isError`, and empty datasets across all views.
   * Strict TypeScript types/interfaces without using `any`.