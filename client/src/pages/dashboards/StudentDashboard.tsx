import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Bot,
  Search,
  Send,
  X,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Briefcase,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface UserProfile {
  _id?: string;
  name: string;
  category?: "individual" | "organization";
  accountType: string;
  institution?: string;
  institutionName?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  skills?: string[];
  certifications?: Array<{
    _id?: string;
    title: string;
    issuer?: string;
    credentialUrl?: string;
    isVerified?: boolean;
  }>;
}

interface Opportunity {
  _id: string;
  title: string;
  description: string;
  organization: string;
  category: string;
  domain: string;
  location: string;
  mode: string;
  duration: string;
  stipendOrPrize: string;
  requiredSkills: string[];
  deadline: string;
  recommendedToStudentsBy?: string[];
  applicantCount: number;
}

interface AssessmentQuestion {
  questionId: string;
  questionText: string;
  options: string[];
  weight: number;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillVectors: string[];
  durationMinutes: number;
  passPercentage: number;
  difficulty: string;
  badgeAwarded: string;
  questions: AssessmentQuestion[];
}

interface Application {
  _id: string;
  opportunityId: {
    _id: string;
    title: string;
    organization: string;
    stipendOrPrize: string;
    category: string;
    mode: string;
  };
  matchScore: number;
  status: string;
  appliedAt: string;
  reviewerNotes?: string;
}

const STUDENT_CONCERN_CHIPS = [
  "Why is my match score low & how do I improve it?",
  "I failed an assessment test — what are my options?",
  "How do I balance semester exams with internships?",
  "My college hasn't verified my skills yet",
  "What skills am I missing for top postings?",
];

function formatAiMessage(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1 my-1.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="font-mono text-[10.5px] bg-secondary px-1 py-0.5 rounded text-primary font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`flush-${idx}`);
      return;
    }

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
      flushList(`flush-${idx}`);
      const headingText = trimmed.replace(/^#+\s*/, "");
      elements.push(
        <h4 key={idx} className="font-bold text-foreground text-xs mt-3 mb-1 tracking-tight border-b border-border/40 pb-0.5">
          {renderInline(headingText)}
        </h4>
      );
    } else if (trimmed.startsWith("#### ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <h5 key={idx} className="font-semibold text-foreground text-[11px] mt-2 mb-0.5">
          {renderInline(trimmed.slice(5))}
        </h5>
      );
    } else if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={idx} className="text-xs leading-relaxed text-foreground/90 flex items-start gap-1.5">
          <span className="text-primary font-mono text-[10px] mt-0.5">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </li>
      );
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      flushList(`flush-${idx}`);
      elements.push(
        <div key={idx} className="text-xs leading-relaxed text-foreground/90 my-1 flex items-start gap-1.5">
          <span className="font-mono text-[10px] font-semibold text-primary mt-0.5">{trimmed.match(/^\d+[\.\)]/)?.[0]}</span>
          <span>{renderInline(trimmed.replace(/^\d+[\.\)]\s*/, ""))}</span>
        </div>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <blockquote key={idx} className="border-l-2 border-primary/60 pl-2.5 my-1.5 italic text-muted-foreground text-[11px] bg-secondary/30 py-1 rounded-r">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
      flushList(`flush-${idx}`);
      elements.push(<hr key={idx} className="border-border my-2" />);
    } else {
      flushList(`flush-${idx}`);
      elements.push(
        <p key={idx} className="text-xs leading-relaxed text-foreground/90 my-1">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  flushList("final-flush");
  return elements;
}

export default function StudentDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Apply Modal State
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [applyNotes, setApplyNotes] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appFeedback, setAppFeedback] = useState<string | null>(null);

  // AI Chat Drawer State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your PortalAcademia Contextual AI Career Guide. Ask me about your skill gaps, matching opportunities, or how to prepare for interviews.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  /**
   * @description Fetch student live profile data
   * @returns {Promise<void>}
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  /**
   * @description Fetch live opportunities feed
   * @returns {Promise<void>}
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
    }
  }, []);

  /**
   * @description Fetch standardized skill assessment tests
   * @returns {Promise<void>}
   */
  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessments`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAssessments(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
    }
  }, []);

  /**
   * @description Fetch student submitted applications
   * @returns {Promise<void>}
   */
  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/my-applications`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchOpportunities(), fetchAssessments(), fetchApplications()])
      .catch((err) => console.error("Initial load error:", err))
      .finally(() => setIsLoading(false));
  }, [fetchProfile, fetchOpportunities, fetchAssessments, fetchApplications]);

  /**
   * @description Add a skill tag and sync to profile
   */
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim() || !profile) return;
    const skillName = newSkillInput.trim();
    const updatedSkills = Array.from(new Set([...(profile.skills || []), skillName]));

    setIsUpdatingSkill(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ skills: updatedSkills }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => (prev ? { ...prev, skills: updatedSkills } : null));
        setNewSkillInput("");
      }
    } catch (err) {
      console.error("Failed to update skills:", err);
    } finally {
      setIsUpdatingSkill(false);
    }
  };

  /**
   * @description Submit assessment answers and compute score
   */
  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;
    const formattedAnswers = activeQuiz.questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionIndex: quizAnswers[q.questionId] ?? -1,
    }));

    setQuizSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/${activeQuiz._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data.data);
        await fetchProfile(); // refresh verified skills
      }
    } catch (err) {
      console.error("Quiz submission failed:", err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  /**
   * @description Submit job/internship application
   */
  const handleApply = async () => {
    if (!applyingOpportunity) return;
    setIsSubmittingApp(true);
    setAppFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          opportunityId: applyingOpportunity._id,
          notes: applyNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppFeedback("Application submitted successfully!");
        await fetchApplications();
        setTimeout(() => {
          setApplyingOpportunity(null);
          setApplyNotes("");
          setAppFeedback(null);
        }, 1500);
      } else {
        setAppFeedback(data.message || "Failed to submit application.");
      }
    } catch (err: any) {
      setAppFeedback(err.message || "Network error occurred.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  /**
   * @description Send chat query to contextual AI HelpBOT
   */
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;
    const userText = aiQuery.trim();
    setAiQuery("");
    setAiChatHistory((prev) => [...prev, { role: "user", content: userText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: userText,
          history: aiChatHistory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.data.response },
        ]);
      } else {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue analyzing your telemetry. Please try again." },
        ]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI guide." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * @description Send one-click concern starter query to AI
   */
  const handleSendChipMessage = async (text: string) => {
    if (isAiLoading || !text.trim()) return;
    setAiQuery("");
    setAiChatHistory((prev) => [...prev, { role: "user", content: text }]);
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: text,
          history: aiChatHistory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.data.response },
        ]);
      } else {
        setAiChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue analyzing your telemetry. Please try again." },
        ]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI guide." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesCategory =
        selectedCategory === "all" ||
        opp.category === selectedCategory ||
        (selectedCategory === "recommended" && (opp.recommendedToStudentsBy?.length || 0) > 0);

      const matchesSearch =
        !searchQuery ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [opportunities, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading student verified profile & opportunity marketplace…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Global Stakeholder Bar & Dual-Theme Switcher */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Portal<span className="text-primary font-mono">Academia</span>
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground font-mono">
            Pillar 1: Student Console
          </span>
        </div>



        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border"
          >
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span>AI Career Guide</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => dispatch(signOutThunk()).then(() => navigate("/auth"))}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary border border-border"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Profile & Verified Portfolio Strip */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "ST"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground tracking-tight">
                    {profile?.name || "Student Scholar"}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified AISHE Learner
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile?.institution || profile?.institutionName || "Affiliated Institution Pending"} • {profile?.institutionEmail || "Email not verified"}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Verified Skills</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {profile?.skills?.length || 0}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Active Applications</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {applications.length}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Readiness Index</span>
                <span className="font-bold text-primary tabular-nums text-sm">
                  {profile?.skills && profile.skills.length > 0
                    ? `${Math.min(100, profile.skills.length * 15)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Skill Badges & Live Insertion Form */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Skills:</span>
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border font-mono"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">No skills listed yet</span>
              )}
            </div>

            <form onSubmit={handleAddSkill} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add skill (e.g. Docker, Python)"
                disabled={isUpdatingSkill}
                className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary w-48"
              />
              <button
                type="submit"
                disabled={isUpdatingSkill || !newSkillInput.trim()}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isUpdatingSkill ? "Adding…" : "Add"}
              </button>
            </form>
          </div>
        </section>

        {/* 3. Two-Column Workspace: Standardized Skill Assessments + Live Applications Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Standardized Skill Assessment Desk */}
          <section className="lg:col-span-2 bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Standardized Skill Assessment Engine
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SIH 26044 Mandate: Take objective technical quizzes to earn verified competency badges and boost recruiter shortlisting rank.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessments.map((quiz) => (
                <div
                  key={quiz._id}
                  className="p-3.5 rounded-md border border-border bg-background flex flex-col justify-between hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                        {quiz.category} • {quiz.difficulty}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quiz.durationMinutes}m
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-foreground tracking-tight leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {quiz.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-mono text-primary font-semibold">
                      Pass: {quiz.passPercentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuiz(quiz);
                        setQuizAnswers({});
                        setQuizResult(null);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Start Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right 1 Col: Application Pipeline Tracker */}
          <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Applications Tracker
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                {applications.length} Active
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border rounded-md">
                <p className="text-xs text-muted-foreground">No submitted applications yet.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Browse live opportunities below and click "Apply".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="p-3 rounded-md border border-border bg-background space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {app.opportunityId?.title || "Opportunity Posting"}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {app.opportunityId?.organization}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary text-primary font-bold">
                        {app.matchScore}% Match
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md font-semibold text-[10px]",
                          app.status === "Shortlisted" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                          app.status === "Applied" && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                          app.status === "Technical Interview" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          app.status === "Rejected" && "bg-red-500/10 text-red-600 border border-red-500/20"
                        )}
                      >
                        {app.status}
                      </span>
                    </div>

                    {app.reviewerNotes && (
                      <p className="text-[10px] text-muted-foreground italic bg-secondary p-1.5 rounded-md mt-1">
                        Note: {app.reviewerNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 4. Live Marketplace Feed (Internships, Hackathons, Workshops) */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Live Opportunity Discovery Feed
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vetted corporate postings, government hackathons, and institutional programs synced in real time.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, domain, company…"
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
            {[
              { id: "all", label: "All Postings" },
              { id: "internship", label: "Internships" },
              { id: "hackathon", label: "Hackathons" },
              { id: "workshop", label: "Workshops" },
              { id: "recommended", label: "College Endorsed" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                  selectedCategory === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Opportunity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredOpportunities.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-border rounded-md">
                <p className="text-xs text-muted-foreground">No opportunities matching your criteria.</p>
              </div>
            ) : (
              filteredOpportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-background border border-border rounded-md p-4 flex flex-col justify-between hover:border-primary/50 transition-colors space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase font-bold border border-border">
                        {opp.category}
                      </span>
                      {(opp.recommendedToStudentsBy?.length || 0) > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          ★ Endorsed
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-foreground tracking-tight leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {opp.organization} • <span className="font-mono">{opp.location} ({opp.mode})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {opp.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {opp.requiredSkills.map((sk, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Stipend / Prize</span>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {opp.stipendOrPrize}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyingOpportunity(opp)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 5. Interactive Assessment Taking Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">{activeQuiz.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {activeQuiz.questions.length} Questions • Pass mark: {activeQuiz.passPercentage}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quizResult ? (
              <div className="space-y-4 py-4 text-center">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold font-mono border",
                    quizResult.passed
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  )}
                >
                  {quizResult.percentage}%
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {quizResult.passed ? "Assessment Passed!" : "Assessment Benchmark Not Met"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    You scored {quizResult.score} out of {quizResult.totalQuestions} questions correctly.
                  </p>
                  {quizResult.badgeAwarded && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                      <Award className="w-3.5 h-3.5" />
                      Badge Awarded: {quizResult.badgeAwarded}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={q.questionId} className="space-y-2 p-3 rounded-md bg-background border border-border">
                    <p className="text-xs font-semibold text-foreground">
                      {idx + 1}. {q.questionText}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-md text-xs border cursor-pointer transition-colors",
                            quizAnswers[q.questionId] === oIdx
                              ? "bg-primary/10 border-primary text-foreground font-semibold"
                              : "border-border hover:bg-secondary text-foreground"
                          )}
                        >
                          <input
                            type="radio"
                            name={`question-${q.questionId}`}
                            checked={quizAnswers[q.questionId] === oIdx}
                            onChange={() =>
                              setQuizAnswers((prev) => ({ ...prev, [q.questionId]: oIdx }))
                            }
                            className="text-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActiveQuiz(null)}
                    disabled={quizSubmitting}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={quizSubmitting}
                    className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    {quizSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Submit Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. One-Click Application Modal */}
      {applyingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Submit Application</h3>
                <p className="text-xs text-muted-foreground">{applyingOpportunity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingOpportunity(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-md bg-background border border-border text-xs space-y-1">
                <p className="text-muted-foreground">
                  Organization: <span className="font-semibold text-foreground">{applyingOpportunity.organization}</span>
                </p>
                <p className="text-muted-foreground">
                  Stipend / Prize: <span className="font-semibold text-foreground font-mono">{applyingOpportunity.stipendOrPrize}</span>
                </p>
                <p className="text-muted-foreground">
                  Required Skills: <span className="font-mono text-foreground">{applyingOpportunity.requiredSkills.join(", ")}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Candidate Cover Note (Optional)
                </label>
                <textarea
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="Summarize your hands-on experience and project links relevant to this position…"
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {appFeedback && (
                <p className="text-xs font-medium text-primary text-center font-mono">
                  {appFeedback}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingOpportunity(null)}
                  disabled={isSubmittingApp}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSubmittingApp}
                  className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                >
                  {isSubmittingApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Contextual AI HelpBOT Drawer */}
      {isAiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>AI Career Guide</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-normal">SIH 26044</span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">Empathetic Career & Placement Telemetry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {aiChatHistory.length === 0 && (
              <div className="p-3.5 bg-secondary/40 border border-border rounded-md space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Contextual AI Career Mentor</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  I analyze your live verified competencies, benchmark assessment results, and active application pipeline to address your real career anxieties and academic concerns:
                </p>
                <div className="pt-1 flex flex-col gap-1.5">
                  {STUDENT_CONCERN_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendChipMessage(chip)}
                      disabled={isAiLoading}
                      className="text-[11px] text-left px-2.5 py-1.5 rounded bg-card hover:bg-secondary text-foreground border border-border transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="truncate pr-2">{chip}</span>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-mono shrink-0">Ask →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiChatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-md text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-6"
                    : "bg-background border border-border text-foreground mr-4 font-sans space-y-1"
                )}
              >
                {msg.role === "user" ? msg.content : formatAiMessage(msg.content)}
              </div>
            ))}
            {isAiLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-background border border-border rounded-md mr-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Analyzing your verified skills & application telemetry…</span>
              </div>
            )}
          </div>

          {aiChatHistory.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex gap-1.5 overflow-x-auto text-[10px]">
              {STUDENT_CONCERN_CHIPS.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChipMessage(chip)}
                  disabled={isAiLoading}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendAiMessage} className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about match scores, assessment retakes, stress…"
              className="flex-1 text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiQuery.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
