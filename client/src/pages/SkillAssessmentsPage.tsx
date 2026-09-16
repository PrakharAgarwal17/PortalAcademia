import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
  Plus,
  Terminal,
  ShieldCheck,
  History,
  Clock,
  Users,
  MessageSquare,
  Brain,
  Compass,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import TestConfirmationModal from "@/components/TestConfirmationModal";
import SkillTestRunnerModal, { type AssessmentData } from "@/components/SkillTestRunnerModal";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

const TRENDING_SUGGESTIONS = [
  "Docker",
  "Kubernetes",
  "PyTorch",
  "Rust",
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "PostgreSQL",
  "Go",
  "AWS Architecture",
  "Cyber Security",
];

const SOFT_SKILL_THEMES = [
  "Workplace Collaboration & Incident Response",
  "Cross-Functional Sprint Deadlines & Tech Debt",
  "Engineering Leadership & Peer Mentorship",
  "Architectural Tradeoffs & Constructive Debate",
  "Stakeholder Negotiations & Client Scope",
  "Team Psychological Safety & Burnout Prevention",
];

interface ProfileData {
  _id?: string;
  name?: string;
  accountType?: "student" | "faculty" | "institution" | "industry";
  skills?: string[];
  expertise?: string[];
  researchInterests?: string[];
  institution?: string;
  department?: string;
}

interface TestResultItem {
  _id: string;
  assessmentTitle: string;
  assessmentType?: "technical" | "soft_skills";
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  badgeAwarded?: string;
  verifiedSkillsAdded?: string[];
  softSkillsReport?: any;
  completedAt: string;
}

export interface SkillStatItem {
  skill: string;
  totalAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  isPassed: boolean;
  badgeAwarded?: string;
  lastAttemptDate: string;
}

export default function SkillAssessmentsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [testedSkills, setTestedSkills] = useState<string[]>([]);
  const [skillStats, setSkillStats] = useState<SkillStatItem[]>([]);
  const [pastResults, setPastResults] = useState<TestResultItem[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState<string>("");

  // Tab State: Technical Competencies vs Behavioral & Soft Skills
  const [activeTab, setActiveTab] = useState<"technical" | "soft_skills">("technical");

  // Soft Skills State
  const [selectedTheme, setSelectedTheme] = useState<string>("Workplace Collaboration & Incident Response");
  const [customThemeInput, setCustomThemeInput] = useState<string>("");
  const [isGeneratingSoftSkills, setIsGeneratingSoftSkills] = useState<boolean>(false);

  // Modals & Generation State
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [targetTestSkill, setTargetTestSkill] = useState<string | undefined>(undefined);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [activeGeneratingSkill, setActiveGeneratingSkill] = useState<string>("");
  const [activeQuiz, setActiveQuiz] = useState<AssessmentData | null>(null);

  /**
   * @description Fetches the authenticated user profile (skills, expertise, role)
   * @returns {Promise<void>}
   * @throws {Error} Logs error if profile fetch fails
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, { credentials: "include" });
      const data = (await res.json()) as { success?: boolean; profile?: ProfileData };
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  }, []);

  /**
   * @description Fetches all past assessment attempts and verified skill badges for the authenticated user
   * @returns {Promise<void>}
   * @throws {Error} Logs error if results fetch fails
   */
  const fetchTestResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessments/my-results`, { credentials: "include" });
      const data = (await res.json()) as { success?: boolean; data?: TestResultItem[]; skillStats?: SkillStatItem[] };
      if (data.success && Array.isArray(data.data)) {
        setPastResults(data.data);
        if (Array.isArray(data.skillStats)) {
          setSkillStats(data.skillStats);
        }
        const verifiedSet = new Set<string>();
        data.data.forEach((r) => {
          if (r.passed) {
            (r.verifiedSkillsAdded || []).forEach((s: string) => verifiedSet.add(s.toLowerCase()));
          }
        });
        // Also add any skills from skillStats that are marked passed
        (data.skillStats || []).forEach((s) => {
          if (s.isPassed) verifiedSet.add(s.skill.toLowerCase());
        });
        setTestedSkills(Array.from(verifiedSet));
      }
    } catch (err) {
      console.error("fetchTestResults error:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchTestResults()]).catch((err) => console.error(err));
  }, [fetchProfile, fetchTestResults]);

  // Aggregate user skills across profile.skills, expertise (faculty), and researchInterests
  const aggregatedSkills = useMemo(() => {
    const combined = [
      ...(Array.isArray(profile?.skills) ? profile.skills : []),
      ...(Array.isArray(profile?.expertise) ? profile.expertise : []),
      ...(Array.isArray(profile?.researchInterests) ? profile.researchInterests : []),
    ];
    return Array.from(new Set(combined.map((s) => s.trim()).filter(Boolean)));
  }, [profile]);

  // Dynamic back navigation target matching candidate role
  const dashboardBackUrl = useMemo(() => {
    if (!profile?.accountType) return "/dashboard";
    return `/dashboard/${profile.accountType}`;
  }, [profile?.accountType]);

  const openTestConfirmation = (skillName?: string) => {
    setTargetTestSkill(skillName);
    setIsConfirmationOpen(true);
  };

  /**
   * @description Triggers Groq AI on-the-spot test generation for a given skill
   * @param {string} targetSkill - Technology or domain to test
   * @returns {Promise<void>}
   * @throws {Error} Alerts user if network or AI synthesis fails
   */
  const handleGenerateTest = async (targetSkill: string) => {
    const cleanSkill = targetSkill.trim();
    if (!cleanSkill) return;

    setIsGeneratingTest(true);
    setActiveGeneratingSkill(cleanSkill);

    try {
      const res = await fetch(`${API_BASE}/api/assessments/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetSkill: cleanSkill }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; data?: AssessmentData };
      if (data.success && data.data) {
        setActiveQuiz(data.data);
        setIsConfirmationOpen(false);
        setCustomSkillInput("");
      } else {
        alert(data.message || `Failed to generate assessment for ${cleanSkill}.`);
      }
    } catch (err) {
      console.error("Failed to generate test:", err);
      alert("Network error generating assessment. Please try again.");
    } finally {
      setIsGeneratingTest(false);
      setActiveGeneratingSkill("");
    }
  };

  /**
   * @description Generates dedicated scenario-based Soft Skills & Behavioral Assessment
   * @param {string} [themeName] - Optional dilemma theme
   */
  const handleGenerateSoftSkillTest = async (themeName?: string) => {
    const chosenTheme = (themeName || customThemeInput || selectedTheme).trim();
    if (!chosenTheme) return;

    setIsGeneratingSoftSkills(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/generate-soft-skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme: chosenTheme }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; data?: AssessmentData };
      if (data.success && data.data) {
        setActiveQuiz(data.data);
        setCustomThemeInput("");
      } else {
        alert(data.message || "Failed to generate soft skills assessment.");
      }
    } catch (err) {
      console.error("Failed to generate soft skills test:", err);
      alert("Network error generating soft skills assessment. Please try again.");
    } finally {
      setIsGeneratingSoftSkills(false);
    }
  };

  const handleCustomSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkillInput.trim()) {
      handleGenerateTest(customSkillInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar userName={profile?.name} profileId={profile?._id} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Header with Role Awareness */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={dashboardBackUrl}
              className="p-1.5 rounded-sm border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 font-semibold mb-0.5">
                <Award className="w-3 h-3" />
                {profile?.accountType === "faculty"
                  ? "Faculty Domain Verification Track"
                  : profile?.accountType === "institution"
                  ? "Institutional Benchmark Track"
                  : profile?.accountType === "industry"
                  ? "Industry Competency Verification Track"
                  : "Standardized Skill Assessment Engine"}
              </div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Test Your Skills & Earn Verified Badges
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                On-the-spot evaluations calibrated via Groq AI across Technical competencies & Workplace Behavioral scenarios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "technical" ? (
              <button
                type="button"
                disabled={isGeneratingTest}
                onClick={() => openTestConfirmation()}
                className="text-xs font-semibold px-4 py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all self-start sm:self-auto"
              >
                {isGeneratingTest ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Exam…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Attempt Technical Test</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isGeneratingSoftSkills}
                onClick={() => handleGenerateSoftSkillTest()}
                className="text-xs font-semibold px-4 py-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all self-start sm:self-auto"
              >
                {isGeneratingSoftSkills ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Scenarios…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Soft Skills Assessment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation: Technical vs Soft Skills */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("technical")}
            className={cn(
              "px-3.5 py-2 rounded-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "technical"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Cpu className="w-4 h-4" />
            <span>Technical Competencies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("soft_skills")}
            className={cn(
              "px-3.5 py-2 rounded-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "soft_skills"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Behavioral & Soft Skills</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold ml-1">
              Scenario Engine
            </span>
          </button>
        </div>

        {/* Live AI Generation In-Progress Banners */}
        {activeTab === "technical" && isGeneratingTest && (
          <div className="p-4 rounded-md bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-foreground">
                  Synthesizing On-The-Spot AI Assessment for &ldquo;{activeGeneratingSkill}&rdquo;…
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Calibrating 10 questions (3 Easy MCQs, 3 Medium MCQs, 4 Real-World Timed Scenarios) via Groq LLM.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Context Grounded</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-primary">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>MCQs Formulation</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Production Scenarios</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Badge Calibration</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "soft_skills" && isGeneratingSoftSkills && (
          <div className="p-4 rounded-md bg-amber-500/5 border border-amber-500/20 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-foreground">
                  Synthesizing Workplace Dilemma Scenarios & Multi-Dimensional Weights…
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Formulating 8 scenario-based dilemma MCQs with pre-defined weights for Communication, Teamwork, Problem Solving, and Leadership.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Communication Matrix</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Teamwork Weighting</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Brain className="w-3.5 h-3.5 shrink-0" />
                <span>Problem Solving Calibration</span>
              </div>
              <div className="p-2 rounded-sm bg-background border border-border flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>Leadership Normalization</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: TECHNICAL COMPETENCIES */}
        {activeTab === "technical" && (
          <>
            {/* Instant On-The-Spot AI Skill Generator */}
            <div className="p-4 rounded-md bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Instant AI Skill Test Synthesis
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Powered by Groq LLM
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Request an on-the-spot 10-question evaluation for any programming language, framework, or cloud tool. The test will be generated dynamically on the spot according to your skill profile.
              </p>

              {/* Quick Input Bar */}
              <form onSubmit={handleCustomSkillSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Enter any skill to test on the spot (e.g., Docker, Rust, PyTorch, Kubernetes, GraphQL)..."
                  disabled={isGeneratingTest}
                  className="flex-1 h-9 px-3 rounded-sm bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isGeneratingTest || !customSkillInput.trim()}
                  className="h-9 px-4 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all shrink-0"
                >
                  {isGeneratingTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Start Test</span>
                    </>
                  )}
                </button>
              </form>

              {/* Trending Technology Chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Quick Select Suggested Stacks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_SUGGESTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      disabled={isGeneratingTest}
                      onClick={() => handleGenerateTest(skill)}
                      className="text-xs px-2.5 py-1 rounded-sm border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground" />
                      <span>{skill}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blueprint Overview */}
            <div className="p-4 rounded-md bg-card border border-border space-y-3 shadow-xs">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Standardized Evaluation Blueprint (10 Questions Total)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-sm bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-sm">
                    3 Easy MCQs
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Syntax & Baseline Recall (1 pt each)
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-blue-500/5 border border-blue-500/20 space-y-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 block text-sm">
                    3 Medium MCQs
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Architecture & Concurrency (2 pts each)
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-purple-500/5 border border-purple-500/20 space-y-1">
                  <span className="font-semibold text-purple-600 dark:text-purple-400 block text-sm">
                    4 Stack Scenarios
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Real Outages & Hardening (3 Min Timer)
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Skills Test Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Your Profile Skills & Verified Badge Status
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {aggregatedSkills.length} Identified Skills
                </span>
              </div>

              {aggregatedSkills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aggregatedSkills.map((skill: string, idx: number) => {
                    const isTested = testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase());
                    const stat = skillStats.find((s) => s.skill.toLowerCase() === skill.toLowerCase());
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-md bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <SkillBadge skill={skill} size="sm" isTested={isTested} />
                          {stat && (
                            <span className="text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-sm border border-border">
                              Avg: <strong className="text-foreground">{stat.averagePercentage}%</strong> ({stat.totalAttempts} {stat.totalAttempts === 1 ? "attempt" : "attempts"})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isTested ? (
                            <>
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-sm border border-emerald-500/20 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Verified Active
                              </span>
                              <button
                                type="button"
                                disabled={isGeneratingTest}
                                onClick={() => handleGenerateTest(skill)}
                                className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                                title="Retest this skill. The final displayed score is the average of all attempts on record."
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retest</span>
                              </button>
                            </>
                          ) : stat ? (
                            <>
                              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-sm border border-amber-500/20 font-semibold">
                                Needs Retest ({stat.latestPercentage}%)
                              </span>
                              <button
                                type="button"
                                disabled={isGeneratingTest}
                                onClick={() => handleGenerateTest(skill)}
                                className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retest</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={isGeneratingTest}
                              onClick={() => handleGenerateTest(skill)}
                              className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Generate AI Test →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-border rounded-md bg-card/40 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No specific skills detected on your profile yet.
                  </p>
                  <p className="text-xs text-foreground font-medium">
                    Type any skill in the generator above to synthesize an on-the-spot test!
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: BEHAVIORAL & SOFT SKILLS */}
        {activeTab === "soft_skills" && (
          <>
            {/* Soft Skills Dilemma Generator Card */}
            <div className="p-4 rounded-md bg-card border border-border space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Behavioral & Workplace Dilemma Scenario Engine
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  Scenario MCQs • Multi-Dimensional
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Authentic workplace dilemmas—such as production incidents under pressure, deadline compromises vs tech debt, architecture disagreements, and stakeholder tensions. Each option carries pre-calibrated weights mapped across Communication, Teamwork, Problem Solving, and Leadership.
              </p>

              {/* Quick Select Scenario Focus Themes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Select Dilemma Track Theme:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOFT_SKILL_THEMES.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      disabled={isGeneratingSoftSkills}
                      onClick={() => {
                        setSelectedTheme(theme);
                        handleGenerateSoftSkillTest(theme);
                      }}
                      className={cn(
                        "p-2.5 rounded-sm border text-xs text-left font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                        selectedTheme === theme
                          ? "bg-primary/10 border-primary text-foreground shadow-xs"
                          : "bg-secondary/30 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{theme}</span>
                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Theme Prompt Bar */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customThemeInput}
                  onChange={(e) => setCustomThemeInput(e.target.value)}
                  placeholder="Or enter custom workplace challenge (e.g., Cross-team API Deadlocks, Urgent Hotfix Rollbacks)..."
                  disabled={isGeneratingSoftSkills}
                  className="flex-1 h-9 px-3 rounded-sm bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-hidden"
                />
                <button
                  type="button"
                  disabled={isGeneratingSoftSkills}
                  onClick={() => handleGenerateSoftSkillTest()}
                  className="h-9 px-4 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all shrink-0"
                >
                  {isGeneratingSoftSkills ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Scenarios…</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>Launch Custom Scenario Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4 Core Dimensions Blueprint */}
            <div className="p-4 rounded-md bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Multi-Dimensional Evaluation Framework
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Deterministic Backend Normalization Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-sm bg-sky-500/5 border border-sky-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Communication</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Clarity under stress, psychological safety, transparent async stakeholder updates.
                  </p>
                </div>

                <div className="p-3 rounded-sm bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Teamwork & Synergy</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Pair-programming, unblocking teammates, empathy in code reviews, blameless culture.
                  </p>
                </div>

                <div className="p-3 rounded-sm bg-purple-500/5 border border-purple-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Problem Solving</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Root-cause diagnostics, trade-off negotiation, balancing velocity with code quality.
                  </p>
                </div>

                <div className="p-3 rounded-sm bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Leadership</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Ownership, peer mentoring, driving architectural consensus, and preventing team burnout.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-sm bg-secondary/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Objective Normalization:</strong> Scores are calculated by the Express backend using mathematical normalization across all 8 dilemma scenarios ($0-100\%$). No single choice can swing your outcome.
                </span>
              </div>
            </div>

            {/* Behavioral Verified Skills Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Behavioral Skill Badges Status
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  4 Core Workplace Vectors
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Workplace Communication",
                  "Team Collaboration",
                  "Critical Problem Solving",
                  "Engineering Leadership",
                ].map((skill, idx) => {
                  const isTested = testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase());
                  const stat = skillStats.find((s) => s.skill.toLowerCase() === skill.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-md bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <SkillBadge skill={skill} size="sm" isTested={isTested} />
                        {stat && (
                          <span className="text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-sm border border-border">
                            Avg: <strong className="text-foreground">{stat.averagePercentage}%</strong> ({stat.totalAttempts} {stat.totalAttempts === 1 ? "attempt" : "attempts"})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isTested ? (
                          <>
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-sm border border-emerald-500/20 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Verified Active
                            </span>
                            <button
                              type="button"
                              disabled={isGeneratingSoftSkills}
                              onClick={() => handleGenerateSoftSkillTest()}
                              className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                              title="Retest behavioral competency. Final score reflects the average of all recorded attempts."
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retest</span>
                            </button>
                          </>
                        ) : stat ? (
                          <>
                            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-sm border border-amber-500/20 font-semibold">
                              Needs Retest ({stat.latestPercentage}%)
                            </span>
                            <button
                              type="button"
                              disabled={isGeneratingSoftSkills}
                              onClick={() => handleGenerateSoftSkillTest()}
                              className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retest</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={isGeneratingSoftSkills}
                            onClick={() => handleGenerateSoftSkillTest()}
                            className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-sm border border-primary/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Assess Competency →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Past Assessment Attempts & Verified Telemetry */}
        {pastResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Recent Verification History & Telemetry Log
              </h2>
            </div>

            <div className="border border-border rounded-md divide-y divide-border bg-card overflow-hidden text-xs">
              {pastResults.slice(0, 6).map((res) => {
                const isSoft = res.assessmentType === "soft_skills" || !!res.softSkillsReport;
                return (
                  <div key={res._id} className="p-3 flex items-center justify-between hover:bg-accent/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {res.assessmentTitle}
                        </span>
                        {isSoft ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold">
                            Behavioral Scenario
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25 font-bold">
                            Technical Exam
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground block">
                        Completed: {new Date(res.completedAt).toLocaleDateString()} at {new Date(res.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {res.softSkillsReport?.archetype && ` • Archetype: ${res.softSkillsReport.archetype}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {res.score}/{res.totalQuestions} ({res.percentage}%)
                      </span>
                      {res.passed ? (
                        <span className="font-mono font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                          PASSED
                        </span>
                      ) : (
                        <span className="font-mono font-semibold text-[11px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-sm border border-destructive/20">
                          FAILED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation & Custom Skill Modal */}
      <TestConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        userSkills={aggregatedSkills}
        initialTargetSkill={targetTestSkill}
        onConfirmStart={handleGenerateTest}
        isGenerating={isGeneratingTest}
      />

      {/* Exam Runner Modal */}
      {activeQuiz && (
        <SkillTestRunnerModal
          assessment={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onSuccessResult={async () => {
            await Promise.all([fetchProfile(), fetchTestResults()]);
          }}
          apiBaseUrl={API_BASE}
        />
      )}
    </div>
  );
}
