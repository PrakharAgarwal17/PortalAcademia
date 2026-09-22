import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Loader2,
  Building2,
  Mail,
  MapPin,
  BookOpen,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface MemberData {
  _id: string;
  userId?: string;
  name: string;
  headline?: string;
  accountType: "student" | "faculty";
  designation?: string;
  profileImage?: string;
  institution: string;
  institutionEmail?: string;
  isEmailVerified: boolean;
  skills: string[];
  bio?: string;
  location?: string;
  website?: string;
  education?: Array<{
    education: string;
    course?: string;
    description?: string;
    timeline?: string;
  }>;
  certifications?: Array<{
    _id?: string;
    title: string;
    issuer?: string;
    credentialUrl?: string;
    isVerified?: boolean;
    verifiedAt?: string;
  }>;
  pastExperience?: Array<{
    _id?: string;
    title: string;
    organization?: string;
    timeline?: string;
    description?: string;
    isVerified?: boolean;
    verifiedAt?: string;
  }>;
}

interface LackingSkill {
  skill: string;
  demandWeight: number;
  category: string;
  rationale: string;
}

interface MemberDiagnosticsPayload {
  member: MemberData;
  verifiedSkills: string[];
  lackingSkills: LackingSkill[];
  profileReadinessScore: number;
  totalMarketBenchmarks: number;
}

export default function InstitutionMemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [diagnostics, setDiagnostics] = useState<MemberDiagnosticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`${API_BASE}/api/verification/institution-members/${id}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setDiagnostics(data.data);
        } else {
          setErrorMessage(data.message || "Failed to load candidate diagnostics");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch member diagnostics:", err);
        setErrorMessage("Network error connecting to verification service");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Running member profile audit & market trend skill diagnostics…
        </p>
      </div>
    );
  }

  if (errorMessage || !diagnostics) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Member Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-md text-center">
          {errorMessage || "The requested student or faculty profile could not be located."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/institution/directory")}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Member Directory</span>
        </button>
      </div>
    );
  }

  const { member, verifiedSkills, lackingSkills, profileReadinessScore } = diagnostics;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar userName="Institution Admin" userRole="institution" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate("/institution/directory")}
              className="inline-flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Faculty & Student Directory</span>
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-xs">{member.name}</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate("/trends/institution")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-colors shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Macro Market Trends</span>
            </button>
          </div>
        </div>

        {/* Member Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary flex items-center justify-center text-2xl font-bold text-foreground overflow-hidden shrink-0 border border-border">
                {member.profileImage ? (
                  <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{member.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {member.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10.5px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase",
                      member.accountType === "faculty"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    {member.accountType === "faculty" ? (
                      <>
                        <Briefcase className="w-3 h-3" />
                        Faculty Member
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3 h-3" />
                        Enrolled Student
                      </>
                    )}
                  </span>
                  {member.isEmailVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Email Verified
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {member.accountType === "faculty"
                    ? member.designation || "Faculty Member"
                    : member.headline || "Undergraduate Scholar"}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>{member.institution}</span>
                  </span>
                  {member.institutionEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{member.institutionEmail}</span>
                    </span>
                  )}
                  {member.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{member.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Market Readiness Gauge Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border space-y-2 min-w-[200px] self-start md:self-auto">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground font-bold uppercase text-[10px]">
                  Market Readiness
                </span>
                <span className="font-bold text-primary">{profileReadinessScore}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileReadinessScore}%` }}
                />
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                Evaluated against 2026 enterprise placement demand.
              </p>
            </div>
          </div>

          {member.bio && (
            <div className="pt-4 border-t border-border/70 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="font-mono text-[10.5px] font-bold text-foreground uppercase block mb-1">
                Candidate Bio / Statement:
              </span>
              <p>{member.bio}</p>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Core Skill Diagnostics: Verified Skills vs Lacking Skills */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Verified Skills Card */}
          <section className="bg-card border border-border rounded-2xl p-6 lg:p-7 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Verified Skills on Profile</h2>
                    <p className="text-xs text-muted-foreground">
                      Skills backed by institutional email, verified credentials, or evaluations.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {verifiedSkills.length} Verified
                </span>
              </div>

              {verifiedSkills.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No verified skills found on candidate's profile.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {verifiedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{sk}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Verified Certifications Ledger */}
              {member.certifications && member.certifications.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10.5px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
                    Credential Proofs:
                  </span>
                  <div className="space-y-2">
                    {member.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-secondary/30 border border-border flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">{cert.title}</span>
                          <span className="text-[11px] text-muted-foreground">{cert.issuer || "Accredited Provider"}</span>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                            cert.isVerified
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          )}
                        >
                          {cert.isVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/70 text-[11px] text-muted-foreground">
              These competencies qualify candidate for university placement matching and corporate opportunity endorsements.
            </div>
          </section>

          {/* 2. Lacking Skills (Gaps Based on Market Trend) */}
          <section className="bg-card border border-border rounded-2xl p-6 lg:p-7 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Lacking Skills (2026 Tech Market Gaps)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      High-demand competencies missing on candidate's profile based on live enterprise hiring trends.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {lackingSkills.length} Deficits
                </span>
              </div>

              {lackingSkills.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5 font-semibold">
                  Exemplary Candidate! Profile possesses all benchmark skills in current corporate demand.
                </div>
              ) : (
                <div className="space-y-3">
                  {lackingSkills.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-foreground">{item.skill}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.demandWeight}% Demand
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300 font-mono text-[10.5px] uppercase block">
                Institutional Recommendation:
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Recommend this scholar to take standardized assessments or bridge coursework in{" "}
                <strong className="text-foreground">
                  {lackingSkills.slice(0, 2).map((s) => s.skill).join(" & ")}
                </strong>{" "}
                to increase placement probability by 45%+.
              </p>
            </div>
          </section>
        </div>

        {/* Academic History & Experience Section */}
        {member.education && member.education.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-6 lg:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Academic Progression & Degrees</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{edu.education}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{edu.timeline}</span>
                  </div>
                  {edu.course && <p className="text-primary font-medium">{edu.course}</p>}
                  {edu.description && <p className="text-muted-foreground text-[11px] pt-1">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
