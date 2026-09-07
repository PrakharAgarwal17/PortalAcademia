import { LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/context/store";
import { signOutThunk } from "@/context/authSlice";

export default function DashboardPlaceholder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const handleSignOut = async () => {
    await dispatch(signOutThunk());
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-sm text-center">
        <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center mx-auto mb-3">
          <LayoutDashboard className="w-4 h-4 text-foreground" />
        </div>
        <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] tabular-nums rounded-sm bg-muted text-muted-foreground border border-border mx-auto mb-3">
          CONSOLE // INITIALIZING
        </span>
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Stakeholder Console
        </h1>
        {user?.email && (
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Logged in as: <span className="text-foreground font-medium">{user.email}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
          The consolidated telemetry console is currently staging role-based modules. Access will be unlocked upon completing initial onboarding.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Return to Index
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </main>
  );
}
