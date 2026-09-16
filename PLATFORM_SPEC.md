# PortalAcademia — Comprehensive Platform Specification
## Smart India Hackathon 2026 // Problem Statement 26044 (Ministry of Ayush)

---

## 1. Executive Summary & Problem Definition

### The Systemic Disconnect
A critical disconnect exists between the academic curriculum taught in higher education institutions and the rapidly shifting competencies demanded by modern industry:
- **For Students:** Lack of objective, industry-aligned skill measurement. Students cannot accurately identify their technical and soft skill deficits, leading to mismatched career pursuits, rejected applications, and blind job searching without verified proof of competence.
- **For Faculty:** Academicians have virtually zero direct visibility into industry internship opportunities, industrial sabbaticals, or hands-on domain training, preventing them from incorporating live industry practices into university classrooms.
- **For Higher Education Institutions:** Colleges and universities lack centralized tools to track student competency evolution, monitor industry market trends in real time, or manage student/alumni placement pipelines with granular telemetry.
- **For Industry / Employers:** Recruiters face exorbitant talent acquisition costs, sifting through thousands of unverified resumes, with no standardized mechanism to shortlist candidates based on objective competency vectors.

### The Unified Solution
**PortalAcademia** is a centralized, high-density Academia–Industry Collaboration Platform providing a 4-sided stakeholder exchange connecting:
1. **Students** (Learners & Job Seekers)
2. **Faculty** (Academicians & Researchers)
3. **Institutions** (Universities, Colleges & Placement Cells)
4. **Industry** (Recruiters, Corporates & R&D Labs)

---

## 2. Four-Pillar Stakeholder Breakdown

### Pillar 1: Students (Talent & Career Acceleration)
- **Objective Skill Assessment:** Standardized technical and soft skill evaluation questionnaires and aptitude benchmarks formulated directly from live industry requirements.
- **Skill Profiling & Gap Quantification:** Visual competency mapping against industry trends, pinpointing exact curriculum deficits and strengths.
- **Curated Learning Paths & Resources:** Algorithmic recommendations for targeted courses, certifications, and workshops designed to bridge identified skill gaps.
- **Dynamic Career Roadmaps:** Step-by-step guidance aligned with personal strengths, student aspirations, and live industry market demand.
- **Verified Digital Portfolio:** A unified, tamper-evident digital identity containing verified competencies, projects, certifications, internships, and academic achievements.
- **Skill-Tailored Resume Builder:** Generates structured, ATS-compliant resumes dynamically keyed to target job descriptions.
- **Internship & Job Desk:** Search, apply, and monitor the entire lifecycle of applications for vetted company internships, live projects, and entry-level positions.
- **Peer Community & HelpBot:** Student-to-student discussion forums and integrated AI HelpBot assistance for career orientation.

### Pillar 2: Faculty (Academics & Industrial Immersion)
- **Domain-Specific Faculty Internships:** Dedicated visibility into short-term corporate internships and industrial sabbaticals for teaching staff.
- **Faculty Development Programs (FDPs):** Centralized registry of certified industry training programs, advanced domain workshops, and pedagogical refreshers.
- **Industry Collaboration Desk:** Opportunities for joint research, consultancy contracts, and curriculum co-development with enterprise partners.
- **Classroom Modernization:** Bringing live industry telemetry and case studies directly into university lecture halls.

### Pillar 3: Institutions & Universities (Governance & Telemetry)
- **Cohort & Alumni Management:** Centralized directory and tracking of current undergraduate/postgraduate cohorts and alumni trajectories.
- **Student Skill Telemetry:** Real-time dashboards monitoring average cohort readiness, skill distribution curves, and assessment participation.
- **Market Demand Monitoring:** Predictive analytics tracking industry hiring trends, emerging technology requirements, and localized talent deficits.
- **Placement & Internship Funnel Analytics:** Institutional dashboards tracking application volumes, interview conversions, offer distribution, and employer satisfaction.

### Pillar 4: Industry & Employers (Talent Discovery & Co-Innovation)
- **Direct Opportunity Publishing:** Post internships, entry-level vacancies, apprenticeships, and live problem statements with precise skill prerequisites.
- **Candidate Discovery & Shortlisting Algorithm:** Match applicants based on objective skill profiles and eligibility criteria, bypassing generic keyword searches.
- **Corporate Training & Upskilling Programs:** Publish corporate-sponsored certifications, bootcamps, and pre-skilling programs to train candidates before hiring.
- **Institutional Collaboration:** Direct access to university talent pipelines, faculty experts for consultancy, and collaborative research initiatives.

---

## 3. Collaborative Activity Hub

The platform provides a dedicated collaborative sandbox bridging academia and enterprise:
1. **Innovation Challenges & Hackathons:** Real-world corporate problem statements hosted for student solution sprints.
2. **Live Industry Projects:** Micro-engagements where students earn experience and academic credits working under industry mentors.
3. **Executive Guest Lectures & Seminars:** Seamless booking of industry veterans for campus webinars and physical masterclasses.
4. **1-on-1 Industry Mentorship:** Structured mentorship pairing senior engineers and domain leaders with high-potential students.
5. **Joint Research & Consultancy:** Universities and corporate R&D wings co-publishing patents, papers, and tech transfer prototypes.

---

## 4. Architectural & Security Safeguards

- **Role-Based Access Control (RBAC):** Strict deterministic boundaries separating Student, Faculty, Institution Admin, and Recruiter workspaces via `rbacMiddleware.ts`.
- **HttpOnly Cookie Authentication:** Zero client-side JWT token storage; session state maintained strictly via encrypted, SameSite cookies.
- **Cryptographic OTP Verification:** Mandatory institutional email verification for academic domain legitimacy.
- **Deterministic State Machines:** Redux Toolkit-backed state management ensuring explicit loading, error, and empty state coverage.

---

## 5. Technical Data Models & Schemas

### Core Relational Models (MongoDB / Mongoose)
1. **`User` (`userModel.ts`)**: Authentication identity, credential hashes, provider, verification status, and onboarding flag.
2. **`Profile` (`profileModel.ts`)**: Unified stakeholder metadata, biography, institution link, verified skills, and nested arrays for education, certifications, and experience.
3. **`Opportunity` (`opportunityModel.ts`)**: Listings published by Industry/Institutions (internships, hackathons, workshops, FDPs, sabbaticals) with prerequisite skill vectors, compensation, duration, and college endorsement arrays.
4. **`Application` (`applicationModel.ts`)**: Submissions linked to opportunities with calculated vector match score, status progression (`Applied`, `Under Review`, `Shortlisted`, `Technical Interview`, `Offered`), and recruiter notes.
5. **`Assessment` (`assessmentModel.ts`)**: Standardized question banks, aptitude benchmarks, technical MCQ/coding prompts mapped to target skill vectors (e.g. Python, Cloud, Data Structures).
6. **`AssessmentResult` (`assessmentResultModel.ts`)**: Student test attempts, objective percentage scores, badge awards, and verified competency weights feeding directly into application shortlisting algorithms.
7. **`AiLog` (`aiLogModel.ts`)**: Audit log of Grok/LangChain HelpBOT queries with MongoDB TTL / scheduled cleanup to prevent memory exhaustion.

---

## 6. Real-Time Telemetry & Aggregation Pipelines (`analyticsController.ts`)

Instead of in-memory client-side calculations, high-density telemetry is computed via MongoDB native aggregation pipelines:
1. **Cohort Competency Aggregation (`/api/analytics/institution/cohort`)**:
   - Computes distribution of verified student skills across departments via `$unwind`, `$group`, and `$project`.
   - Generates readiness score curves and identifies systemic curricular deficits.
2. **Industry Hiring Demand Trends (`/api/analytics/industry/market-trends`)**:
   - Aggregates live opportunity skill requirements vs applicant supply to compute market deficit percentages.
3. **Student Gap Quantification (`/api/analytics/student/gap`)**:
   - Computes real mathematical vector distance between a student's verified skills (from assessment results) and top trending industry postings.

---

## 7. Credential Verification Gate (`verificationController.ts`)

1. **Tamper-Evident Digital Portfolio**:
   - Students upload certificates and project URLs with proof of work.
   - Status defaults to `isVerified: false` (Pending Institutional Review).
2. **Institution Verification Queue**:
   - Placement cells and academic authorities access a dedicated queue to review submitted credentials.
   - Route `PUT /api/profile/verify-credential/:studentId/:credentialId` flips `isVerified: true`, granting an official institutional cryptographic badge.

---

## 8. Role-Based Access Control (`rbacMiddleware.ts`)

Strict deterministic guards enforcing endpoint boundaries:
- `isStudent`: Only students can attempt skill assessments (`/api/assessments/:id/submit`) and submit applications (`/api/applications`).
- `isFaculty`: Access to faculty sabbaticals and research collaboration submissions.
- `isInstitution`: Access to credential verification queue (`/api/verification/pending`), credential approval (`/api/profile/verify-credential/...`), cohort telemetry aggregation (`/api/analytics/institution/cohort`), and opportunity endorsements.
- `isIndustry`: Access to candidate shortlisting pipeline (`/api/applications/opportunity/:id`), applicant status progression (`/api/applications/:id/status`), and publishing opportunities (`POST /api/opportunities`).

---

## 9. Contextual AI Career Guide & Free MongoDB Protection (`aiController.ts`, `aiLogModel.ts`)

1. **Profile Context Injection**:
   - Every AI prompt dynamically injects the user's live profile, degree, verified skill tags from assessment scores, and recent application status into the hidden `SystemMessage`.
2. **Free MongoDB Storage Safeguard (TTL & Pruning)**:
   - Chat interactions are logged to `AiLog` with a native MongoDB TTL index (`expires: 60 * 60 * 24 * 7`) to automatically expire records after 7 days.
   - A threshold cleaner verifies total document count does not exceed 500 documents, pruning the oldest entries to strictly respect MongoDB Atlas free-tier storage limits (512MB).


