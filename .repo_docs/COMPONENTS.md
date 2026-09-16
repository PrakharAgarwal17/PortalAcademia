# UI Component Index & Specs — PortalAcademia

> Location: `client/src/components/`  
> Direct Elements Rule: Reusable components focus strictly on modals, navigation, and specialized badge/input primitives. In-page layouts utilize direct native HTML elements styled with standard Tailwind utility classes.

---

## 1. Component Registry

| Component | Path | Role / Category | Primary Dependencies |
| :--- | :--- | :--- | :--- |
| `Navbar` | [client/src/components/Navbar.tsx](file:///client/src/components/Navbar.tsx) | Persistent Global Navigation Bar | `useTheme`, `useAppDispatch`, `signOutThunk`, `useLocation` |
| `SkillBadge` | [client/src/components/SkillBadge.tsx](file:///client/src/components/SkillBadge.tsx) | SVG-Enhanced Skill Chip & Verification Badge | `getSkillIcon`, `cn`, Lucide Icons |
| `SkillInput` | [client/src/components/SkillInput.tsx](file:///client/src/components/SkillInput.tsx) | Autocomplete Multi-Skill Input Box | `searchSkillSuggestions`, `SkillBadge` |
| `ProfileEditModal` | [client/src/components/ProfileEditModal.tsx](file:///client/src/components/ProfileEditModal.tsx) | Section-Specific Profile Drawer / Modal | `useAppDispatch`, `useAppSelector(profile)`, `closeEditModal`, `SkillInput` |
| `ResumeBuilderModal`| [client/src/components/ResumeBuilderModal.tsx](file:///client/src/components/ResumeBuilderModal.tsx) | Dynamic ATS Resume Generator & PDF Exporter | `jsPDF`, `SkillBadge` |
| `SkillTestRunnerModal`| [client/src/components/SkillTestRunnerModal.tsx](file:///client/src/components/SkillTestRunnerModal.tsx) | Timed Interactive MCQ Examination Runner | Lucide Icons, Timer hooks |
| `TestConfirmationModal`| [client/src/components/TestConfirmationModal.tsx](file:///client/src/components/TestConfirmationModal.tsx) | Pre-Assessment Confirmation Dialog | `SkillBadge` |
| `UserProfileModal` | [client/src/components/UserProfileModal.tsx](file:///client/src/components/UserProfileModal.tsx) | Comprehensive Profile Quick-View & Editor | `SkillBadge`, `SkillInput`, `useNavigate` |

---

## 2. Component Specifications

### 1. `Navbar`
**Location:** [client/src/components/Navbar.tsx](file:///client/src/components/Navbar.tsx)  
**Role:** Global top navigation header providing stakeholder-tailored route navigation (Dashboard, Market Trends, Test Your Skills, Current Applications), theme switcher, authenticated user initials, and sign-out action.

#### Props Interface
```ts
interface NavbarProps {
  userName?: string;   // Optional user display name
  userRole?: string;   // "student" | "faculty" | "institution" | "industry"
  profileId?: string;  // ID used for direct profile link routing
}
```

#### Internal State & Hooks
- `useLocation()`: Detects active route to compute route highlight states.
- `useTheme()`: Accesses `theme` and `toggleTheme()`.
- `useAppDispatch()`: Dispatches `signOutThunk()`.

#### Emitted Events / Dispatches
- Dispatches `signOutThunk()` on clicking the Logout icon.
- Toggles dark/light theme on clicking the Sun/Moon icon.

---

### 2. `SkillBadge`
**Location:** [client/src/components/SkillBadge.tsx](file:///client/src/components/SkillBadge.tsx)  
**Role:** High-density skill badge displaying official Simple Icons SVGs with verified green badge indicators (`CheckCircle2`) when a candidate has passed the standardized assessment.

#### Props Interface
```ts
interface SkillBadgeProps {
  skill: string;             // Name of technical or soft skill (e.g. "React", "Docker")
  onRemove?: () => void;     // Callback when clicking the optional remove 'X' icon
  onClick?: () => void;      // Callback when badge is clicked (triggers test modal)
  size?: "xs" | "sm" | "md"; // Default: "sm"
  className?: string;        // Tailwind style override
  showColor?: boolean;       // Default: true (renders official brand hex color)
  isTested?: boolean;        // Default: false (renders emerald verified badge if true)
}
```

#### Internal State & Hooks
- Pure presentational component; derives SVG icon and brand color via `getSkillIcon(skill)`.

#### Emitted Events
- `onClick()`: Triggered on root element click.
- `onRemove()`: Triggered on 'X' button click (stops propagation).

---

### 3. `SkillInput`
**Location:** [client/src/components/SkillInput.tsx](file:///client/src/components/SkillInput.tsx)  
**Role:** Typeahead search and tag manager for competencies. Offers filtered dropdown suggestions based on `skillIcons.ts` dictionary and keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Backspace`).

#### Props Interface
```ts
interface SkillInputProps {
  skills: string[];                     // Active array of selected skill strings
  onAddSkill: (skill: string) => void;  // Callback when a skill is selected
  onRemoveSkill: (skill: string) => void;// Callback when a skill badge is removed
  placeholder?: string;                 // Default: "Type a skill (e.g. Python, React, Docker) and select…"
  maxSkills?: number;                   // Default: 30
  label?: string;                       // Optional label above input
  showPopularSuggestions?: boolean;     // Default: true (displays popular quick-add chips)
}
```

#### Internal State & Hooks
- `query: string` — Current input text.
- `isOpen: boolean` — Visibility of autocomplete suggestion list.
- `selectedIndex: number` — Keyboard navigation index.
- `useRef<HTMLDivElement>` / `useRef<HTMLInputElement>` — Click-outside handler and focus management.
- `useMemo()` — Filters `suggestions` via `searchSkillSuggestions(query, 8)`.

#### Emitted Events
- `onAddSkill(skill)` — Emitted on click or `Enter` on suggestion.
- `onRemoveSkill(skill)` — Emitted on badge delete or `Backspace` on empty query.

---

### 4. `ProfileEditModal`
**Location:** [client/src/components/ProfileEditModal.tsx](file:///client/src/components/ProfileEditModal.tsx)  
**Role:** Multi-section edit dialog for updating headline, bio, skills, education records, past experience, certifications, and banner presets.

#### Props Interface
```ts
interface ProfileEditModalProps {
  profileData: ProfileData;                          // Current active profile data
  onSaveSuccess: (updated: ProfileData) => void;     // Callback with updated profile after PUT
}
```

#### Internal State & Hooks
- Reads Redux `state.profile` (`activeSection`, `editingIndex`, `isModalOpen`).
- `isSaving: boolean` — Disables submit button and shows `<Loader2 />`.
- `errorMsg: string | null` — Displays inline error feedback.
- Section draft state hooks: `headline`, `bio`, `skills`, `educationList`, `eduDraft`, `experienceList`, `expDraft`, `certificationsList`, `certDraft`, `roleParams`.

#### Emitted Events / Dispatches
- Dispatches `closeEditModal()` to Redux store.
- Performs `PUT /api/profile` directly and calls `onSaveSuccess(updated)`.

---

### 5. `ResumeBuilderModal`
**Location:** [client/src/components/ResumeBuilderModal.tsx](file:///client/src/components/ResumeBuilderModal.tsx)  
**Role:** Full-featured ATS resume generator and document parser. Features three interactive views: "Customize Fields", "Live PDF Preview & Download", and "Upload Resume (PDF / DOCX)". The upload tab parses PDF and Word DOCX files, computes the authoritative unified ATS score, displays skill match breakdowns, and saves the file directly to Cloudinary.

#### Props Interface
```ts
export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string[];
  education: Array<{ education: string; course?: string; institution?: string; timeline?: string; grade?: string; description?: string }>;
  experience: Array<{ title: string; organization?: string; timeline?: string; description?: string }>;
  certifications: Array<{ title: string; issuer?: string; timeline?: string; summary?: string; credentialUrl?: string }>;
}

interface ResumeBuilderModalProps {
  isOpen: boolean;                                   // Controls modal visibility
  onClose: () => void;                               // Close handler
  profileData: any;                                  // Seed profile data
  opportunity?: any;                                 // Target job to compute ATS score against
  onAttachResume: (resumeData: ResumeData, pdfUrl?: string, atsScore?: number) => void;
}
```

#### Internal State & Hooks
- `activeTab: "customize" | "preview" | "upload"` — Active modal sub-view.
- `resume: ResumeData` — Synchronized resume form state.
- `atsAnalysis: AtsScoreBreakdown` — Authoritative unified ATS analysis (technical match 60%, completeness 40%, matched/missing skills).
- `uploadedResult: { url: string; filename: string; atsAnalysis: AtsScoreBreakdown } | null` — Document upload and scoring response.
- `isUploading: boolean`, `uploadError: string | null`, `dragActive: boolean` — Drag-and-drop upload state.
- `isGeneratingPdf: boolean` — Loading state during `jsPDF` render.

#### Emitted Events
- `onAttachResume(resumeData, pdfUrl, atsScore)` — Attaches built or uploaded resume to application flow.
- Triggers native browser print / PDF download.

---

### 6. `SkillTestRunnerModal`
**Location:** [client/src/components/SkillTestRunnerModal.tsx](file:///client/src/components/SkillTestRunnerModal.tsx)  
**Role:** Timed question-by-question MCQ examination runner. Tracks time per question, records selected option indexes, submits to `/api/assessments/:id/submit`, and renders pass/fail scorecard displaying the current attempt score alongside cumulative average percentage and total attempts on record with badge awards.

#### Props Interface
```ts
export interface AssessmentData {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillVectors: string[];
  passPercentage: number;
  badgeAwarded: string;
  questions: Question[];
}

interface SkillTestRunnerModalProps {
  assessment: AssessmentData;                // Full assessment payload with question prompts
  onClose: () => void;                       // Exit examination callback
  onSuccessResult: (result: any) => void;    // Completion callback with verified test result
  apiBaseUrl: string;                        // Base API endpoint
}
```

#### Internal State & Hooks
- `currentIdx: number` — 0-based active question index.
- `mcqAnswers: Record<string, number>` — Map of `questionId` -> `selectedOptionIndex`.
- `timeTakenPerQuestion: Record<string, number>` — Stopwatch tracking per question.
- `isSubmitting: boolean` — Submission loading state.
- `testResult: any | null` — Result payload after server-side evaluation.

#### Emitted Events
- `POST /api/assessments/:id/submit` with recorded answers.
- `onSuccessResult(result)` emitted upon successful score calculation.

---

### 7. `TestConfirmationModal`
**Location:** [client/src/components/TestConfirmationModal.tsx](file:///client/src/components/TestConfirmationModal.tsx)  
**Role:** Pre-flight modal enabling candidate to review assessment rules (time limit, pass threshold, anti-cheat policy) and pick or search for a target skill before generating questions.

#### Props Interface
```ts
interface TestConfirmationModalProps {
  isOpen: boolean;                                // Visibility state
  onClose: () => void;                            // Dismiss callback
  userSkills: string[];                           // Candidate's current profile skills
  initialTargetSkill?: string;                    // Pre-selected skill if opened from badge
  onConfirmStart: (targetSkill: string) => void;  // Callback triggering generation/start
  isGenerating?: boolean;                         // Default: false (loader state)
}
```

#### Internal State & Hooks
- `selectedTargetSkill: string` — Currently chosen skill vector.
- `customSkillInput: string` — Free-text search input for unlisted skills.

#### Emitted Events
- `onConfirmStart(selectedTargetSkill)` — Confirms skill selection and begins test.

---

### 8. `UserProfileModal`
**Location:** [client/src/components/UserProfileModal.tsx](file:///client/src/components/UserProfileModal.tsx)  
**Role:** Detailed view modal presenting complete profile details (bio, academic credentials, verified skills, and experience) with tabbed switching between Overview, Skills, and Quick Edit forms.

#### Props Interface
```ts
interface UserProfileModalProps {
  isOpen: boolean;                                     // Visibility flag
  onClose: () => void;                                 // Close callback
  profile: any;                                        // User profile record
  onProfileUpdated: (updatedProfile: any) => void;     // Callback on successful save
}
```

#### Internal State & Hooks
- `activeTab: "overview" | "skills" | "edit"` — Active modal sub-view.
- `formData: UserProfileData` — Draft state for quick edits.
- `isSaving: boolean` — Disables save button during network request.
- `saveFeedback: { type, text } | null` — Alert feedback banner.

#### Emitted Events
- `PUT /api/profile` — Directly saves modifications.
- `onProfileUpdated(updatedProfile)` — Emits refreshed profile to parent view.
