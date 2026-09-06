import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingSelectType() {
  return (
    <main className="min-h-screen bg-mesh flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-3xl font-bold font-display text-foreground">
          Select Your Role
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Tell us who you are — Student, Faculty, Recruiter, or Institution
          Admin. This helps us personalise your experience.
        </p>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-600/10 text-brand-600 border border-brand-600/20">
          🚧 Coming Soon
        </span>
        <Button asChild variant="brand-outline" size="lg" className="mt-2">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
