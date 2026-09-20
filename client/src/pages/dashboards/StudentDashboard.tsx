import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
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
  ShieldAlert,
  Zap,
  FileText,
  Check,
  TrendingUp,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";
import { searchSkillSuggestions, getSkillIcon } from "@/lib/skillIcons";
import TestConfirmationModal from "@/components/TestConfirmationModal";
import SkillTestRunnerModal from "@/components/SkillTestRunnerModal";
import ResumeBuilderModal, { type ResumeData } from "@/components/ResumeBuilderModal";
import Navbar from "@/components/Navbar";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface UserProfile {
  _id?: string;
  name: string;
  headline?: string;
  profileImage?: string;
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

const STUDENT_CONCERN_CHIPS = [
  "Why is my match score low & how do I improve it?",
  "I failed an assessment test — what are my options?",
  "How do I balance semester exams with internships?",
  "My college hasn't verified my skills yet",
  "What skills am I missing for top postings?",
];

const RECOMMENDED_SKILLS: Array<{ name: string; slug: string }> = [
  { name: "Python", slug: "python" },
  { name: "Java", slug: "openjdk" },
  { name: "C++", slug: "cplusplus" },
  { name: "C", slug: "c" },
  { name: "JavaScript", slug: "javascript" },
  { name: "TypeScript", slug: "typescript" },
  { name: "React", slug: "react" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "Docker", slug: "docker" },
  { name: "SQL", slug: "mysql" },
  { name: "Go", slug: "go" },
  { name: "Rust", slug: "rust" },
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
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [testedSkills, setTestedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived verified skills count matching passed assessments
  const verifiedSkillsCount = useMemo(() => {
    return (profile?.skills || []).filter((skill) =>
      testedSkills.some((ts) => ts.toLowerCase() === skill.toLowerCase())
    ).length;
  }, [profile?.skills, testedSkills]);

  // Grounded career readiness score weighted by verified skills
  const readinessScore = useMemo(() => {
    const totalSkills = profile?.skills?.length || 0;
    if (totalSkills === 0) return 0;
    const verifiedRatio = (verifiedSkillsCount / totalSkills) * 60;
    const profileRatio = Math.min(20, totalSkills * 4);
    const appRatio = Math.min(20, applications.length * 10);
    return Math.min(100, Math.round(verifiedRatio + profileRatio + appRatio));
  }, [profile?.skills, verifiedSkillsCount, applications.length]);

  // Track applied opportunity IDs to mark buttons as "Applied"
  const appliedOpportunityIds = useMemo(() => {
    const ids = new Set<string>();
    applications.forEach((app) => {
      if (!app.opportunityId) return;
      if (typeof app.opportunityId === "object" && app.opportunityId._id) {
        ids.add(String(app.opportunityId._id));
      } else if (typeof app.opportunityId === "string") {
        ids.add(app.opportunityId);
      }
    });
    return ids;
  }, [applications]);

  // Normalized user institution name
  const myInstitution = useMemo(() => {
    return (profile?.institution || profile?.institutionName || "").trim();
  }, [profile?.institution, profile?.institutionName]);

  // Check if an opportunity was endorsed by the student's own institution
  const isOpportunityEndorsedByMyInstitution = useCallback(
    (opp: Opportunity) => {
      if (!myInstitution) return false;
      const myNorm = myInstitution.toLowerCase();
      const colleges = opp.recommendedByColleges || [];
      return colleges.some((col) => {
        const cNorm = col.trim().toLowerCase();
        return cNorm === myNorm || cNorm.includes(myNorm) || myNorm.includes(cNorm);
      });
    },
    [myInstitution]
  );

  // Get matching institution endorsement name for display
  const getMyInstitutionEndorsementName = useCallback(
    (opp: Opportunity) => {
      if (!myInstitution) return null;
      const myNorm = myInstitution.toLowerCase();
      const colleges = opp.recommendedByColleges || [];
      const found = colleges.find((col) => {
        const cNorm = col.trim().toLowerCase();
        return cNorm === myNorm || cNorm.includes(myNorm) || myNorm.includes(cNorm);
      });
      return found || myInstitution;
    },
    [myInstitution]
  );

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const skillContainerRef = useRef<HTMLDivElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  // Suggestions filtered by query
  const skillSuggestions = useMemo(() => {
    return searchSkillSuggestions(newSkillInput.trim(), 8);
  }, [newSkillInput]);

  // Click outside to close skill suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (skillContainerRef.current && !skillContainerRef.current.contains(event.target as Node)) {
        setIsSkillDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for skill input
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isSkillDropdownOpen) {
        setIsSkillDropdownOpen(true);
        return;
      }
      const max = skillSuggestions.length;
      if (max > 0) {
        setSelectedSuggestionIndex((prev) => (prev < max - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const max = skillSuggestions.length;
      if (max > 0) {
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : max - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        isSkillDropdownOpen &&
        newSkillInput.trim() &&
        skillSuggestions.length > 0 &&
        selectedSuggestionIndex >= 0 &&
        selectedSuggestionIndex < skillSuggestions.length
      ) {
        handleSelectSkill(skillSuggestions[selectedSuggestionIndex].title);
      } else if (newSkillInput.trim()) {
        handleSelectSkill(newSkillInput.trim());
      }
    } else if (e.key === "Escape") {
      setIsSkillDropdownOpen(false);
    }
  };

  const handleSelectSkill = (skillTitle: string) => {
    const trimmed = skillTitle.trim();
    if (!trimmed) return;
    handleAddSkill(undefined, trimmed);
    setNewSkillInput("");
    setIsSkillDropdownOpen(false);
    setSelectedSuggestionIndex(0);
  };

  // Quiz Modal State
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [targetTestSkill, setTargetTestSkill] = useState<string | undefined>(undefined);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);

  const openTestConfirmation = (skillName?: string) => {
    setTargetTestSkill(skillName);
    setIsConfirmationOpen(true);
  };

  // Apply Modal & Resume Builder State
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [applyNotes, setApplyNotes] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appFeedback, setAppFeedback] = useState<string | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [attachedResume, setAttachedResume] = useState<ResumeData | null>(null);
  const [attachedResumeScore, setAttachedResumeScore] = useState<number | undefined>(undefined);

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
      const res = await fetch(`${API_BASE}/api/opportunities?targetAudience=student`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Strict deduplication of incoming opportunities by ID and Title
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
   * @description Fetch student submitted applications
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
        data.data.forEach((r: any) => {
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
    Promise.all([fetchProfile(), fetchOpportunities(), fetchApplications(), fetchTestResults()])
      .catch((err) => console.error("Initial load error:", err))
      .finally(() => setIsLoading(false));
  }, [fetchProfile, fetchOpportunities, fetchApplications, fetchTestResults]);

  /**
   * @description Add a skill tag and sync to profile
   */
  const handleAddSkill = async (e?: React.FormEvent, customSkill?: string) => {
    if (e) e.preventDefault();
    const skillName = (customSkill || newSkillInput).trim();
    if (!skillName || !profile) return;
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
        setIsSkillDropdownOpen(false);
        setSelectedSuggestionIndex(0);
      }
    } catch (err) {
      console.error("Failed to update skills:", err);
    } finally {
      setIsUpdatingSkill(false);
    }
  };

  /**
   * @description Remove a skill tag and sync to profile
   */
  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const updatedSkills = (profile.skills || []).filter((s) => s !== skillToRemove);
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
      }
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  /**
   * @description Generate customized 10-question assessment based on selected target skill/language
   */
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
      console.error("Failed to generate custom test:", err);
      alert("Network error generating assessment.");
    } finally {
      setIsGeneratingTest(false);
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
          resumeData: attachedResume || undefined,
          customAtsScore: attachedResumeScore,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppFeedback("Application submitted successfully!");
        await fetchApplications();
        setTimeout(() => {
          setApplyingOpportunity(null);
          setApplyNotes("");
          setAttachedResume(null);
          setAttachedResumeScore(undefined);
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

  /**
   * @description Calculate skill match score (%) between candidate profile skills and opportunity required skills
   */
  const computeSkillMatch = useCallback((requiredSkills: string[] = []) => {
    const userSkills = profile?.skills || [];
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
  }, [profile?.skills]);

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
        opp.targetAudience === "student" ||
        opp.targetAudience === "both" ||
        (!opp.targetAudience && opp.category !== "fdp" && opp.category !== "sabbatical");

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "skill_matched" ||
        opp.category === selectedCategory ||
        (selectedCategory === "recommended" && isOpportunityEndorsedByMyInstitution(opp));

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
  }, [opportunities, selectedCategory, searchQuery, computeSkillMatch, isOpportunityEndorsedByMyInstitution]);

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
      {/* 1. Global Stakeholder Navigation Bar */}
      <Navbar userName={profile?.name} profileId={profile?._id} />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Profile & Verified Portfolio Strip */}
        <section className="relative bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm z-20">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
          </div>
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
                    {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "ST"}
                  </span>
                )}
                <span className={cn(
                  "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-card",
                  Boolean(profile?.isEmailVerified && profile?.institutionEmail) ? "bg-emerald-500" : "bg-amber-500"
                )} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 
                    onClick={() => navigate(`/profile/${profile?._id || "me"}`)}
                    className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
                    title="View Full Profile"
                  >
                    {profile?.name || "Student Scholar"}
                  </h1>
                  {Boolean(profile?.isEmailVerified && profile?.institutionEmail) ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 text-[11px] font-bold" title="Verified Scholar">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Verified Scholar
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1 text-[11px] font-medium" title="Institutional Email Not Verified">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      Unverified Scholar
                    </span>
                  )}
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
                  {profile?.headline || `${profile?.institution || profile?.institutionName || "Affiliated Institution Pending"} • ${profile?.institutionEmail ? (profile?.isEmailVerified ? profile.institutionEmail : `${profile.institutionEmail} (Unverified)`) : "Email not verified"}`}
                </p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Verified Skills</span>
                <span className="font-bold text-foreground tabular-nums text-base flex items-baseline gap-1">
                  <span className={verifiedSkillsCount > 0 ? "text-emerald-500 font-bold" : "text-foreground"}>
                    {verifiedSkillsCount}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground font-sans">
                    / {profile?.skills?.length || 0}
                  </span>
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Applications</span>
                <span className="font-bold text-foreground tabular-nums text-base">
                  {applications.length}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                <span className="text-primary block text-[10px] uppercase tracking-wider font-bold">Readiness Score</span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {readinessScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Skill Badges & Live Insertion Form with Simple Icons */}
          <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-xs font-semibold text-foreground mr-1">Skills:</span>
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => {
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
                <span className="text-xs text-muted-foreground italic">No skills listed yet</span>
              )}
              
              {/* Prominent Add Skill button in skills row */}
              <button
                type="button"
                onClick={() => {
                  setIsSkillDropdownOpen(true);
                  setTimeout(() => skillInputRef.current?.focus(), 50);
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-1"
                title="Add a new skill or programming language"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>

              <button
                type="button"
                onClick={() => openTestConfirmation()}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                title="Attempt Skill Test for your profile skills"
              >
                <Sparkles className="w-3 h-3" />
                <span>Attempt Test</span>
              </button>
            </div>

            {/* Live Autocomplete / Recommended Skill Input Form */}
            <div ref={skillContainerRef} className="relative">
              <form onSubmit={handleAddSkill} className="flex items-center gap-1.5">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => {
                      setNewSkillInput(e.target.value);
                      setIsSkillDropdownOpen(true);
                      setSelectedSuggestionIndex(0);
                    }}
                    onFocus={() => {
                      setIsSkillDropdownOpen(true);
                    }}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type language or skill (e.g. Python, Java, C++)…"
                    disabled={isUpdatingSkill}
                    className="text-xs pl-8 pr-7 py-1.5 rounded-md bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-colors"
                  />
                  {newSkillInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewSkillInput("");
                        setSelectedSuggestionIndex(0);
                        skillInputRef.current?.focus();
                      }}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingSkill || !newSkillInput.trim()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isUpdatingSkill ? "Adding…" : "Add"}</span>
                </button>
              </form>

              {/* Autocomplete / Recommended Options Dropdown */}
              {isSkillDropdownOpen && (
                <div className="absolute z-50 right-0 mt-1 w-72 sm:w-80 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1.5 shadow-2xl text-popover-foreground">
                  {/* If input is empty, show Recommended Options / Popular Languages */}
                  {!newSkillInput.trim() ? (
                    <div className="space-y-2 p-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Sparkles className="w-3 h-3 text-primary" /> Recommended Options
                        </span>
                        <span>Quick Add</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground px-1 leading-snug">
                        Click any recommended language or tool to add it to your profile:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {RECOMMENDED_SKILLS.map((item) => {
                          const alreadyAdded = (profile?.skills || []).some(
                            (s) => s.toLowerCase() === item.name.toLowerCase()
                          );
                          const icon = getSkillIcon(item.slug || item.name);
                          return (
                            <button
                              key={item.name}
                              type="button"
                              disabled={alreadyAdded || isUpdatingSkill}
                              onClick={() => handleSelectSkill(item.name)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs border transition-all text-left cursor-pointer",
                                alreadyAdded
                                  ? "border-border/60 bg-muted/40 text-muted-foreground/60 cursor-not-allowed"
                                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground shadow-2xs hover:border-primary/50"
                              )}
                            >
                              {icon ? (
                                <svg
                                  role="img"
                                  viewBox="0 0 24 24"
                                  className="w-3 h-3 shrink-0"
                                  style={{ fill: `#${icon.hex}` }}
                                  aria-hidden="true"
                                >
                                  <path d={icon.path} />
                                </svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                              <span className="font-medium text-[11px]">{item.name}</span>
                              {alreadyAdded ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500 ml-0.5" />
                              ) : (
                                <span className="text-[10px] text-muted-foreground">+</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* When typing, show matched languages & tools */
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <span>Matching Languages & Skills</span>
                        <span>{skillSuggestions.length} found</span>
                      </div>

                      {skillSuggestions.length > 0 ? (
                        skillSuggestions.map((item, idx) => {
                          const isSelected = idx === selectedSuggestionIndex;
                          const alreadyAdded = (profile?.skills || []).some(
                            (s) => s.toLowerCase() === item.title.toLowerCase()
                          );

                          return (
                            <button
                              key={item.slug}
                              type="button"
                              disabled={alreadyAdded || isUpdatingSkill}
                              onClick={() => handleSelectSkill(item.title)}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs transition-colors text-left cursor-pointer",
                                isSelected ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/70",
                                alreadyAdded && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <svg
                                  role="img"
                                  viewBox="0 0 24 24"
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ fill: `#${item.hex}` }}
                                  aria-hidden="true"
                                >
                                  <path d={item.path} />
                                </svg>
                                <span className="font-medium text-foreground truncate">{item.title}</span>
                              </div>
                              {alreadyAdded ? (
                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                                  <Check className="w-3 h-3 text-emerald-500" /> Added
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-primary font-semibold shrink-0">
                                  + Add
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          No direct brand icon match for &quot;{newSkillInput}&quot;
                        </div>
                      )}

                      {/* Fallback to add custom query if exact match not already added */}
                      {newSkillInput.trim() && (
                        <button
                          type="button"
                          disabled={isUpdatingSkill}
                          onClick={() => handleSelectSkill(newSkillInput.trim())}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-xs text-primary hover:bg-primary/10 transition-colors border-t border-border/50 mt-1 cursor-pointer font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add custom skill &quot;{newSkillInput.trim()}&quot;</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Live Marketplace Feed (Internships, Hackathons, Workshops) */}
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

            {/* Search Input & Trends Action */}
            <div className="flex items-center gap-2 w-full md:w-auto">
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
              <button
                type="button"
                onClick={() => navigate("/trends/student")}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                title="View Student Market Trends & Hiring Demand"
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Hiring Trends</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
            {[
              { id: "all", label: "All Postings" },
              { id: "skill_matched", label: "⚡ Top Skill Match" },
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
                const isMyEndorsed = isOpportunityEndorsedByMyInstitution(opp);
                const matchingEndorsementName = getMyInstitutionEndorsementName(opp);
                const isApplied = appliedOpportunityIds.has(String(opp._id));

                return (
                  <div
                    key={opp._id}
                    className={cn(
                      "group relative bg-card border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden space-y-4",
                      isMyEndorsed
                        ? "border-amber-500/40 shadow-xs ring-1 ring-amber-500/20"
                        : "border-border/80 hover:border-primary/50"
                    )}
                  >
                    {/* Glowing background accent on hover */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      {/* Top Pill Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-2xs",
                            opp.category === "internship"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : opp.category === "hackathon"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : opp.category === "workshop"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          {opp.category}
                        </span>

                        {isMyEndorsed && matchingEndorsementName ? (
                          <span className="text-[10.5px] font-mono px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-extrabold flex items-center gap-1 shadow-xs animate-pulse">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Recommended by {matchingEndorsementName}</span>
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
                            <span>Skill Match Score:</span>
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
                        Stipend / Award
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{opp.stipendOrPrize}</span>
                      </div>
                    </div>

                    {isApplied ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-not-allowed opacity-95 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Applied</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setApplyingOpportunity(opp)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer group/btn"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    )}
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
        userSkills={profile?.skills || []}
        initialTargetSkill={targetTestSkill}
        onConfirmStart={handleGenerateTestFromConfirmation}
        isGenerating={isGeneratingTest}
      />


      {activeQuiz && (
        <SkillTestRunnerModal
          assessment={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onSuccessResult={async () => {
            await fetchProfile(); // Refresh profile & verified skills
          }}
          apiBaseUrl={API_BASE}
        />
      )}

      {/* 6. One-Click Application Modal */}
      {applyingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between pb-3.5 border-b border-border">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 inline-block mb-1">
                  Application Gateway
                </span>
                <h3 className="text-base font-bold text-foreground tracking-tight">Submit Application</h3>
                <p className="text-xs text-muted-foreground">{applyingOpportunity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingOpportunity(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Opportunity Snapshot */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-bold text-foreground">{applyingOpportunity.organization}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-muted-foreground">Stipend / Prize:</span>
                  <span className="font-bold text-foreground">{applyingOpportunity.stipendOrPrize}</span>
                </div>
                <div className="pt-1 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground block mb-1">Required Skills:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {applyingOpportunity.requiredSkills.map((sk, idx) => (
                      <SkillBadge key={idx} skill={sk} size="xs" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Build Custom ATS Resume Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                attachedResume
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-primary/5 border-primary/20"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${attachedResume ? "text-emerald-500" : "text-primary"}`} />
                      <span className="text-xs font-bold text-foreground">
                        {attachedResume ? "Tailored ATS Resume Attached" : "Build / Tailor ATS Resume"}
                      </span>
                      {attachedResume && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          ATS Score: {attachedResumeScore || 85}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {attachedResume
                        ? "Resume customized with your profile data, education, and credentials ready for submission."
                        : "This data is directly fetched from your profile — tailor fields and skills specifically for this opportunity."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResumeModalOpen(true)}
                    className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    {attachedResume ? "Edit Resume" : "Build a Resume"}
                  </button>
                </div>
              </div>

              {/* Cover Note Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Candidate Note to Recruiter (Optional)
                </label>
                <textarea
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="Summarize your motivation, key contributions, or project repositories relevant to this role…"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed shadow-xs"
                />
              </div>

              {appFeedback && (
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary text-center font-mono">
                  {appFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApplyingOpportunity(null)}
                  disabled={isSubmittingApp}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSubmittingApp}
                  className="text-xs font-bold px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmittingApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm &amp; Submit</span>
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-normal">v2.0 Verified</span>
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

      {/* 7. ATS Resume Builder Modal */}
      <ResumeBuilderModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        profileData={profile || {}}
        opportunity={applyingOpportunity}
        onAttachResume={(resumeData, _pdfUrl, score) => {
          setAttachedResume(resumeData);
          setAttachedResumeScore(score);
        }}
      />
    </div>
  );
}
