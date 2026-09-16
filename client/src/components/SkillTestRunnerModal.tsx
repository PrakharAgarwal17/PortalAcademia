import { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  FileText,
  HelpCircle,
  Timer,
  Users,
  MessageSquare,
  Brain,
  Compass,
  TrendingUp,
  ShieldCheck,
  Mic,
  Square,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Question {
  questionId: string;
  questionText: string;
  type?: "mcq" | "writing" | "speaking";
  difficultyLevel?: "easy" | "medium" | "writing" | "speaking";
  concept?: string;
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
  weight?: number;
  speakingDurationSeconds?: number;
  evaluationRubric?: string[];
}

export interface DimensionalScore {
  rawScore: number;
  maxPossible: number;
  normalizedScore: number;
  verdict: "Exemplary" | "Proficient" | "Competent" | "Developing" | string;
}

export interface SoftSkillsReport {
  communication: DimensionalScore;
  teamwork: DimensionalScore;
  problemSolving: DimensionalScore;
  leadership: DimensionalScore;
  overallIndex: number;
  archetype: string;
  keyStrengths: string[];
  growthAreas: string[];
}

export interface AssessmentData {
  _id: string;
  title: string;
  description: string;
  category: string;
  assessmentType?: "technical" | "soft_skills";
  skillVectors: string[];
  passPercentage: number;
  badgeAwarded: string;
  questions: Question[];
}

interface SkillTestRunnerModalProps {
  assessment: AssessmentData;
  onClose: () => void;
  onSuccessResult: (result: any) => void;
  apiBaseUrl: string;
}

export default function SkillTestRunnerModal({
  assessment,
  onClose,
  onSuccessResult,
  apiBaseUrl,
}: SkillTestRunnerModalProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [timeTakenPerQuestion, setTimeTakenPerQuestion] = useState<Record<string, number>>({});
  const [aiFlaggedQuestions, setAiFlaggedQuestions] = useState<Record<string, boolean>>({});

  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number>(60);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Active question timer tracking
  const [currentQuestionElapsed, setCurrentQuestionElapsed] = useState<number>(0);
  const [writingTimeLeft, setWritingTimeLeft] = useState<number>(180);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const currentQ = assessment.questions[currentIdx];
  const activeQuestionStartTimeRef = useRef<number>(Date.now());

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrlMap((prev) => ({ ...prev, [currentQ.questionId]: url }));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      const targetSecs = currentQ.speakingDurationSeconds || 60;
      setRecordingSecondsLeft(targetSecs);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.warn("Microphone access unavailable:", err);
      alert("Microphone access was denied or not supported by this browser. You can write your spoken response summary in the text box below.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // 1-second interval live stopwatch & writing timer ticker
  useEffect(() => {
    if (testResult) return;

    // Reset timestamp when question changes
    activeQuestionStartTimeRef.current = Date.now();
    setCurrentQuestionElapsed(0);
    if (currentQ?.type === "writing" || currentQ?.difficultyLevel === "writing") {
      setWritingTimeLeft(180);
    }
    if (currentQ?.type === "speaking" || currentQ?.difficultyLevel === "speaking") {
      setRecordingSecondsLeft(currentQ.speakingDurationSeconds || 60);
    }

    const interval = setInterval(() => {
      // Ticking live stopwatch for active question
      const nowSeconds = Math.max(1, Math.round((Date.now() - activeQuestionStartTimeRef.current) / 1000));
      setCurrentQuestionElapsed(nowSeconds);

      // Countdown for writing questions
      setWritingTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [currentIdx, currentQ, testResult]);

  /**
   * Record exact time spent on current question before switching active index
   */
  const handleNavigateToQuestion = (targetIdx: number) => {
    if (!currentQ || targetIdx === currentIdx || targetIdx < 0 || targetIdx >= assessment.questions.length) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    const secondsSpent = Math.max(1, Math.round((Date.now() - activeQuestionStartTimeRef.current) / 1000));

    setTimeTakenPerQuestion((prev) => ({
      ...prev,
      [currentQ.questionId]: (prev[currentQ.questionId] || 0) + secondsSpent,
    }));

    // Check anti-AI fast writing trigger (<10s)
    if (currentQ.type === "writing" || currentQ.difficultyLevel === "writing") {
      const writtenText = (writingAnswers[currentQ.questionId] || "").trim();
      const totalTime = (timeTakenPerQuestion[currentQ.questionId] || 0) + secondsSpent;
      if (writtenText.length >= 15 && totalTime < 10) {
        setAiFlaggedQuestions((prev) => ({ ...prev, [currentQ.questionId]: true }));
      }
    }

    setCurrentIdx(targetIdx);
  };

  // Confirm current answer and advance to next question
  const handleConfirmCurrentQuestion = () => {
    if (currentIdx < assessment.questions.length - 1) {
      handleNavigateToQuestion(currentIdx + 1);
    }
  };

  // Submit test payload
  const handleSubmitTest = async () => {
    try {
      setIsSubmitting(true);

      // Save final time spent on active question
      const finalSecondsSpent = Math.max(1, Math.round((Date.now() - activeQuestionStartTimeRef.current) / 1000));
      const updatedTimeMap = {
        ...timeTakenPerQuestion,
        [currentQ.questionId]: (timeTakenPerQuestion[currentQ.questionId] || 0) + finalSecondsSpent,
      };

      const formattedAnswers = assessment.questions.map((q) => {
        const secondsTaken = updatedTimeMap[q.questionId] || 1;
        const isWriting = q.type === "writing" || q.difficultyLevel === "writing";
        const isSpeaking = q.type === "speaking" || q.difficultyLevel === "speaking";

        return {
          questionId: q.questionId,
          selectedOptionIndex: isWriting ? -1 : mcqAnswers[q.questionId] ?? -1,
          writtenAnswer: isWriting || isSpeaking ? writingAnswers[q.questionId] || "" : undefined,
          timeTakenSeconds: secondsTaken,
        };
      });

      const res = await fetch(`${apiBaseUrl}/api/assessments/${assessment._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(data.data);
        onSuccessResult(data.data);
      } else {
        alert(data.message || "Failed to submit assessment.");
      }
    } catch (err) {
      console.error("Test submission error:", err);
      alert("Network error submitting test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSoftSkills =
    assessment.category === "SoftSkills" ||
    assessment.assessmentType === "soft_skills" ||
    !!testResult?.softSkillsReport;

  const isSpeakingQuestion =
    currentQ?.type === "speaking" || currentQ?.difficultyLevel === "speaking";
  const isWritingQuestion = !isSoftSkills && (currentQ?.type === "writing" || currentQ?.difficultyLevel === "writing");
  const accumulatedTimeSpent = (timeTakenPerQuestion[currentQ?.questionId || ""] || 0) + currentQuestionElapsed;
  const currentWritingText = writingAnswers[currentQ?.questionId || ""] || "";
  const isCurrentFastWriting = isWritingQuestion && currentWritingText.length >= 15 && accumulatedTimeSpent < 10;

  const formatTimerString = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl p-5 lg:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                {isSoftSkills ? "Behavioral & Soft Skills Scenario Assessment" : "10-Question Competency Exam"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Pass mark: {assessment.passPercentage}%
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight mt-0.5">
              {assessment.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Test Results Overview View */}
        {testResult ? (
          testResult.softSkillsReport ? (
            /* Multi-Dimensional Behavioral & Soft Skills Report */
            <div className="space-y-5 py-2 text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold font-mono border-2 shadow-lg",
                  testResult.passed
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {testResult.softSkillsReport.overallIndex}%
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {testResult.passed
                    ? "Behavioral Competency Verified!"
                    : "Benchmark Threshold Not Met"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall Soft Skills Index: {testResult.softSkillsReport.overallIndex}% (Threshold: {assessment.passPercentage}%)
                </p>

                {/* Behavioral Archetype Badge */}
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-bold shadow-xs">
                  <Compass className="w-4 h-4" />
                  <span>Archetype: {testResult.softSkillsReport.archetype}</span>
                </div>
              </div>

              {/* 4 Multi-Dimensional Dimension Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  {
                    key: "communication",
                    label: "Communication",
                    icon: MessageSquare,
                    data: testResult.softSkillsReport.communication,
                    color: "text-sky-600 dark:text-sky-400",
                    bg: "bg-sky-500/10",
                    border: "border-sky-500/20",
                    bar: "bg-sky-500",
                  },
                  {
                    key: "teamwork",
                    label: "Teamwork & Collaboration",
                    icon: Users,
                    data: testResult.softSkillsReport.teamwork,
                    color: "text-emerald-600 dark:text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    bar: "bg-emerald-500",
                  },
                  {
                    key: "problemSolving",
                    label: "Analytical Problem Solving",
                    icon: Brain,
                    data: testResult.softSkillsReport.problemSolving,
                    color: "text-purple-600 dark:text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                    bar: "bg-purple-500",
                  },
                  {
                    key: "leadership",
                    label: "Engineering Leadership",
                    icon: Award,
                    data: testResult.softSkillsReport.leadership,
                    color: "text-amber-600 dark:text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    bar: "bg-amber-500",
                  },
                ].map((dim) => (
                  <div
                    key={dim.key}
                    className={cn("p-3.5 rounded-md border bg-card space-y-2", dim.border)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <dim.icon className={cn("w-4 h-4", dim.color)} />
                        <span className="text-xs font-bold text-foreground">{dim.label}</span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 rounded",
                          dim.bg,
                          dim.color
                        )}
                      >
                        {dim.data?.verdict || "Proficient"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-secondary/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", dim.bar)}
                        style={{ width: `${dim.data?.normalizedScore || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Normalized: {dim.data?.normalizedScore || 0}%</span>
                      <span>Raw: {dim.data?.rawScore || 0}/{dim.data?.maxPossible || 0} pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Growth Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Identified Strengths</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    {testResult.softSkillsReport.keyStrengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-md bg-sky-500/5 border border-sky-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Targeted Development Focus</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    {testResult.softSkillsReport.growthAreas?.map((g: string, i: number) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified Badge Earned */}
              {testResult.badgeAwarded && (
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Verified Credential Badge: <strong>{testResult.badgeAwarded}</strong></span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Technical Test Result View */
            <div className="space-y-5 py-3 text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold font-mono border-2 shadow-lg",
                  testResult.passed
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {testResult.percentage}%
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {testResult.passed ? "Assessment Passed & Verified!" : "Benchmark Threshold Not Met"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You scored {testResult.score} out of {testResult.totalQuestions} questions correctly.
                </p>

                {(testResult.totalAttempts > 1 || testResult.averagePercentage !== undefined) && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/80 border border-border text-xs font-mono">
                    <span>Attempt Score: <strong>{testResult.percentage}%</strong></span>
                    <span className="text-muted-foreground/60">•</span>
                    <span>Cumulative Skill Average: <strong className="text-primary">{testResult.averagePercentage ?? testResult.percentage}%</strong> ({testResult.totalAttempts || 1} {testResult.totalAttempts === 1 ? "attempt" : "attempts"})</span>
                  </div>
                )}

                {testResult.badgeAwarded && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                    <Award className="w-4 h-4" />
                    Verified Badge Earned: {testResult.badgeAwarded}
                  </div>
                )}
              </div>

              {/* AI Flagging Telemetry Summary */}
              {testResult.aiFlaggedCount > 0 ? (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>AI Generation Flag Triggered ({testResult.aiFlaggedCount} Question(s))</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    One or more written scenario responses were completed in under 10 seconds (&lt;10s) and flagged as <strong>"Seems AI Generated"</strong> in your official telemetry audit.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Genuine Human Submission — No AI Flags</span>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )
        ) : (
          /* Live Interactive Exam Stepper */
          <div className="space-y-4">
            {/* Question Section Stepper Tabs */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-border">
              {assessment.questions.map((q, idx) => {
                const isWriting = q.type === "writing" || q.difficultyLevel === "writing";
                const isSpeaking = q.type === "speaking" || q.difficultyLevel === "speaking";

                const isAnswered = isWriting
                  ? (writingAnswers[q.questionId] || "").trim().length >= 10
                  : isSpeaking
                  ? mcqAnswers[q.questionId] !== undefined || !!audioUrlMap[q.questionId] || (writingAnswers[q.questionId] || "").trim().length >= 10
                  : mcqAnswers[q.questionId] !== undefined;

                const isCurrent = idx === currentIdx;
                const isFlagged = aiFlaggedQuestions[q.questionId];

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => handleNavigateToQuestion(idx)}
                    className={cn(
                      "flex-1 min-w-[32px] py-1.5 px-1 rounded-md text-[11px] font-mono text-center font-semibold border transition-all cursor-pointer",
                      isCurrent
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : isFlagged
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300"
                        : isAnswered
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-secondary/60 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {isSoftSkills ? `S${idx + 1}` : `Q${idx + 1}`}
                  </button>
                );
              })}
            </div>

            {/* Current Question Meta & Live Ticking Timer */}
            <div className="flex items-center justify-between gap-2 bg-secondary/40 p-2.5 rounded-md border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {isSoftSkills ? `Scenario ${currentIdx + 1} of ${assessment.questions.length}` : `Question ${currentIdx + 1} of ${assessment.questions.length}`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border text-muted-foreground uppercase">
                  {isSoftSkills
                    ? (currentQ?.concept || (isSpeakingQuestion ? "Speaking & Verbal Articulation Scenario" : "Workplace Dilemma Scenario"))
                    : currentQ?.difficultyLevel === "easy"
                    ? "Easy MCQ (1 pt)"
                    : currentQ?.difficultyLevel === "medium"
                    ? "Medium Concept MCQ (2 pts)"
                    : "Stack Scenario (3 Min Timer)"}
                </span>
              </div>

              {/* Ticking Timer Display */}
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {isSpeakingQuestion ? (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded border",
                    isRecording
                      ? "text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse"
                      : "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20"
                  )}>
                    <Mic className={cn("w-3.5 h-3.5", isRecording && "animate-bounce text-rose-500")} />
                    <span>
                      {isRecording
                        ? `Recording: ${formatTimerString(recordingSecondsLeft)} left`
                        : `Target: ${currentQ?.speakingDurationSeconds || 60}s Audio`}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-80 pl-1 font-normal">
                      (Elapsed: {accumulatedTimeSpent}s)
                    </span>
                  </div>
                ) : isWritingQuestion ? (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                    <span>3 Min Timer: {formatTimerString(writingTimeLeft)}</span>
                    <span className="text-[10px] text-muted-foreground opacity-80 pl-1 font-normal">
                      (Elapsed: {accumulatedTimeSpent}s)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                    <Timer className="w-3.5 h-3.5 animate-spin" />
                    <span>Time Spent: {formatTimerString(accumulatedTimeSpent)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-md bg-background border border-border space-y-3">
              <div className="flex items-start gap-2.5">
                {isSpeakingQuestion ? (
                  <Mic className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                ) : isWritingQuestion ? (
                  <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h3 className="text-xs lg:text-sm font-bold text-foreground leading-relaxed">
                    {currentQ.questionText}
                  </h3>
                  {isSpeakingQuestion && (
                    <p className="text-[11px] text-muted-foreground">
                      Record a spoken response ({currentQ.speakingDurationSeconds || 60}s target) or take notes below, then select your primary strategic response approach.
                    </p>
                  )}
                </div>
              </div>

              {/* Rubric badges for speaking questions */}
              {isSpeakingQuestion && currentQ.evaluationRubric && currentQ.evaluationRubric.length > 0 && (
                <div className="p-2.5 rounded-md bg-secondary/40 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Target Evaluation Criteria & Rubric:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.evaluationRubric.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice recording & written transcript widget for Speaking Questions */}
              {isSpeakingQuestion && (
                <div className="p-3.5 rounded-md border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                      Audio Response Recording ({currentQ.speakingDurationSeconds || 60}s Target)
                    </span>
                    {audioUrlMap[currentQ.questionId] && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Audio Recorded
                      </span>
                    )}
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{audioUrlMap[currentQ.questionId] ? "Re-record Audio Answer" : "Start Voice Recording"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 animate-pulse text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Recording ({recordingSecondsLeft}s left)</span>
                      </button>
                    )}

                    {audioUrlMap[currentQ.questionId] && !isRecording && (
                      <div className="flex items-center gap-2">
                        <audio
                          controls
                          src={audioUrlMap[currentQ.questionId]}
                          className="h-8 max-w-[240px]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Written Transcript/Notes */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-medium text-muted-foreground block">
                      Spoken Transcript / Response Outline (Optional fallback if mic is blocked):
                    </label>
                    <textarea
                      rows={2}
                      value={writingAnswers[currentQ.questionId] || ""}
                      onChange={(e) =>
                        setWritingAnswers((prev) => ({
                          ...prev,
                          [currentQ.questionId]: e.target.value,
                        }))
                      }
                      placeholder="Outline your talking points or write your spoken response summary here..."
                      className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* MCQ Options vs Writing Textarea */}
              {isWritingQuestion ? (
                <div className="space-y-2 pt-2">
                  <textarea
                    rows={5}
                    value={writingAnswers[currentQ.questionId] || ""}
                    onChange={(e) =>
                      setWritingAnswers((prev) => ({
                        ...prev,
                        [currentQ.questionId]: e.target.value,
                      }))
                    }
                    placeholder="Write your comprehensive technical analysis here (explain diagnostic tools, root cause isolation, and verification steps)..."
                    className="w-full p-3 rounded-md border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                  />

                  {/* Anti-AI Live Telemetry Warning Tag */}
                  {(isCurrentFastWriting || aiFlaggedQuestions[currentQ.questionId]) && (
                    <div className="p-2.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>⚠️ Seems AI Generated (Completed / Typed in &lt; 10 seconds)</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 font-bold">
                        Response time: {accumulatedTimeSpent}s
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {isSpeakingQuestion && (
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block pt-1">
                      Choose Your Core Strategy / Approach:
                    </span>
                  )}
                  {currentQ.options.map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-md text-xs border cursor-pointer transition-all",
                        mcqAnswers[currentQ.questionId] === oIdx
                          ? "bg-primary/10 border-primary text-foreground font-semibold shadow-xs"
                          : "border-border hover:bg-secondary text-foreground"
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.questionId}`}
                        checked={mcqAnswers[currentQ.questionId] === oIdx}
                        onChange={() =>
                          setMcqAnswers((prev) => ({ ...prev, [currentQ.questionId]: oIdx }))
                        }
                        className="text-primary"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => handleNavigateToQuestion(currentIdx - 1)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIdx < assessment.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleConfirmCurrentQuestion}
                    className="text-xs font-semibold px-4 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1 cursor-pointer"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitTest}
                    className="text-xs font-bold px-5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Submit Complete Exam</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

