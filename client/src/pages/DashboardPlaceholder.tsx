import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPlaceholder() {
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
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
          The consolidated telemetry console is currently staging role-based modules. Access will be unlocked upon completing initial onboarding.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Return to Index
          </Link>
        </div>
      </div>
    </main>
  );
}
