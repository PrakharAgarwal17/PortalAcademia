import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Bot,
  Send,
  X,
  Loader2,
  Sun,
  Moon,
  LogOut,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface FacultyProfile {
  _id?: string;
  name: string;
  accountType: string;
  designation?: string;
  department?: string;
  institution?: string;
  institutionEmail?: string;
  isEmailVerified?: boolean;
  expertise?: string[];
  researchInterests?: string[];
  bio?: string;
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
  applicantCount: number;
}

const FACULTY_CONCERN_CHIPS = [
  "How are IP rights handled during industry sabbaticals?",
  "Which corporate immersion projects grant MHRD CAS credits?",
  "How do I align my course syllabus with industry deficits?",
  "How can I initiate a corporate research collaboration?",
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"sabbatical" | "fdp" | "research" | "all">("all");

  // Application / Proposal Modal State
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [proposalNotes, setProposalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // AI Assistant Drawer
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Welcome Professor! I am your AI Academic Immersion Advisor. How can I assist you with industrial sabbaticals, FDPs, or research collaboration?",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  /**
   * @description Fetch faculty live profile data
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
      console.error("Failed to fetch faculty profile:", err);
    }
  }, []);

  /**
   * @description Fetch live opportunities (sabbaticals, FDPs, research)
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

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchOpportunities()]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchOpportunities]);

  /**
   * @description Submit sabbatical / FDP application
   */
  const handleApply = async () => {
    if (!applyingOpportunity) return;
    setIsSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          opportunityId: applyingOpportunity._id,
          notes: proposalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissionFeedback("Application submitted successfully to host institution/corporate lab!");
        setTimeout(() => {
          setApplyingOpportunity(null);
          setProposalNotes("");
          setSubmissionFeedback(null);
        }, 1500);
      } else {
        setSubmissionFeedback(data.message || "Failed to submit proposal.");
      }
    } catch (err: any) {
      setSubmissionFeedback(err.message || "Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @description Send chat query to contextual AI
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
          { role: "assistant", content: "Apologies, I encountered an issue analyzing academic telemetry." },
        ]);
      }
    } catch (err) {
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
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI advisor." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter opportunities relevant to faculty
  const facultyOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (selectedTab === "all") {
        return ["sabbatical", "fdp", "research", "workshop"].includes(opp.category);
      }
      return opp.category === selectedTab;
    });
  }, [opportunities, selectedTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading faculty academic immersion telemetry…
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
            Pillar 2: Faculty Immersion Console
          </span>
        </div>



        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border"
          >
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span>AI Immersion Guide</span>
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
        {/* 2. Faculty Profile & Credentials Strip */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "DR"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground tracking-tight">
                    {profile?.name || "Faculty Scholar"}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Faculty Fellow
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile?.designation || "Faculty Member"} • {profile?.department || "Department Not Specified"} • {profile?.institution || "Institution Pending"}
                </p>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Active Sabbaticals</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {opportunities.filter((o) => o.category === "sabbatical").length}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Verified FDPs</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {opportunities.filter((o) => o.category === "fdp").length}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Joint Research Grants</span>
                <span className="font-bold text-primary tabular-nums text-sm">
                  {opportunities.filter((o) => o.category === "research").length > 0
                    ? `₹${(opportunities.filter((o) => o.category === "research").length * 15).toFixed(1)} L`
                    : "₹0.0 L"}
                </span>
              </div>
            </div>
          </div>

          {/* Research Domains & Expertise Strip */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground mr-1">Expertise:</span>
              {profile?.expertise && profile.expertise.length > 0 ? (
                profile.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border font-mono"
                  >
                    {exp}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground italic font-mono">No expertise tags added</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground mr-1">Research Focus:</span>
              {profile?.researchInterests && profile.researchInterests.length > 0 ? (
                profile.researchInterests.map((res, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-mono"
                  >
                    {res}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground italic font-mono">General Research</span>
              )}
            </div>
          </div>
        </section>

        {/* 3. Three-Tab Immersion Hub: Sabbaticals, FDPs, Joint Research */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-primary" />
                Faculty Industrial Immersion & Collaboration Desk
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                SIH 26044 Mandate: Bridging academia-industry barriers through paid sabbaticals, certified FDPs, and co-developed research grants.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "all", label: "All Engagements" },
                { id: "sabbatical", label: "Corporate Sabbaticals" },
                { id: "fdp", label: "Faculty Programs (FDPs)" },
                { id: "research", label: "Joint Research Grants" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                    selectedTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {facultyOpportunities.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-border rounded-md">
                <p className="text-xs text-muted-foreground">No faculty opportunities matching this category.</p>
              </div>
            ) : (
              facultyOpportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-background border border-border rounded-md p-4 flex flex-col justify-between hover:border-primary/50 transition-colors space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase font-bold border border-border">
                        {opp.category}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {opp.duration}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-foreground tracking-tight leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Host: {opp.organization} • <span className="font-mono">{opp.location} ({opp.mode})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-3">
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
                      <span className="text-[10px] text-muted-foreground block font-mono">Fellowship / Grant</span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {opp.stipendOrPrize}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyingOpportunity(opp)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {opp.category === "research" ? "Submit Proposal" : "Apply Fellowship"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 4. Classroom Modernization & Live Industry Case Studies Desk */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Classroom Modernization & Industrial Case Studies
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download verified enterprise telemetry and case studies to incorporate into ongoing university lecture series.
              </p>
            </div>
          </div>

          {opportunities.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
              No classroom case studies or enterprise datasets published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {opportunities.slice(0, 3).map((opp) => (
                <div key={opp._id} className="p-3 rounded-md bg-background border border-border space-y-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-bold uppercase">
                    {opp.organization} • {opp.category}
                  </span>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">
                    {opp.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {opp.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 5. Faculty Application / Proposal Modal */}
      {applyingOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {applyingOpportunity.category === "research" ? "Submit Research Proposal" : "Apply for Sabbatical / Fellowship"}
                </h3>
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
                  Host Organization: <span className="font-semibold text-foreground">{applyingOpportunity.organization}</span>
                </p>
                <p className="text-muted-foreground">
                  Compensation / Grant: <span className="font-semibold text-foreground font-mono">{applyingOpportunity.stipendOrPrize}</span>
                </p>
                <p className="text-muted-foreground">
                  Prerequisites: <span className="font-mono text-foreground">{applyingOpportunity.requiredSkills.join(", ")}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Research Outline & Department Sabbatical Plan
                </label>
                <textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="Outline your research methodology, expected academic outcomes, and student co-researcher involvement…"
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {submissionFeedback && (
                <p className="text-xs font-medium text-primary text-center font-mono">
                  {submissionFeedback}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingOpportunity(null)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Contextual AI HelpBOT Drawer */}
      {isAiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>AI Academic Immersion Guide</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-normal">SIH 26044</span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">Faculty Sabbaticals & Research Telemetry</p>
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
            {aiChatHistory.length <= 1 && (
              <div className="p-3.5 bg-secondary/40 border border-border rounded-md space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Academic Advisory Prompts</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Explore policies on corporate sabbaticals, AICTE/MHRD CAS credit alignment, and IP frameworks:
                </p>
                <div className="pt-1 flex flex-col gap-1.5">
                  {FACULTY_CONCERN_CHIPS.map((chip, idx) => (
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
                <span>Consulting research telemetry and corporate partnerships…</span>
              </div>
            )}
          </div>

          {aiChatHistory.length > 1 && (
            <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex gap-1.5 overflow-x-auto text-[10px]">
              {FACULTY_CONCERN_CHIPS.slice(0, 3).map((chip, idx) => (
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
              placeholder="Ask about DRDO sabbaticals, Ayush grants, FDPs…"
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
