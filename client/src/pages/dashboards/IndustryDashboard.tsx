import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  X,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Layers,
  Plus,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";
import { useTheme } from "@/context/theme";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

interface IndustryProfile {
  _id?: string;
  name: string;
  companyName?: string;
  industryType?: string;
  workEmail?: string;
  officialWebsite?: string;
  location?: string;
  employees?: string;
  accountType: string;
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
  status: string;
  applicantCount: number;
  createdAt: string;
}

interface CandidateApplication {
  _id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantInstitution: string;
  applicantSkills: string[];
  matchScore: number;
  status: string;
  appliedAt: string;
  notes?: string;
  reviewerNotes?: string;
}

export default function IndustryDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [publishedListings, setPublishedListings] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [applicants, setApplicants] = useState<CandidateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  // New Opportunity Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    category: "internship",
    domain: "",
    location: "",
    mode: "Hybrid",
    duration: "",
    stipendOrPrize: "",
    requiredSkills: "",
    eligibility: "",
    deadline: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  /**
   * @description Fetch industry recruiter profile
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
      console.error("Failed to fetch recruiter profile:", err);
    }
  }, []);

  /**
   * @description Fetch listings published by this recruiter
   */
  const fetchPublishedListings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/my-published`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const listings: Opportunity[] = data.data || [];
        setPublishedListings(listings);
        if (listings.length > 0 && !selectedOpportunity) {
          setSelectedOpportunity(listings[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch published listings:", err);
    }
  }, [selectedOpportunity]);

  /**
   * @description Fetch applicants for currently selected opportunity
   */
  const fetchApplicants = useCallback(async (oppId: string) => {
    setIsLoadingApplicants(true);
    try {
      const res = await fetch(`${API_BASE}/api/applications/opportunity/${oppId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
    } finally {
      setIsLoadingApplicants(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchPublishedListings()]).finally(() => setIsLoading(false));
  }, [fetchProfile, fetchPublishedListings]);

  useEffect(() => {
    if (selectedOpportunity) {
      fetchApplicants(selectedOpportunity._id);
    }
  }, [selectedOpportunity, fetchApplicants]);

  /**
   * @description Publish a new opportunity
   */
  const handlePublishOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setPublishFeedback(null);

    const skillsArray = publishForm.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...publishForm,
          requiredSkills: skillsArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishFeedback("Opportunity successfully published!");
        await fetchPublishedListings();
        setTimeout(() => {
          setIsPublishModalOpen(false);
          setPublishFeedback(null);
          setPublishForm({
            title: "",
            description: "",
            category: "internship",
            domain: "Software Engineering & Cloud Systems",
            location: "Bengaluru, KA",
            mode: "Hybrid",
            duration: "6 Months",
            stipendOrPrize: "₹45,000 / mo",
            requiredSkills: "React, Node.js, TypeScript",
            eligibility: "Pre-final and final year B.Tech / M.Tech students.",
            deadline: "2026-11-30",
          });
        }, 1200);
      } else {
        setPublishFeedback(data.message || "Failed to publish listing.");
      }
    } catch (err: any) {
      setPublishFeedback(err.message || "Network error occurred.");
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * @description Transition candidate stage progression in pipeline
   */
  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplicants((prev) =>
          prev.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Loading corporate talent pipeline & candidate telemetry…
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
            Pillar 4: Corporate Talent & Discovery Desk
          </span>
        </div>



        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Opportunity</span>
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
        {/* 2. Recruiter Identity Strip */}
        <section className="bg-card border border-border rounded-md p-4 lg:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground tracking-tight">
                    {profile?.companyName || profile?.name || "Corporate Partner"}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    Verified Industry Partner
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile?.industryType || "Enterprise Partner"} • {profile?.location || "Location pending"} • {profile?.workEmail || profile?.officialWebsite || "Email not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Active Listings</span>
                <span className="font-bold text-foreground tabular-nums text-sm">
                  {publishedListings.length}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Total Applicants</span>
                <span className="font-bold text-primary tabular-nums text-sm">
                  {publishedListings.reduce((sum, o) => sum + (o.applicantCount || 0), 0)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Shortlisted Candidates</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                  {applicants.filter((a) => a.status === "Shortlisted").length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Two-Column Workspace: Active Postings Manager + Shortlisting Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1 Col: Active Listings List */}
          <section className="bg-card border border-border rounded-md p-4 lg:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Published Postings
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                {publishedListings.length} Total
              </span>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {publishedListings.map((opp) => (
                <div
                  key={opp._id}
                  onClick={() => setSelectedOpportunity(opp)}
                  className={cn(
                    "p-3 rounded-md border cursor-pointer transition-colors space-y-1.5 text-xs",
                    selectedOpportunity?._id === opp._id
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border hover:bg-secondary/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-primary">
                      {opp.category}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {opp.applicantCount} Applicants
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground line-clamp-1">{opp.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {opp.stipendOrPrize} • {opp.mode}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Right 2 Cols: Algorithmic Candidate Shortlisting Pipeline */}
          <section className="lg:col-span-2 bg-card border border-border rounded-md p-4 lg:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Candidate Shortlisting Pipeline: {selectedOpportunity?.title || "Select Posting"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ranked by objective vector score (70% skill overlap + 30% verified assessment benchmarks).
                </p>
              </div>

              <span className="text-xs font-mono text-muted-foreground">
                {applicants.length} Candidates Evaluated
              </span>
            </div>

            {isLoadingApplicants ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Computing candidate vector match scores…</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-md">
                <p className="text-xs text-muted-foreground">No applications received for this listing yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                {applicants.map((cand) => (
                  <div key={cand._id} className="p-3.5 space-y-2 hover:bg-secondary/40 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground">{cand.applicantName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            {cand.matchScore}% Match Score
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {cand.applicantInstitution} • {cand.applicantEmail}
                        </p>
                      </div>

                      {/* Status Dropdown / Controls */}
                      <div className="flex items-center gap-2">
                        <select
                          value={cand.status}
                          onChange={(e) => handleUpdateStatus(cand._id, e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary font-mono"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Technical Interview">Technical Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Candidate Skills */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-muted-foreground mr-1">Skills:</span>
                      {cand.applicantSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {cand.notes && (
                      <p className="text-[11px] text-muted-foreground bg-secondary/60 p-2 rounded-md italic">
                        "{cand.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 4. Publish Opportunity Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Publish Marketplace Opportunity</h3>
                <p className="text-xs text-muted-foreground">Post internships, hackathons, workshops, or apprenticeships</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishOpportunity} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Position Title</label>
                <input
                  type="text"
                  required
                  value={publishForm.title}
                  onChange={(e) => setPublishForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Cloud & Distributed Systems Engineering Intern"
                  className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                  <select
                    value={publishForm.category}
                    onChange={(e) => setPublishForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="fdp">FDP</option>
                    <option value="research">Joint Research</option>
                    <option value="sabbatical">Sabbatical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Work Mode</label>
                  <select
                    value={publishForm.mode}
                    onChange={(e) => setPublishForm((p) => ({ ...p, mode: e.target.value }))}
                    className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Stipend / Prize Pool</label>
                  <input
                    type="text"
                    required
                    value={publishForm.stipendOrPrize}
                    onChange={(e) => setPublishForm((p) => ({ ...p, stipendOrPrize: e.target.value }))}
                    placeholder="e.g. ₹50,000 / mo"
                    className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={publishForm.duration}
                    onChange={(e) => setPublishForm((p) => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 6 Months"
                    className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Required Skill Vectors (Comma Separated)
                </label>
                <input
                  type="text"
                  required
                  value={publishForm.requiredSkills}
                  onChange={(e) => setPublishForm((p) => ({ ...p, requiredSkills: e.target.value }))}
                  placeholder="e.g. Python, Docker, React, FastAPI"
                  className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description & Scope</label>
                <textarea
                  required
                  rows={3}
                  value={publishForm.description}
                  onChange={(e) => setPublishForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe candidate responsibilities, project objectives, and mentorship details…"
                  className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none"
                />
              </div>

              {publishFeedback && (
                <p className="text-xs font-mono text-primary text-center">{publishFeedback}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={isPublishing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="text-xs font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                >
                  {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
