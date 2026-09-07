import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <>
      <title>Terms and Conditions — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia terms and conditions governing student, university, faculty, and industry partner platform access and institutional data governance."
      />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-sm bg-zinc-900 text-zinc-100 flex items-center justify-center font-mono font-bold text-[10px]">
                PA
              </div>
              <span className="font-semibold text-xs tracking-tight text-foreground hidden sm:inline">
                PortalAcademia Legal
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="h-8 px-3 text-xs"
            >
              Sign In
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
          {/* Header */}
          <div className="border-b border-border pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>LEGAL SPECIFICATION • REVISION 2.1</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>EFFECTIVE DATE: SEPTEMBER 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Terms & Conditions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Standard regulatory guidelines and acceptable use parameters governing all institutional, academic, and corporate interactions on the PortalAcademia ecosystem.
            </p>
          </div>

          {/* Document Sections */}
          <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">01.</span>
                Acceptance of Terms & Institutional Governance
              </h2>
              <p>
                By accessing or registering an account on PortalAcademia (the "Platform"), you agree to comply with and be bound by these Terms and Conditions. PortalAcademia operates as a verified intermediary facilitating structured talent development, skill gap assessments, and direct industry hiring under Problem Statement 26044. If you register on behalf of an academic institution or corporate entity, you warrant that you possess the requisite authority to bind that entity.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">02.</span>
                User Roles & Institutional Verification
              </h2>
              <p>
                Platform features are segmented by verified operational roles:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-foreground font-medium">Students:</strong> Must provide legitimate institutional credentials. Fabricating skill evaluation answers or credentials will result in immediate permanent suspension.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Faculty Members:</strong> Authorized to publish coursework benchmarks, supervise curriculum-to-industry mappings, and endorse certified student outcomes.
                </li>
                <li>
                  <strong className="text-foreground font-medium">University Administrators:</strong> Responsible for institutional verification, batch onboarding, and official placement audit exports.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Industry Recruiters:</strong> Permitted to post valid internship and employment listings, challenge hackathons, and contact shortlisted candidates strictly through authorized platform channels.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">03.</span>
                Skill Assessments & Credential Integrity
              </h2>
              <p>
                All assessment scores, skill percentiles, and benchmark indices generated within PortalAcademia represent calibrated evaluations designed in accordance with live corporate taxonomies. Users may not reverse-engineer, leak assessment answer keys, or employ automated evaluation scripts. The platform reserves the right to invalidate flagged test instances.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">04.</span>
                Intellectual Property & Submitted Work
              </h2>
              <p>
                Students and researchers retain full intellectual ownership of source code, whitepapers, and artifacts uploaded to their digital portfolios. By participating in sponsored corporate challenges, users agree that submission rights follow the specific contest rules approved prior to enrollment.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">05.</span>
                Prohibited Conduct & Sanctions
              </h2>
              <p>
                Users are strictly prohibited from scraped data collection, credential sharing, unsolicited marketing, harassment, or posting misleading recruitment offers. Infractions result in immediate termination of the offending account and notification of the affiliated university administration.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">06.</span>
                Modifications & Contact
              </h2>
              <p>
                PortalAcademia reserves the right to amend these terms to reflect evolving regulatory frameworks and technical requirements. For legal inquiries, contact the compliance office at <span className="font-mono text-foreground">legal@portalacademia.edu</span>.
              </p>
            </section>
          </div>

          {/* Quick Legal Cross-Links */}
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Related documentation:</span>
              <Link to="/privacy" className="text-foreground hover:underline font-medium">
                Privacy Policy
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <Link to="/faq" className="text-foreground hover:underline font-medium">
                Frequently Asked Questions
              </Link>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
              <span>ISO / IEC 27001 Aligned Governance</span>
            </div>
          </div>
        </main>

        {/* Minimal Swiss Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-background mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>SIH 2026 PS 26044 Legal Repository</span>
          </div>
        </footer>
      </div>
    </>
  );
}
