import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Building2,
  Mail,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface InstitutionProfile {
  _id?: string;
  name: string;
  institutionName?: string;
  aisheCode?: string;
  officialEmail?: string;
  accountType: string;
}

export interface InstitutionMember {
  _id: string;
  userId: string;
  name: string;
  headline?: string;
  accountType: "student" | "faculty";
  designation?: string;
  profileImage?: string;
  institution: string;
  institutionEmail?: string;
  isEmailVerified: boolean;
  skills: string[];
  education: Array<{
    education?: string;
    course?: string;
    timeline?: string;
  }>;
  academicYear: string;
  graduationBatch: string;
  primaryDegree: string;
  verifiedCertsCount: number;
  totalCertsCount: number;
  experienceCount: number;
  bio?: string;
  createdAt?: string;
}

export default function InstitutionDirectoryPage() {
  const navigate = useNavigate();

  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(null);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudents, setShowStudents] = useState(true);
  const [showFaculty, setShowFaculty] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.profile) {
        if (data.profile.accountType !== "institution") {
          navigate("/dashboard");
          return;
        }
        setInstitutionProfile(data.profile);
      } else {
        navigate("/auth");
      }
    } catch (err) {
      console.error("Failed to fetch institution profile:", err);
    }
  }, [navigate]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== "all") params.append("year", selectedYear);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      let roleParam = "all";
      if (showStudents && !showFaculty) roleParam = "student";
      else if (!showStudents && showFaculty) roleParam = "faculty";
      params.append("role", roleParam);

      const res = await fetch(`${API_BASE}/api/verification/institution-members?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMembers(data.data);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showStudents, showFaculty, selectedYear]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Client-side quick filter in case user toggles checkboxes without refetching immediately
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.accountType === "student" && !showStudents) return false;
      if (m.accountType === "faculty" && !showFaculty) return false;
      return true;
    });
  }, [members, showStudents, showFaculty]);

  const institutionName =
    institutionProfile?.institutionName || institutionProfile?.name || "Academic Institution";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar
        userName={institutionProfile?.name}
        profileId={institutionProfile?._id}
        userRole="institution"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header with Breathing Room */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard/institution")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Institution Console</span>
              </button>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                <Users className="w-3.5 h-3.5" />
                University Roster
              </span>
              {institutionProfile?.aisheCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                  AISHE: {institutionProfile.aisheCode}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-primary shrink-0" />
              <span>{institutionName} — Faculty & Student Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
              Centralized roster of students and faculty members. Inspect verified skill badges, review placement telemetry, and diagnose individual market readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 md:pt-0">
            <button
              type="button"
              onClick={() => navigate("/trends/institution")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-all cursor-pointer shadow-2xs group"
            >
              <TrendingUp className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Macro Market Trends</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/institution")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verification Desk</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Multi-Filter Controls */}
        <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, institutional email, department, roll number, or skill..."
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/40 border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
              />
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter Dropdown with Checkboxes */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-secondary/50 border border-border hover:border-primary/40 rounded-xl text-xs font-semibold text-foreground cursor-pointer transition-colors shadow-2xs"
                >
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Role:{" "}
                    {showStudents && showFaculty
                      ? "All Roles"
                      : showStudents
                      ? "Students Only"
                      : showFaculty
                      ? "Faculty Only"
                      : "None"}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isRoleDropdownOpen && "rotate-180")} />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg p-3 space-y-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground font-bold block mb-1">
                      Filter by Member Role:
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showStudents}
                        onChange={(e) => setShowStudents(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>Students</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showFaculty}
                        onChange={(e) => setShowFaculty(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>Faculty Members</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Year Filter */}
              <div className="flex items-center gap-2 bg-secondary/50 border border-border px-3.5 py-2 rounded-xl text-xs font-semibold">
                <span className="text-muted-foreground font-mono text-[11px] uppercase">Batch / Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-card text-foreground">All Batches</option>
                  <option value="1st" className="bg-card text-foreground">1st Year (Class of 2028)</option>
                  <option value="2nd" className="bg-card text-foreground">2nd Year (Class of 2027)</option>
                  <option value="3rd" className="bg-card text-foreground">3rd Year (Class of 2026)</option>
                  <option value="4th" className="bg-card text-foreground">4th Year (Class of 2025)</option>
                </select>
              </div>

              {/* Count Pill */}
              <span className="text-xs font-mono px-3 py-2 rounded-xl bg-secondary text-muted-foreground border border-border font-bold">
                {filteredMembers.length} Members
              </span>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-mono text-muted-foreground">
              Retrieving institutional roster and verified portfolios…
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center bg-card border border-dashed border-border rounded-2xl p-8 space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No members found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No students or faculty match your current search query or active filter criteria. Try adjusting the search term or role selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs transition-all group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Role Pill + Verified Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase",
                        member.accountType === "faculty"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      )}
                    >
                      {member.accountType === "faculty" ? (
                        <>
                          <Briefcase className="w-3 h-3" />
                          Faculty
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-3 h-3" />
                          Student
                        </>
                      )}
                    </span>

                    <span className="text-[10px] font-mono text-muted-foreground">
                      ID: {member.userId ? member.userId.slice(-6).toUpperCase() : member._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-base font-bold text-foreground overflow-hidden shrink-0 border border-border">
                      {member.profileImage ? (
                        <img
                          src={member.profileImage}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{member.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {member.name}
                        </h3>
                        {member.isEmailVerified && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.accountType === "faculty"
                          ? member.designation || "Faculty Member"
                          : `${member.academicYear} • ${member.graduationBatch}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span>{member.institutionEmail || "No institutional email registered"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Degree / Department */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/80 text-xs">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Department / Specialization
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {member.primaryDegree}
                    </span>
                  </div>

                  {/* Verified Credentials Summary */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-muted-foreground">Verified Credentials:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {member.verifiedCertsCount} verified / {member.totalCertsCount} total
                    </span>
                  </div>

                  {/* Skills Snapshot */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                      Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills && member.skills.length > 0 ? (
                        member.skills.slice(0, 4).map((sk) => (
                          <SkillBadge key={sk} skill={sk} size="xs" />
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No skills tagged</span>
                      )}
                      {member.skills && member.skills.length > 4 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          +{member.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visit Profile Action Button */}
                <button
                  type="button"
                  onClick={() => navigate(`/institution/member/${member._id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary transition-all cursor-pointer shadow-2xs group/btn"
                >
                  <span>Visit Profile & Skill Diagnostics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
