import { useState, useEffect, useCallback } from "react";
import { Award, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import TestConfirmationModal from "@/components/TestConfirmationModal";
import SkillTestRunnerModal, { type AssessmentData } from "@/components/SkillTestRunnerModal";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export default function SkillAssessmentsPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [testedSkills, setTestedSkills] = useState<string[]>([]);

  // Modals state
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [targetTestSkill, setTargetTestSkill] = useState<string | undefined>(undefined);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<AssessmentData | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, { credentials: "include" });
      const data = await res.json();
      if (data.success && data.profile) setProfile(data.profile);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTestResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessments/my-results`, { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const verifiedSet = new Set<string>();
        data.data.forEach((r: any) => {
          if (r.passed) {
            (r.verifiedSkillsAdded || []).forEach((s: string) => verifiedSet.add(s.toLowerCase()));
          }
        });
        setTestedSkills(Array.from(verifiedSet));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchTestResults()])
      .catch((err) => console.error(err));
  }, [fetchProfile, fetchTestResults]);

  const openTestConfirmation = (skillName?: string) => {
    setTargetTestSkill(skillName);
    setIsConfirmationOpen(true);
  };

  const handleGenerateTestFromConfirmation = async (targetSkill: string) => {
    setIsGeneratingTest(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetSkill }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveQuiz(data.data);
        setIsConfirmationOpen(false);
      } else {
        alert(data.message || "Failed to generate test.");
      }
    } catch (err) {
      console.error("Failed to generate test:", err);
      alert("Network error generating assessment.");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar userName={profile?.name} profileId={profile?._id} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/student"
              className="p-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold mb-0.5">
                <Award className="w-3.5 h-3.5" />
                Standardized Skill Assessment Engine
              </div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Test Your Skills & Earn Verified Badges
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openTestConfirmation()}
            className="text-xs font-bold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Attempt New Skill Test</span>
          </button>
        </div>

        {/* Blueprint Overview */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Exam Structure & Format (10 Questions Total)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-sm">
                3 Easy MCQs
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Baseline Concept Recall (1 pt each)
              </span>
            </div>

            <div className="p-3 rounded-md bg-blue-500/5 border border-blue-500/20 space-y-1">
              <span className="font-bold text-blue-600 dark:text-blue-400 block text-sm">
                3 Medium MCQs
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Architecture & Logic (2 pts each)
              </span>
            </div>

            <div className="p-3 rounded-md bg-purple-500/5 border border-purple-500/20 space-y-1">
              <span className="font-bold text-purple-600 dark:text-purple-400 block text-sm">
                4 Stack Scenarios
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Real Developer Scenarios (3 Min Live Timer)
              </span>
            </div>
          </div>
        </div>

        {/* Profile Skills Test Matrix */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Your Profile Technologies & Verification Status
          </h2>

          {profile?.skills && profile.skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.skills.map((skill: string, idx: number) => {
                const isTested = testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase());
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SkillBadge skill={skill} size="sm" isTested={isTested} />
                    </div>

                    {isTested ? (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Tested & Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openTestConfirmation(skill)}
                        className="text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded border border-primary/20 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Untested (Take Test →)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card/50">
              <p className="text-xs text-muted-foreground">
                No skills listed on your profile yet. Add skills on your dashboard profile to attempt tests!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <TestConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        userSkills={profile?.skills || []}
        initialTargetSkill={targetTestSkill}
        onConfirmStart={handleGenerateTestFromConfirmation}
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
