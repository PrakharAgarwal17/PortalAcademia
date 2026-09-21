import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/context/store";

import { API_BASE } from "@/lib/api";

export default function DashboardRouter() {
  const { user } = useAppSelector((s) => s.auth);

  const [accountType, setAccountType] = useState<string | null>(user?.role || null);
  const [isLoading, setIsLoading] = useState(!user?.role);

  useEffect(() => {
    if (user?.role) {
      setAccountType(user.role);
      setIsLoading(false);
      return;
    }

    async function resolveRole() {
      try {
        const res = await fetch(`${API_BASE}/api/profile/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.profile?.accountType) {
          setAccountType(data.profile.accountType);
        } else {
          setAccountType("student");
        }
      } catch (err) {
        console.error("DashboardRouter role resolve error:", err);
        setAccountType("student");
      } finally {
        setIsLoading(false);
      }
    }

    resolveRole();
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          Resolving authorized workspace…
        </p>
      </div>
    );
  }

  switch (accountType) {
    case "faculty":
      return <Navigate to="/dashboard/faculty" replace />;
    case "institution":
      return <Navigate to="/dashboard/institution" replace />;
    case "industry":
      return <Navigate to="/dashboard/industry" replace />;
    case "student":
    default:
      return <Navigate to="/dashboard/student" replace />;
  }
}
