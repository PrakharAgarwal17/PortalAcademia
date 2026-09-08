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

// ============================================================
// Protected Route
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAppSelector((s) => s.auth);

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

      {/* Protected Stakeholder Dashboards */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/faculty"
        element={
          <ProtectedRoute>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/institution"
        element={
          <ProtectedRoute>
            <InstitutionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/industry"
        element={
          <ProtectedRoute>
            <IndustryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/select-type"
        element={
          <ProtectedRoute>
            <OnboardingSelectType />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/individual"
        element={
          <ProtectedRoute>
            <OnboardingIndividual />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/organization"
        element={
          <ProtectedRoute>
            <OnboardingOrganization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Navigate to="/onboarding/select-type" replace />
          </ProtectedRoute>
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
