import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import StudentDashboard from "./StudentDashboard";
import FacultyDashboard from "./FacultyDashboard";
import InstitutionDashboard from "./InstitutionDashboard";
import IndustryDashboard from "./IndustryDashboard";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export default function DashboardRouter() {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveRole() {
      try {
        const res = await fetch(`${API_BASE}/api/profile/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.profile) {
          setAccountType(data.profile.accountType);
        } else {
          setAccountType("student"); // fallback default
        }
      } catch (err) {
        console.error("DashboardRouter role resolve error:", err);
        setAccountType("student");
      } finally {
        setIsLoading(false);
      }
    }

    resolveRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Resolving stakeholder workspace…
        </p>
      </div>
    );
  }

  switch (accountType) {
    case "faculty":
      return <FacultyDashboard />;
    case "institution":
      return <InstitutionDashboard />;
    case "industry":
      return <IndustryDashboard />;
    case "student":
    default:
      return <StudentDashboard />;
  }
}
