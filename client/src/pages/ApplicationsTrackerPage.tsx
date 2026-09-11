import { useState, useEffect } from "react";
import { Briefcase, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

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

export default function ApplicationsTrackerPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/profile/me`, { credentials: "include" }).then((res) => res.json()),
      fetch(`${API_BASE}/api/applications/my-applications`, { credentials: "include" }).then((res) => res.json()),
    ])
      .then(([profData, appData]) => {
        if (profData.success && profData.profile) setProfile(profData.profile);
        if (appData.success && Array.isArray(appData.data)) setApplications(appData.data);
      })
      .catch((err) => console.error(err));
  }, []);

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
                <Briefcase className="w-3.5 h-3.5" />
                Live Application Telemetry
              </div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Current Applications Pipeline
              </h1>
            </div>
          </div>

          <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-border">
            Total Submitted: <strong>{applications.length}</strong>
          </span>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/40 space-y-2">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">No applications submitted yet.</p>
            <Link
              to="/dashboard/student"
              className="inline-block text-xs font-bold text-primary hover:underline pt-1"
            >
              Browse live opportunities on Student Dashboard →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="p-4 rounded-lg bg-card border border-border space-y-3 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {app.opportunityId?.title || "Opportunity Posting"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {app.opportunityId?.organization || "Corporate Sponsor"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 uppercase",
                      app.status === "shortlisted" || app.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : app.status === "rejected"
                        ? "bg-red-500/10 text-red-600 border-red-500/30"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    )}
                  >
                    {app.status || "Submitted"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-background p-2.5 rounded-md border border-border font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Match Score:</span>
                    <span className="font-bold text-primary">{app.matchScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Compensation:</span>
                    <span className="font-bold text-foreground">{app.opportunityId?.stipendOrPrize || "N/A"}</span>
                  </div>
                </div>

                {app.reviewerNotes && (
                  <div className="p-2.5 rounded bg-secondary/50 border border-border text-[11px] space-y-0.5">
                    <span className="font-bold text-foreground block">Reviewer Feedback:</span>
                    <p className="text-muted-foreground italic">{app.reviewerNotes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  <span className="font-mono text-[10px]">{app.opportunityId?.mode || "Remote"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
