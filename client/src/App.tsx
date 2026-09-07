import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { checkAuthThunk } from "@/context/authSlice";

// Lazy-loaded pages (keeps initial bundle small)
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPlaceholder from "@/pages/DashboardPlaceholder";
import OnboardingSelectType from "@/pages/OnboardingSelectType";

// ============================================================
// Protected Route
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAppSelector((s) => s.auth);

  if (!isInitialized || isLoading) {
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
  if (!isInitialized || isLoading) {
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

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
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
        path="/onboarding"
        element={<Navigate to="/onboarding/select-type" replace />}
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
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
