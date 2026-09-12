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
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import TestConfirmationModal from "@/components/TestConfirmationModal";
import SkillTestRunnerModal, { type AssessmentData } from "@/components/SkillTestRunnerModal";

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
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  badgeAwarded?: string;
  verifiedSkillsAdded?: string[];
  completedAt: string;
}

export default function SkillAssessmentsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [testedSkills, setTestedSkills] = useState<string[]>([]);
  const [pastResults, setPastResults] = useState<TestResultItem[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState<string>("");

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
      const data = (await res.json()) as { success?: boolean; data?: TestResultItem[] };
      if (data.success && Array.isArray(data.data)) {
        setPastResults(data.data);
        const verifiedSet = new Set<string>();
        data.data.forEach((r) => {
          if (r.passed) {
            (r.verifiedSkillsAdded || []).forEach((s: string) => verifiedSet.add(s.toLowerCase()));
          }
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
                On-the-spot evaluation generated by AI tailored to your background and target technology.
              </p>
            </div>
          </div>

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
                <span>Attempt New Skill Test</span>
              </>
            )}
          </button>
        </div>

        {/* Live AI Generation In-Progress Banner */}
        {isGeneratingTest && (
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
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-md bg-card border border-border flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SkillBadge skill={skill} size="sm" isTested={isTested} />
                    </div>

                    {isTested ? (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-sm border border-emerald-500/20 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Verified Active
                      </span>
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
              {pastResults.slice(0, 5).map((res) => (
                <div key={res._id} className="p-3 flex items-center justify-between hover:bg-accent/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">
                      {res.assessmentTitle}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Completed: {new Date(res.completedAt).toLocaleDateString()} at {new Date(res.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              ))}
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
