import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";
import { ThemeProvider } from "@/context/theme";

// Lazy-loaded pages (keeps initial bundle small)
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import FAQPage from "@/pages/FAQPage";
import DashboardRouter from "@/pages/dashboards/DashboardRouter";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import FacultyDashboard from "@/pages/dashboards/FacultyDashboard";
import InstitutionDashboard from "@/pages/dashboards/InstitutionDashboard";
import IndustryDashboard from "@/pages/dashboards/IndustryDashboard";
import OnboardingSelectType from "@/pages/OnboardingSelectType";
import OnboardingIndividual from "@/pages/onboarding/OnboardingIndividual";
import OnboardingOrganization from "@/pages/onboarding/OnboardingOrganization";

import { useState } from "react";

// ============================================================
// Protected Route (General Authenticated)
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, user } = useAppSelector((s) => s.auth);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user?.isOnboarded) {
    return <Navigate to="/onboarding/select-type" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// Strict Role-Protected Route
// Prevents any individual from intercepting or accessing other consoles
// ============================================================

interface RoleProtectedRouteProps {
  allowedRole: "student" | "faculty" | "institution" | "industry";
  children: React.ReactNode;
}

function RoleProtectedRoute({ allowedRole, children }: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, user } = useAppSelector((s) => s.auth);
  const [resolvedRole, setResolvedRole] = useState<string | null>(user?.role || null);
  const [isResolving, setIsResolving] = useState(!user?.role && isAuthenticated && !!user?.isOnboarded);

  useEffect(() => {
    if (user?.role) {
      setResolvedRole(user.role);
      setIsResolving(false);
      return;
    }

    let isMounted = true;
    async function resolveRole() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/profile/me`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.profile?.accountType) {
            setResolvedRole(data.profile.accountType);
          }
        }
      } catch (err) {
        console.error("Role resolution error:", err);
      } finally {
        if (isMounted) setIsResolving(false);
      }
    }

    if (isAuthenticated && user?.isOnboarded) {
      resolveRole();
    } else {
      setIsResolving(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role, user?.isOnboarded]);

  if (isLoading || !isInitialized || isResolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user?.isOnboarded) {
    return <Navigate to="/onboarding/select-type" replace />;
  }

  // Strictly lock individual to their assigned stakeholder console
  if (resolvedRole && resolvedRole !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// Onboarding Route Guard
// ============================================================

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitialized, user } = useAppSelector((s) => s.auth);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Already onboarded users shouldn't re-enter onboarding
  if (user?.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// App Shell — fires checkAuth once on mount
// ============================================================

function AppShell() {
  const dispatch = useAppDispatch();
  const { isLoading, isInitialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  // Show a full-screen loader while the initial session check is in flight
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
          <p className="text-xs font-mono text-muted-foreground">
            Verifying session telemetry…
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/faq" element={<FAQPage />} />

      {/* Dynamic Authorized Dashboard Resolver */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Role-Locked Stakeholder Dashboards */}
      <Route
        path="/dashboard/student"
        element={
          <RoleProtectedRoute allowedRole="student">
            <StudentDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/dashboard/faculty"
        element={
          <RoleProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/dashboard/institution"
        element={
          <RoleProtectedRoute allowedRole="institution">
            <InstitutionDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/dashboard/industry"
        element={
          <RoleProtectedRoute allowedRole="industry">
            <IndustryDashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Protected Onboarding Wizard */}
      <Route
        path="/onboarding/select-type"
        element={
          <OnboardingRoute>
            <OnboardingSelectType />
          </OnboardingRoute>
        }
      />
      <Route
        path="/onboarding/individual"
        element={
          <OnboardingRoute>
            <OnboardingIndividual />
          </OnboardingRoute>
        }
      />
      <Route
        path="/onboarding/organization"
        element={
          <OnboardingRoute>
            <OnboardingOrganization />
          </OnboardingRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Navigate to="/onboarding/select-type" replace />
          </OnboardingRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================================
// Root
// ============================================================

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}
