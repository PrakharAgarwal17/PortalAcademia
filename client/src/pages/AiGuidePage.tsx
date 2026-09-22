import { useState, useEffect, useRef } from "react";
import { Bot, Send, Loader2, ArrowLeft, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface UserProfile {
  _id?: string;
  name?: string;
  category?: string;
  accountType?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CONCERN_CHIPS = [
  "Analyze my skill gap from my Personalized Diagnosis",
  "Why is my match score low & how do I improve it?",
  "What high-demand skills am I missing for cloud & AI roles?",
  "I failed an assessment test — what are my retake options?",
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

    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={idx} className="text-xs text-foreground/90 flex items-start gap-1.5">
          <span className="text-primary font-bold">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </li>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-foreground mt-2 mb-1 border-b border-border/50 pb-1">
          {trimmed.slice(4)}
        </h4>
      );
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

export default function AiGuidePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your PortalAcademia Contextual AI Career Guide. Ask me about your skill gaps, assessment preparation, interview strategy, or market trends!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    scrollToBottom("smooth");
    const frameId = requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });
    return () => cancelAnimationFrame(frameId);
  }, [chatHistory, isLoading]);

  const [searchParams] = useSearchParams();
  const initialQueryTriggered = useRef(false);

  /**
   * @description Fetch student profile for AI Guide context
   * @returns {Promise<{ success: boolean; profile?: UserProfile }>} Output profile response
   * @throws {Error} HTTP status handling
   */
  useEffect(() => {
    fetch(`${API_BASE}/api/profile/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) setProfile(data.profile);
      })
      .catch((err) => console.error(err));
  }, []);

  /**
   * @description Send query to AI career counselor endpoint
   * @param {string} userText - User text query
   * @returns {Promise<void>} Updates chat history state
   * @throws {Error} HTTP status handling
   */
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;
    const textToSend = userText.trim();
    setQuery("");
    setChatHistory((prev) => [...prev, { role: "user", content: textToSend }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: textToSend,
          history: chatHistory,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.response) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.data.response }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue analyzing your request. Please try again." },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI Career Guide." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("prompt");
    if (q && !initialQueryTriggered.current) {
      initialQueryTriggered.current = true;
      handleSendMessage(q);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar userName={profile?.name} profileId={profile?._id} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 lg:p-6 flex flex-col space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/student"
              className="p-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold mb-0.5">
                <Bot className="w-3.5 h-3.5" />
                Contextual AI Career Guide
              </div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                AI HelpBOT Workspace
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/trends/diagnosis"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Skill Diagnosis</span>
            </Link>
            <Link
              to="/trends/student"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Market Trends</span>
            </Link>
          </div>
        </div>

        {/* Code Restriction Alert Notice */}
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Policy Notice:</strong> The AI HelpBOT provides strategic career guidance & skill advice. It <strong>does not generate code scripts</strong>. Use <em>Test Your Skills</em> assessments to evaluate coding.
            </span>
          </div>
        </div>

        {/* Chat Messages Box */}
        <div
          ref={chatContainerRef}
          className="flex-1 bg-card border border-border rounded-lg p-4 overflow-y-auto space-y-4 min-h-[450px] max-h-[600px] shadow-xs scroll-smooth"
        >
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3.5 rounded-lg text-xs leading-relaxed max-w-3xl",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-background border border-border text-foreground space-y-1"
              )}
            >
              {msg.role === "user" ? msg.content : formatAiMessage(msg.content)}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-background border border-border rounded-md max-w-md">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Analyzing telemetry & generating career recommendations…</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>

        {/* Starter Concern Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">Quick Prompts:</span>
          {CONCERN_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(query);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about skill gap analysis, interview preparation, or placement strategies…"
            className="flex-1 text-xs px-4 py-3 rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="text-xs font-bold px-5 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </main>
    </div>
  );
}
