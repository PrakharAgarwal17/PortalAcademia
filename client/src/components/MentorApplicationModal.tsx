import { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Loader2,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Award,
  RotateCcw,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface Question {
  id: number;
  category: string;
  scenario: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

interface MentorApplicationModalProps {
  onClose: () => void;
  onApplicationSuccess: () => void;
  defaultBio?: string;
  defaultTopics?: string[];
  isAlreadyMentor?: boolean;
  academicYear?: string;
}

export default function MentorApplicationModal({
  onClose,
  onApplicationSuccess,
  defaultBio = "",
  defaultTopics = [],
  isAlreadyMentor = false,
  academicYear = "",
}: MentorApplicationModalProps) {
  // Step: "profile" | "loading" | "test" | "results"
  const [step, setStep] = useState<"profile" | "loading" | "test" | "results">("profile");

  // Senior standing (4th Year / Alumni) verification
  const isInitial4thOrAlumni = Boolean(
    academicYear === "4th Year" ||
    academicYear?.toLowerCase().includes("alumni") ||
    isAlreadyMentor
  );
  const [confirmed4thYear, setConfirmed4thYear] = useState(isInitial4thOrAlumni);

  // Profile Form state
  const [bio, setBio] = useState(defaultBio);
  const [topicsInput, setTopicsInput] = useState(defaultTopics.join(", "));
  const [termsAccepted, setTermsAccepted] = useState(isAlreadyMentor);

  // AI-fetched questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsSource, setQuestionsSource] = useState<"ai" | "fallback" | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [testScore, setTestScore] = useState<number | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch AI-generated questions from server ──────────────────────────────
  const fetchQuestions = async (bioText: string, topicsText: string) => {
    setQuestionsError(null);
    setStep("loading");
    try {
      const effectiveYear = confirmed4thYear ? "4th Year" : (academicYear || "4th Year");
      const params = new URLSearchParams({
        bio: bioText.slice(0, 500),
        topics: topicsText.slice(0, 300),
        academicYear: effectiveYear,
      });
      const res = await fetch(`${API_BASE}/api/mentorship/generate-assessment?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length === 5) {
        setQuestions(data.questions);
        setQuestionsSource(data.source ?? null);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setTestScore(null);
        setStep("test");
      } else {
        setQuestionsError(data.message || "Could not load assessment questions. Please try again.");
        setStep("profile");
      }
    } catch {
      setQuestionsError("Network error while generating your assessment. Please retry.");
      setStep("profile");
    }
  };

  const handleStartAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed4thYear) {
      setError("PortalAcademia peer mentorship is reserved for 4th-year students and alumni. Please verify your standing.");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Mentor Terms & Conditions and Honor Code to proceed.");
      return;
    }
    if (!bio.trim()) {
      setError("Please provide an advising bio outlining your technical focus.");
      return;
    }
    setError(null);
    if (isAlreadyMentor) {
      // Existing mentors skip the test and update their profile directly
      void handleFinalSubmit(100, true);
    } else {
      void fetchQuestions(bio.trim(), topicsInput.trim());
    }
  };

  const handleSelectAnswer = (questionIndex: number, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate final score
      let correct = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) {
          correct += 1;
        }
      });
      const calculatedScore = Math.round((correct / questions.length) * 100);
      setTestScore(calculatedScore);
      setStep("results");
    }
  };

  const handleRetakeAssessment = () => {
    // Fetch a fresh set of AI questions on retake
    void fetchQuestions(bio.trim(), topicsInput.trim());
  };

  const handleFinalSubmit = async (scoreToSubmit?: number, passedOverride?: boolean) => {
    setIsSubmitting(true);
    setError(null);

    const finalScore = scoreToSubmit ?? testScore ?? 0;
    const finalPassed = passedOverride ?? finalScore >= 80;

    try {
      const topicsArray = topicsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/api/mentorship/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorBio: bio.trim(),
          mentorTopics: topicsArray,
          mentorTermsAccepted: true,
          testScore: finalScore,
          testPassed: finalPassed,
          academicYear: confirmed4thYear ? "4th Year" : (academicYear || "4th Year"),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onApplicationSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to register mentor privileges.");
      }
    } catch {
      setError("Network error while submitting application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const isCurrentQAnswered = Boolean(selectedAnswers[currentQuestionIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="bg-card rounded-md border border-border w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {isAlreadyMentor
                ? "Update Senior Mentor Profile"
                : step === "profile"
                ? "Apply as a Senior Peer Mentor"
                : step === "loading"
                ? "Generating Personalised Assessment…"
                : step === "test"
                ? "Mentor Readiness & Competency Assessment"
                : "Assessment Evaluation"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {questionsError && (
            <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{questionsError}</span>
              </div>
              <button
                type="button"
                onClick={() => void fetchQuestions(bio.trim(), topicsInput.trim())}
                className="flex items-center gap-1 text-[10px] font-semibold underline underline-offset-2 cursor-pointer shrink-0"
              >
                <RefreshCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* ── STEP: Loading AI Questions ── */}
          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-foreground">
                  Generating Your Personalised Assessment
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  Our AI is crafting 5 scenario questions tailored to your declared advisory topics and bio.
                </p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* ── STEP 1: Profile & Scope Form ── */}
          {step === "profile" && (
            <form onSubmit={handleStartAssessment} className="space-y-4">
              <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-1 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>Senior Scholars &amp; Final-Year Mentorship</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Guide junior peers in system design, research methodologies, and mock interviews.
                  {!isAlreadyMentor && (
                    <strong className="text-foreground ml-1">
                      New mentors complete a 5-question AI-generated scenario assessment (80% passing grade required).
                    </strong>
                  )}
                </p>
              </div>

              {/* Senior Scholar / 4th Year Standing Verification Banner */}
              <div
                className={cn(
                  "rounded-md border p-3 text-xs space-y-2 transition-colors",
                  confirmed4thYear
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {confirmed4thYear ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="font-bold text-xs">
                      {confirmed4thYear
                        ? "Eligibility Verified: Senior Standing (4th-Year / Alumni)"
                        : "Senior Standing Verification Required"}
                    </span>
                  </div>
                  {academicYear && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background/80 border border-current font-bold uppercase">
                      Profile: {academicYear}
                    </span>
                  )}
                </div>

                {!confirmed4thYear ? (
                  <div className="space-y-2 pt-1 border-t border-amber-500/20">
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Peer mentorship is reserved exclusively for senior 4th-year scholars and alumni to ensure credible career and architectural guidance for juniors.
                    </p>
                    <label className="flex items-start gap-2 cursor-pointer pt-1 font-semibold text-[11px]">
                      <input
                        type="checkbox"
                        checked={confirmed4thYear}
                        onChange={(e) => setConfirmed4thYear(e.target.checked)}
                        className="mt-0.5 rounded-sm accent-primary cursor-pointer"
                      />
                      <span>I confirm I am actively in my 4th (Final) Year or an Alumnus.</span>
                    </label>
                  </div>
                ) : (
                  <p className="text-[11px] opacity-90">
                    You satisfy the senior academic standing requirement to mentor junior scholars.
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Advising Bio &amp; Technical Specialization
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 4th Year Computer Science · Specializing in High-Throughput Distributed Systems and Rust. Passionate about reviewing system architectures and conducting mock technical rounds."
                  className="w-full bg-background border border-border text-foreground rounded-sm text-xs p-2.5 focus:outline-none focus:border-foreground/40 resize-none font-sans"
                  required
                />
              </div>

              {/* Topics */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Advisory Topics (comma-separated skills or domains)
                </label>
                <input
                  type="text"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="Distributed Systems, Go, React 19, LeetCode / DSA, Resume Review"
                  className="w-full bg-background border border-border text-foreground rounded-sm text-xs px-2.5 py-2 focus:outline-none focus:border-foreground/40 font-sans"
                  required
                />
              </div>

              {/* Code of Conduct / Terms */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Mentor Code of Conduct &amp; Platform Standards</span>
                </div>

                <div className="rounded-sm border border-border bg-background p-3 text-[11px] text-muted-foreground space-y-1 leading-relaxed font-mono">
                  <p>• <strong>Zero Solicitation:</strong> Advising is 100% free; off-platform payments are strictly prohibited.</p>
                  <p>• <strong>Academic Integrity:</strong> Never ghostwrite code or complete university assignments for mentees.</p>
                  <p>• <strong>Punctuality:</strong> Attend scheduled WebRTC sessions; repeated no-shows result in privilege revocation.</p>
                  <p>• <strong>Scholar Credentials:</strong> Verified mentors earn certified session records and verified mentor badges.</p>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded-sm accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-foreground leading-tight">
                    I agree to the PortalAcademia Mentor Code of Conduct and pledge to uphold peer integrity.
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAlreadyMentor ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isAlreadyMentor
                      ? "Save Profile Changes"
                      : "Generate AI Assessment & Proceed →"}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Interactive Assessment Test ── */}
          {step === "test" && currentQ && (
            <div className="space-y-4">
              {/* Progress & Category */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Scenario {currentQuestionIndex + 1} of {questions.length}
                    {questionsSource === "ai" && (
                      <span className="ml-1.5 text-primary">· AI-generated</span>
                    )}
                  </span>
                  <p className="text-xs font-bold text-foreground">
                    {currentQ.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono bg-secondary px-2.5 py-1 rounded-sm border border-border text-muted-foreground">
                  <BookOpen className="w-3 h-3 text-primary" />
                  <span>Pass: 80% (4/5)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Scenario Prompt */}
              <div className="p-3.5 rounded-md border border-border bg-card space-y-1.5">
                <span className="text-[10px] font-mono text-primary uppercase font-semibold">
                  Practical Mentoring Case Study:
                </span>
                <p className="text-xs text-foreground leading-relaxed">
                  {currentQ.scenario}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((option) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQuestionIndex, option.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-sm border transition-all cursor-pointer flex items-start gap-3",
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground shadow-xs"
                          : "bg-background border-border text-foreground/80 hover:bg-card hover:border-foreground/30"
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono uppercase shrink-0 mt-0.5",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {option.id}
                      </span>
                      <span className="text-xs leading-relaxed flex-1">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Assessment Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex((prev) => prev - 1);
                    } else {
                      setStep("profile");
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{currentQuestionIndex === 0 ? "Back to Profile" : "Previous"}</span>
                </button>

                <button
                  type="button"
                  disabled={!isCurrentQAnswered}
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>
                    {currentQuestionIndex === questions.length - 1
                      ? "Submit Assessment & Evaluate Score"
                      : "Next Scenario"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Assessment Results ── */}
          {step === "results" && testScore !== null && (
            <div className="space-y-4 py-2">
              {testScore >= 80 ? (
                <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Assessment Passed! Score: {testScore}%
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    You demonstrated the pedagogical empathy, academic integrity, and engineering mentorship standards required for verified mentors.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono mt-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Verified Mentor Status Unlocked</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Score: {testScore}% · Passing Score: 80%
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    To maintain strict safety and advising quality for junior scholars, mentors must score at least 80% (4 out of 5 scenarios). A fresh AI-generated set of questions will be loaded on retake.
                  </p>
                </div>
              )}

              {/* Scenario Feedback Review */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">
                  Case Study Review Breakdown:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isCorrect = selectedAnswers[idx] === q.correctAnswer;
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "p-3 rounded-sm border text-xs space-y-1",
                          isCorrect
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>
                            {q.id}. {q.category}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-xs",
                              isCorrect
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Results Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                {testScore < 80 ? (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Exit
                    </button>
                    <button
                      type="button"
                      onClick={handleRetakeAssessment}
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake with New AI Questions</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit(testScore, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Complete Mentor Registration</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
