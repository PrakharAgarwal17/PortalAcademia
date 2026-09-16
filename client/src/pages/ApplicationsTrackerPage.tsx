import { useState, useEffect } from "react";
import { Briefcase, Clock, ArrowLeft, FileText, Sparkles, X, Printer, Download } from "lucide-react";
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
  atsScore?: number;
  resumeUrl?: string;
  resumeData?: any;
  status: string;
  appliedAt: string;
  reviewerNotes?: string;
}

export default function ApplicationsTrackerPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedResume, setSelectedResume] = useState<Application | null>(null);

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

                <div className="grid grid-cols-3 gap-2 text-xs bg-background p-2.5 rounded-md border border-border font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Match Score:</span>
                    <span className="font-bold text-primary">{app.matchScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ATS Score:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {app.atsScore || Math.round(app.matchScore * 0.85)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Compensation:</span>
                    <span className="font-bold text-foreground truncate block">{app.opportunityId?.stipendOrPrize || "N/A"}</span>
                  </div>
                </div>

                {/* View Attached ATS Resume Button */}
                {(app.resumeData || app.resumeUrl) && (
                  <button
                    type="button"
                    onClick={() => setSelectedResume(app)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Submitted ATS Resume</span>
                  </button>
                )}

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

        {/* Candidate ATS Resume Preview Modal */}
        {selectedResume && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Submitted ATS Resume &bull; {selectedResume.opportunityId?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Applied on {new Date(selectedResume.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    ATS: {selectedResume.atsScore || 85}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedResume(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Resume Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedResume.resumeData ? (
                  <div className="bg-white text-gray-900 p-8 rounded-xl border border-gray-300 shadow-md space-y-5 text-left font-sans">
                    <div className="border-b-2 border-gray-900 pb-3">
                      <h2 className="text-2xl font-black tracking-tight uppercase">
                        {selectedResume.resumeData.fullName}
                      </h2>
                      {selectedResume.resumeData.headline && (
                        <p className="text-xs font-bold text-gray-700 mt-0.5 uppercase tracking-wide">
                          {selectedResume.resumeData.headline}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-2 font-mono">
                        <span>{selectedResume.resumeData.email}</span>
                        {selectedResume.resumeData.phone && <span>• {selectedResume.resumeData.phone}</span>}
                        {selectedResume.resumeData.location && <span>• {selectedResume.resumeData.location}</span>}
                      </div>
                    </div>

                    {selectedResume.resumeData.summary && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Professional Summary
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">{selectedResume.resumeData.summary}</p>
                      </div>
                    )}

                    {selectedResume.resumeData.skills && selectedResume.resumeData.skills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Technical Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedResume.resumeData.skills.map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300 font-semibold"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResume.resumeData.experience && selectedResume.resumeData.experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Experience &amp; Internships
                        </h4>
                        <div className="space-y-3">
                          {selectedResume.resumeData.experience.map((exp: any, idx: number) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex justify-between items-baseline text-xs font-bold">
                                <span>{exp.title}</span>
                                <span className="font-mono text-[11px] text-gray-600">{exp.timeline}</span>
                              </div>
                              {exp.organization && <p className="text-xs font-medium text-gray-700">{exp.organization}</p>}
                              {exp.description && (
                                <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResume.resumeData.education && selectedResume.resumeData.education.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Education
                        </h4>
                        <div className="space-y-2">
                          {selectedResume.resumeData.education.map((edu: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-baseline text-xs">
                              <div>
                                <span className="font-bold">{edu.education}</span>
                                {edu.course && <span className="text-gray-600"> — {edu.course}</span>}
                              </div>
                              <span className="font-mono text-[11px] text-gray-600">{edu.timeline}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResume.resumeData.certifications && selectedResume.resumeData.certifications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-1.5 font-mono">
                          Certifications &amp; Licenses
                        </h4>
                        <div className="space-y-2">
                          {selectedResume.resumeData.certifications.map((cert: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-baseline text-xs">
                              <div>
                                <span className="font-bold">{cert.title}</span>
                                {cert.issuer && <span className="text-gray-600"> — {cert.issuer}</span>}
                                {cert.summary && <p className="text-[11px] text-gray-600 leading-tight pt-0.5">{cert.summary}</p>}
                              </div>
                              <span className="font-mono text-[11px] text-gray-600">{cert.timeline}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedResume.resumeUrl ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-xs text-muted-foreground">Attached resume file</p>
                    <a
                      href={selectedResume.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4" />
                      Open Resume File
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/20">
                <span className="text-xs font-mono text-muted-foreground">
                  Application Status: <strong className="text-foreground">{selectedResume.status}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const printWindow = window.open("", "_blank");
                      if (!printWindow) return;
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>${selectedResume.resumeData?.fullName || "Resume"}</title>
                            <style>
                              body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
                              h1 { font-size: 24px; margin-bottom: 4px; text-transform: uppercase; }
                              .contact { font-size: 11px; color: #555; margin-bottom: 20px; border-bottom: 2px solid #222; padding-bottom: 10px; }
                              .section { font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
                            </style>
                          </head>
                          <body>
                            <h1>${selectedResume.resumeData?.fullName}</h1>
                            <div class="contact">
                              ${selectedResume.resumeData?.email} | ${selectedResume.resumeData?.phone || ""}
                            </div>
                            ${selectedResume.resumeData?.summary ? `<div class="section">Summary</div><p style="font-size:11px;">${selectedResume.resumeData.summary}</p>` : ""}
                            <div class="section">Skills</div>
                            <p style="font-size:11px;">${(selectedResume.resumeData?.skills || []).join(", ")}</p>
                            <script>window.onload = function() { window.print(); };</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border border-border transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResume(null)}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
