import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronRight, ChevronDown, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Students" | "Universities" | "Industry";
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "gen-1",
    category: "General",
    question: "What is PortalAcademia and what problem does it solve?",
    answer:
      "PortalAcademia is an integrated academia-industry collaboration platform. It directly bridges the gap between theoretical academic curricula and live industry expectations by providing verified skill assessments, automated competency gap discovery, curated industry learning paths, and direct employer placement matching.",
  },
  {
    id: "gen-2",
    category: "General",
    question: "Who can register on PortalAcademia?",
    answer:
      "The platform supports four primary stakeholder roles: Students (seeking verified skill credentials and job opportunities), Faculty (aligning curricula and monitoring cohorts), University Administrators (tracking institutional placement telemetry and accreditations), and Industry Recruiters (posting challenges, internships, and hiring verified talent).",
  },
  {
    id: "gen-3",
    category: "General",
    question: "How does identity verification work?",
    answer:
      "Users can sign in using their institutional email or Google Workspace SSO. University domain emails are automatically mapped to verified academic institutes, enabling verified badges and access to institutional analytics.",
  },
  {
    id: "stu-1",
    category: "Students",
    question: "How are skill assessments conducted and benchmarked?",
    answer:
      "Skill evaluations use objective coding challenges, technical assessments, and scenario-based tests calibrated to live industry job requisitions. Results are benchmarked against national cohorts, generating an unalterable Skill Index and digital badges.",
  },
  {
    id: "stu-2",
    category: "Students",
    question: "Can I use PortalAcademia to get internships and job placements?",
    answer:
      "Yes. Verified industry recruiters post live internships, hackathons, and entry-level positions. Candidates can apply with one click using their verified skill transcript, bypassing conventional resume screening filters.",
  },
  {
    id: "uni-1",
    category: "Universities",
    question: "How does PortalAcademia help universities improve curriculum alignment?",
    answer:
      "The platform aggregates anonymous cohort telemetry to highlight emerging technologies where student performance lags behind market requirements. Academic leaders receive actionable insights to update syllabi, organize targeted workshops, and enhance institutional placement percentages.",
  },
  {
    id: "uni-2",
    category: "Universities",
    question: "Is batch student onboarding supported for colleges?",
    answer:
      "Yes. University administrators can upload departmental student registries or integrate institutional single sign-on (SSO) to verify entire student cohorts at once.",
  },
  {
    id: "ind-1",
    category: "Industry",
    question: "How can corporate partners recruit through PortalAcademia?",
    answer:
      "Recruiters can create corporate profiles, define exact technical competencies needed for openings, and filter candidate pools using calibrated objective scores rather than self-reported resume keywords. They can also sponsor pre-skilling bootcamps and live hackathons.",
  },
  {
    id: "ind-2",
    category: "Industry",
    question: "Can companies collaborate on academic research projects?",
    answer:
      "Yes. PortalAcademia features an Academia-Industry R&D portal where corporate partners post real-world research problems, grant funding, and invite faculty-led student teams to build joint solutions.",
  },
];

export default function FAQPage() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = ["All", "General", "Students", "Universities", "Industry"];

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <title>Frequently Asked Questions — PortalAcademia</title>
      <meta
        name="description"
        content="Common questions and operational answers regarding PortalAcademia skill assessments, institutional verification, student placement, and industry partnerships."
      />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>

            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
              aria-label="PortalAcademia — Return to top"
            >
              <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-[10px] transition-colors">
                PA
              </div>
              <span className="font-semibold text-xs tracking-tight text-foreground hidden sm:inline">
                PortalAcademia FAQ
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="faq-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>

              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Sign In
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
          {/* Header */}
          <div className="border-b border-border pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>KNOWLEDGE BASE & SUPPORT • PORTALACADEMIA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Find detailed explanations regarding stakeholder onboarding, skill benchmarks, institutional verification, and direct employer discovery.
            </p>

            {/* Search and Category Filter */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions (e.g., verification, assessment, placements)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`h-9 px-3 text-xs font-medium rounded-sm border transition-colors ${
                      activeCategory === cat
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Accordion FAQ List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-md bg-muted/20">
              <p className="text-xs text-muted-foreground">
                No matching questions found for "{searchQuery}". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-2">
              {filteredItems.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-sm bg-card overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-xs sm:text-sm font-medium text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded-sm bg-muted">
                          {item.category}
                        </span>
                        <span className="font-medium text-foreground">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cross Links */}
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Have additional questions?</span>
              <Link to="/terms" className="text-foreground hover:underline font-medium">
                Terms and Conditions
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <Link to="/privacy" className="text-foreground hover:underline font-medium">
                Privacy Policy
              </Link>
            </div>
            <div className="text-muted-foreground font-mono">
              Support Desk: <span className="text-foreground">support@portalacademia.edu</span>
            </div>
          </div>
        </main>

        {/* Minimal Swiss Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-background mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>Knowledge Base Repository</span>
          </div>
        </footer>
      </div>
    </>
  );
}
