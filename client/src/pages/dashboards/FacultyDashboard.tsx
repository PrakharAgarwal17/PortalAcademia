import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  Bot,
  Search,
  Send,
  X,
  Loader2,
  Briefcase,
  Sparkles,
  MapPin,
  Building2,
  Clock,
  Star,
  ArrowRight,
  Coins,
  ShieldCheck,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";
import { searchSkillSuggestions } from "@/lib/skillIcons";
import TestConfirmationModal from "@/components/TestConfirmationModal";
import SkillTestRunnerModal from "@/components/SkillTestRunnerModal";
import Navbar from "@/components/Navbar";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface FacultyProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
  category?: "individual" | "organization";
  accountType: string;
  designation?: string;
  department?: string;
  institution?: string;
  institutionName?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  skills?: string[];
  expertise?: string[];
  researchInterests?: string[];
  bio?: string;
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
  recommendedToFacultyBy?: string[];
  recommendedToStudentsBy?: string[];
  recommendedByColleges?: string[];
  targetAudience?: "student" | "faculty" | "both";
  applicantCount: number;
}

interface AssessmentQuestion {
  questionId: string;
  questionText: string;
  type?: "mcq" | "writing";
  difficultyLevel?: "easy" | "medium" | "writing";
  concept?: string;
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
  weight?: number;
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

const FACULTY_CONCERN_CHIPS = [
  "How are IP rights handled during industry sabbaticals?",
  "Which corporate immersion projects grant MHRD CAS credits?",
  "How do I align my course syllabus with industry deficits?",
  "How can I initiate a corporate research collaboration?",
  "What skills are high in demand for sponsored research grants?",
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

export default function FacultyDashboard() {
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [testedSkills, setTestedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false);

  // Quiz Modal State
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [targetTestSkill, setTargetTestSkill] = useState<string | undefined>(undefined);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);

  const openTestConfirmation = (skillName?: string) => {
    setTargetTestSkill(skillName);
    setIsConfirmationOpen(true);
  };

  // Proposal / Apply Modal State
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
      content: "Welcome Professor! I am your AI Academic Immersion Advisor. Ask me anything about faculty sabbaticals, FDPs, research grants, CAS credits, or industry partnerships.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  /**
   * @description Fetch faculty live profile data
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
   * @description Fetch live opportunities feed for faculty
   * @returns {Promise<void>}
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities?targetAudience=faculty`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Strict deduplication of incoming data by ID and Title
        const seen = new Set<string>();
        const uniqueData: Opportunity[] = [];
        for (const opp of data.data) {
          const idKey = opp._id ? String(opp._id).trim() : "";
          const titleKey = opp.title ? opp.title.toLowerCase().trim() : "";
          if (idKey && seen.has(idKey)) continue;
          if (titleKey && seen.has(titleKey)) continue;
          if (idKey) seen.add(idKey);
          if (titleKey) seen.add(titleKey);
          uniqueData.push(opp);
        }
        setOpportunities(uniqueData.length > 0 ? uniqueData : []);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
      setOpportunities([]);
    }
  }, []);

  /**
   * @description Fetch faculty submitted applications / proposals
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

  /**
   * @description Fetch past assessment results to know which skills are verified/tested
   * @returns {Promise<void>}
   */
  const fetchTestResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessments/my-results`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const verifiedSet = new Set<string>();
        data.data.forEach((r: { passed?: boolean; verifiedSkillsAdded?: string[] }) => {
          if (r.passed) {
            (r.verifiedSkillsAdded || []).forEach((s: string) => verifiedSet.add(s.toLowerCase()));
          }
        });
        setTestedSkills(Array.from(verifiedSet));
      }
    } catch (err) {
      console.error("Failed to fetch test results:", err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchProfile(),
      fetchOpportunities(),
      fetchApplications(),
      fetchTestResults(),
    ])
      .catch((err) => console.error("Initial load error:", err))
      .finally(() => setIsLoading(false));
  }, [fetchProfile, fetchOpportunities, fetchApplications, fetchTestResults]);

  // Unified skills and expertise array
  const facultyCompetencies = useMemo(() => {
    const list = [
      ...(profile?.skills || []),
      ...(profile?.expertise || []),
    ];
    return Array.from(new Set(list));
  }, [profile?.skills, profile?.expertise]);

  // Derived verified competencies count matching passed assessments
  const verifiedCompetenciesCount = useMemo(() => {
    return facultyCompetencies.filter((skill) =>
      testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase())
    ).length;
  }, [facultyCompetencies, testedSkills]);



  /**
   * @description Add an expertise/skill tag and sync to profile
   * @param {React.FormEvent} [e] - Form submission event
   * @param {string} [customSkill] - Preselected skill name
   * @returns {Promise<void>}
   */
  const handleAddSkill = async (e?: React.FormEvent, customSkill?: string) => {
    if (e) e.preventDefault();
    const skillName = (customSkill || newSkillInput).trim();
    if (!skillName || !profile) return;
    const currentSkills = profile.skills || [];
    const updatedSkills = Array.from(new Set([...currentSkills, skillName]));

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
   * @description Remove an expertise/skill tag and sync to profile
   * @param {string} skillToRemove - Skill to delete
   * @returns {Promise<void>}
   */
  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const currentSkills = profile.skills || [];
    const updatedSkills = currentSkills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase());
    const currentExpertise = profile.expertise || [];
    const updatedExpertise = currentExpertise.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase());

    setIsUpdatingSkill(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ skills: updatedSkills, expertise: updatedExpertise }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) =>
          prev ? { ...prev, skills: updatedSkills, expertise: updatedExpertise } : null
        );
      }
    } catch (err) {
      console.error("Failed to remove skill:", err);
    } finally {
      setIsUpdatingSkill(false);
    }
  };

  /**
   * @description Confirm skill and generate AI dynamic assessment
   * @param {string} selectedSkill - Target skill
   * @returns {Promise<void>}
   */
  const handleGenerateTestFromConfirmation = async (selectedSkill: string) => {
    setIsGeneratingTest(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/generate-for-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ skill: selectedSkill }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setIsConfirmationOpen(false);
        setActiveQuiz(data.data);
      } else {
        alert(data.message || "Failed to generate test. Please try again.");
      }
    } catch (err) {
      console.error("Error generating assessment:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  /**
   * @description Submit application / proposal for an opportunity
   * @returns {Promise<void>}
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
        setAppFeedback("Proposal submitted successfully to institution / corporate desk!");
        await fetchApplications();
        setTimeout(() => {
          setApplyingOpportunity(null);
          setApplyNotes("");
          setAppFeedback(null);
        }, 1500);
      } else {
        setAppFeedback(data.message || "Failed to submit proposal.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error occurred.";
      setAppFeedback(errorMsg);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  /**
   * @description Send chat query to contextual AI
   * @param {React.FormEvent} e - Form submission event
   * @returns {Promise<void>}
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
          { role: "assistant", content: "Apologies, I encountered an issue analyzing academic telemetry. Please try again." },
        ]);
      }
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI advisor." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * @description Send one-click concern starter query to AI
   * @param {string} text - Selected prompt text
   * @returns {Promise<void>}
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
          { role: "assistant", content: "Apologies, I encountered an issue analyzing academic telemetry." },
        ]);
      }
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI advisor." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * @description Calculate skill match score (%) between faculty profile competencies and opportunity requirements
   * @param {string[]} requiredSkills - List of required skills
   * @returns {{ score: number, matchedSkills: string[], totalRequired: number }}
   */
  const computeSkillMatch = useCallback((requiredSkills: string[] = []) => {
    const userSkills = facultyCompetencies;
    if (!requiredSkills || requiredSkills.length === 0) {
      return { score: 100, matchedSkills: userSkills, totalRequired: 0 };
    }
    const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
    const matchedSkills: string[] = [];

    requiredSkills.forEach((reqSkill) => {
      const normReq = reqSkill.toLowerCase().trim();
      if (normalizedUserSkills.some((us) => us.includes(normReq) || normReq.includes(us))) {
        matchedSkills.push(reqSkill);
      }
    });

    const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);
    return { score, matchedSkills, totalRequired: requiredSkills.length };
  }, [facultyCompetencies]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    // Strict deduplication by ID and normalized title
    const seen = new Set<string>();
    const uniqueOpportunities = opportunities.filter((opp) => {
      const idKey = opp._id ? String(opp._id).trim() : "";
      const titleKey = opp.title ? opp.title.toLowerCase().trim() : "";
      if (idKey && seen.has(idKey)) return false;
      if (titleKey && seen.has(titleKey)) return false;
      if (idKey) seen.add(idKey);
      if (titleKey) seen.add(titleKey);
      return true;
    });

    const list = uniqueOpportunities.filter((opp) => {
      const matchesAudience =
        opp.targetAudience === "faculty" ||
        opp.targetAudience === "both" ||
        opp.category === "fdp" ||
        opp.category === "research" ||
        opp.category === "sabbatical" ||
        opp.category === "conference" ||
        opp.category === "workshop";

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "skill_matched" ||
        opp.category === selectedCategory ||
        (selectedCategory === "recommended" &&
          ((opp.recommendedToFacultyBy?.length || 0) > 0 || (opp.recommendedByColleges?.length || 0) > 0));

      const matchesSearch =
        !searchQuery ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesAudience && matchesCategory && matchesSearch;
    });

    if (selectedCategory === "skill_matched") {
      return [...list].sort((a, b) => {
        const scoreA = computeSkillMatch(a.requiredSkills).score;
        const scoreB = computeSkillMatch(b.requiredSkills).score;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [opportunities, selectedCategory, searchQuery, computeSkillMatch]);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FA";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading faculty verified profile & immersion marketplace…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Global Stakeholder Navigation Bar */}
      <Navbar userName={profile?.name} profileId={profile?._id} userRole="faculty" />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Profile & Verified Portfolio Strip */}
        <section className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div
                onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-muted border-2 border-primary/30 flex items-center justify-center font-bold text-base text-foreground cursor-pointer hover:border-primary transition-all duration-300 overflow-hidden shadow-md group shrink-0"
                title="View Full Profile"
              >
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="group-hover:text-primary transition-colors font-mono">
                    {initials}
                  </span>
                )}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
                    title="View Full Profile"
                  >
                    {profile?.name || "Professor / Faculty Scholar"}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 text-[11px] font-bold" title="Verified Faculty Educator">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Verified Faculty Educator
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-[11px] font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <span>Edit Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {profile?.headline || `${profile?.designation || "Associate Professor"} • ${profile?.department || "Computer Science & Engineering"} • ${profile?.institution || profile?.institutionName || "Affiliated University"}`}
                </p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Verified Expertise</span>
                <span className="font-bold text-foreground tabular-nums text-base flex items-baseline gap-1">
                  <span className={verifiedCompetenciesCount > 0 ? "text-emerald-500 font-bold" : "text-foreground"}>
                    {verifiedCompetenciesCount}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground font-sans">
                    / {facultyCompetencies.length}
                  </span>
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Immersion Proposals</span>
                <span className="font-bold text-foreground tabular-nums text-base">
                  {applications.length}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                <span className="text-primary block text-[10px] uppercase tracking-wider font-bold">Readiness Score</span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {facultyCompetencies.length > 0
                    ? `${Math.min(100, facultyCompetencies.length * 20)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Skill / Expertise Badges & Live Insertion Form with Simple Icons */}
          <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-xs text-muted-foreground mr-1">Expertise & Skills:</span>
              {facultyCompetencies.length > 0 ? (
                facultyCompetencies.map((skill, idx) => {
                  const isTested = testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase());
                  return (
                    <SkillBadge
                      key={idx}
                      skill={skill}
                      size="sm"
                      isTested={isTested}
                      onClick={!isTested ? () => openTestConfirmation(skill) : undefined}
                      onRemove={() => handleRemoveSkill(skill)}
                    />
                  );
                })
              ) : (
                <span className="text-xs text-muted-foreground italic">No domains listed yet</span>
              )}

              <button
                type="button"
                onClick={() => openTestConfirmation()}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                title="Accredit competencies with verified assessment test"
              >
                <Sparkles className="w-3 h-3" />
                <span>Verify Competency</span>
              </button>
            </div>

            <div className="relative">
              <form onSubmit={handleAddSkill} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Add expertise (e.g. VLSI, PyTorch)"
                  disabled={isUpdatingSkill}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary w-52"
                />
                <button
                  type="submit"
                  disabled={isUpdatingSkill || !newSkillInput.trim()}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isUpdatingSkill ? "Adding…" : "Add"}
                </button>
              </form>

              {/* Autocomplete Dropdown from Simple Icons */}
              {newSkillInput.trim().length > 0 && (
                <div className="absolute z-40 right-0 mt-1 w-60 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg text-popover-foreground">
                  <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    Simple Icons Matches
                  </div>
                  {searchSkillSuggestions(newSkillInput.trim(), 5).map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => handleAddSkill(undefined, item.title)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-xs text-xs hover:bg-muted/80 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          role="img"
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ fill: `#${item.hex}` }}
                          aria-hidden="true"
                        >
                          <path d={item.path} />
                        </svg>
                        <span className="font-medium text-foreground">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        + Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Live Opportunity Discovery Feed */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Academic Immersion & Sabbaticals Discovery Feed
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vetted corporate sabbaticals, research grants, FDPs, national conferences, and industrial residencies synced in real time.
              </p>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search expertise, domain, host…"
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => navigate("/trends/faculty")}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                title="View Academic & R&D Market Trends"
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">R&D Trends</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAiOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                title="Open AI Academic Advisor"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Advisor</span>
              </button>
            </div>
          </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
              {[
                { id: "all", label: "All Postings" },
                { id: "skill_matched", label: "⚡ Top Skill Match" },
                { id: "fdp", label: "FDPs" },
                { id: "research", label: "Research Grants" },
                { id: "conference", label: "Conferences" },
                { id: "workshop", label: "Workshops" },
                { id: "sabbatical", label: "Industrial Sabbaticals" },
                { id: "recommended", label: "College Endorsed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    selectedCategory === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Opportunity Grid (2 per row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredOpportunities.length === 0 ? (
                <div className="col-span-full py-12 text-center border border-dashed border-border rounded-md">
                  <p className="text-xs text-muted-foreground">No opportunities matching your criteria.</p>
                </div>
              ) : (
                filteredOpportunities.map((opp) => {
                  const { score: matchScore, matchedSkills, totalRequired } = computeSkillMatch(
                    opp.requiredSkills
                  );

                  return (
                    <div
                      key={opp._id}
                      className="group relative bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden space-y-4"
                    >
                      {/* Glowing background accent on hover */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                      <div className="space-y-3 relative z-10">
                        {/* Top Pill Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-2xs",
                              opp.category === "fdp"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                : opp.category === "research"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : opp.category === "conference"
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                : opp.category === "workshop"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            )}
                          >
                            {opp.category === "sabbatical"
                              ? "Industrial Sabbatical"
                              : opp.category === "research"
                              ? "Research Grant"
                              : opp.category.toUpperCase()}
                          </span>

                          {opp.recommendedByColleges && opp.recommendedByColleges.length > 0 ? (
                            <span className="text-[10.5px] font-mono px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-extrabold flex items-center gap-1 shadow-xs animate-pulse">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>Recommended by {opp.recommendedByColleges[0]}</span>
                            </span>
                          ) : (opp.recommendedToFacultyBy?.length || 0) > 0 ? (
                            <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>College Endorsed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Apply by {opp.deadline || "Soon"}</span>
                            </span>
                          )}
                        </div>

                        {/* Organization & Title */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{opp.organization}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                            {opp.title}
                          </h3>
                        </div>

                        {/* Location & Mode Info */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md border border-border">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span>{opp.location}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md border border-border">
                            <Briefcase className="w-3 h-3 text-primary" />
                            <span>{opp.mode}</span>
                          </div>
                          {opp.duration && (
                            <div className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md border border-border">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{opp.duration}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                          {opp.description}
                        </p>

                        {/* Skill Match Telemetry Box */}
                        <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-foreground flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>Expertise Match Score:</span>
                            </span>
                            <span
                              className={cn(
                                "font-mono font-bold px-2 py-0.5 rounded-md text-[10.5px]",
                                matchScore >= 70
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : matchScore >= 40
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-secondary text-muted-foreground border border-border"
                              )}
                            >
                              {matchScore}% ({matchedSkills.length}/{totalRequired} Matched)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                matchScore >= 70
                                  ? "bg-emerald-500"
                                  : matchScore >= 40
                                  ? "bg-amber-500"
                                  : "bg-muted-foreground/40"
                              )}
                              style={{ width: `${Math.max(6, matchScore)}%` }}
                            />
                          </div>
                        </div>

                        {/* Required Skill Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {opp.requiredSkills.map((sk, sIdx) => (
                            <SkillBadge
                              key={sIdx}
                              skill={sk}
                              size="xs"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Card Bottom CTA Strip */}
                      <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2 relative z-10">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                            Grant / Fellowship / Honors
                          </span>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{opp.stipendOrPrize}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setApplyingOpportunity(opp)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer group/btn"
                        >
                          <span>
                            {opp.category === "research"
                              ? "Submit Proposal"
                              : opp.category === "conference"
                              ? "Submit Paper"
                              : opp.category === "fdp"
                              ? "Apply for FDP"
                              : opp.category === "workshop"
                              ? "Register Workshop"
                              : "Apply Now"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
      </main>

      {/* 5. Interactive Assessment Confirmation & Timed Test Runner Modals */}
      <TestConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        userSkills={facultyCompetencies}
        initialTargetSkill={targetTestSkill}
        onConfirmStart={handleGenerateTestFromConfirmation}
        isGenerating={isGeneratingTest}
      />

      {activeQuiz && (
        <SkillTestRunnerModal
          assessment={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onSuccessResult={async () => {
            await fetchProfile();
            await fetchTestResults();
          }}
          apiBaseUrl={API_BASE}
        />
      )}

      {/* 6. One-Click Proposal / Application Modal */}
      {applyingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {applyingOpportunity.category === "research"
                    ? "Submit Research Proposal"
                    : applyingOpportunity.category === "conference"
                    ? "Submit Conference Paper"
                    : applyingOpportunity.category === "fdp"
                    ? "FDP Application"
                    : "Apply for Immersion / Sabbatical"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{applyingOpportunity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingOpportunity(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-md bg-background border border-border text-xs space-y-1">
                <p className="text-muted-foreground">
                  Host Organization: <span className="font-semibold text-foreground">{applyingOpportunity.organization}</span>
                </p>
                <p className="text-muted-foreground">
                  Grant / Honorarium: <span className="font-semibold text-foreground font-mono">{applyingOpportunity.stipendOrPrize}</span>
                </p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span>Prerequisites:</span>
                  {applyingOpportunity.requiredSkills.map((sk, idx) => (
                    <SkillBadge key={idx} skill={sk} size="xs" />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Academic Objectives / Research Outline (Optional)
                </label>
                <textarea
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="Outline your research goals, course modernization intent, or institutional sponsorship details…"
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
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSubmittingApp}
                  className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm & Submit
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
                  <span>AI Academic Immersion Advisor</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-normal">v2.0 Verified</span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">Faculty Sabbaticals & Research Grants</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {aiChatHistory.length === 0 && (
              <div className="p-3.5 bg-secondary/40 border border-border rounded-md space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Academic Sabbaticals & Grant Prompts</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  I analyze your verified expertise, research publications, and institutional objectives to guide your sabbaticals and CAS advancements:
                </p>
                <div className="pt-1 flex flex-col gap-1.5">
                  {FACULTY_CONCERN_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendChipMessage(chip)}
                      disabled={isAiLoading}
                      className="text-[11px] text-left px-2.5 py-1.5 rounded bg-card hover:bg-secondary text-foreground border border-border transition-colors flex items-center justify-between group disabled:opacity-50 cursor-pointer"
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
                <span>Consulting national research telemetry and corporate partnerships…</span>
              </div>
            )}
          </div>

          {aiChatHistory.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex gap-1.5 overflow-x-auto text-[10px]">
              {FACULTY_CONCERN_CHIPS.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChipMessage(chip)}
                  disabled={isAiLoading}
                  className="whitespace-nowrap px-2 py-0.5 rounded bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
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
              placeholder="Ask about DRDO sabbaticals, research grants, FDPs…"
              className="flex-1 text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiQuery.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
