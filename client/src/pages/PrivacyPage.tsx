import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Shield, ChevronRight } from "lucide-react";

export default function PrivacyPage() {

  return (
    <>
      <title>Privacy Policy — PortalAcademia</title>
      <meta
        name="description"
        content="PortalAcademia privacy and data protection policy detailing the handling of institutional credentials, student telemetry, and verified assessment records."
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
                PortalAcademia Privacy
              </span>
            </div>

            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              Sign In
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
          {/* Header */}
          <div className="border-b border-border pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>DATA PROTECTION STANDARDS • DPDP & GDPR COMPLIANT</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>LAST AUDITED: SEPTEMBER 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Transparent disclosure on how PortalAcademia gathers, safeguards, processes, and restricts access to academic credentials and enterprise recruitment telemetry.
            </p>
          </div>

          {/* Document Sections */}
          <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">01.</span>
                Information We Collect
              </h2>
              <p>
                We capture data solely to deliver talent development, skill gap matching, and credential verification across the academia-industry bridge:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-foreground font-medium">Account Identifiers:</strong> Institutional email address, verified full name, user role (Student, Faculty, University Admin, Industry Recruiter).
                </li>
                <li>
                  <strong className="text-foreground font-medium">Evaluation Data:</strong> Assessment completion logs, code challenge outputs, calibrated competency scores, and verified skill badges.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Academic Records:</strong> University department affiliation, graduation year, and authorized portfolio links (GitHub, LinkedIn).
                </li>
                <li>
                  <strong className="text-foreground font-medium">Technical & Session Telemetry:</strong> Cryptographic JWTs stored strictly inside encrypted <code className="font-mono text-foreground text-[11px] bg-muted px-1 py-0.5 rounded-sm">HttpOnly</code> cookies to mitigate cross-site scripting (XSS) risks.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">02.</span>
                How We Use Your Data
              </h2>
              <p>
                All data collected serves specific functional objectives:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Generating benchmark comparison reports for institutional curriculum revision.</li>
                <li>Filtering candidate cohorts based on objective skill indices rather than arbitrary resume keywords.</li>
                <li>Transmitting critical account verification emails and one-time password (OTP) authorization codes.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">03.</span>
                Data Sharing & Recruiter Visibility Controls
              </h2>
              <p>
                PortalAcademia strictly prohibits the commercial sale of user data to third-party ad brokers. Industry recruiters only gain access to candidate profiles when:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>A student directly submits an application to a verified internship or employment listing.</li>
                <li>A student explicitly sets their portfolio visibility status to "Open to Industry Discovery".</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">04.</span>
                Cryptographic Security & Storage Protocols
              </h2>
              <p>
                Passwords are never stored in plaintext and are irreversibly salted and hashed via bcrypt before database storage. Network communications enforce strict HTTPS TLS 1.3 encryption. Sessions maintain automated expiration windows with optional 30-day extended remember-me tokens.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-normal">05.</span>
                Your Rights & Data Portability
              </h2>
              <p>
                Under modern data governance norms, all participants possess the right to inspect, export, or request the permanent deletion of their account records and assessment history. To initiate an export or erasure request, email <span className="font-mono text-foreground">privacy@portalacademia.edu</span>.
              </p>
            </section>
          </div>

          {/* Quick Legal Cross-Links */}
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Related documentation:</span>
              <Link to="/terms" className="text-foreground hover:underline font-medium">
                Terms and Conditions
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <Link to="/faq" className="text-foreground hover:underline font-medium">
                Frequently Asked Questions
              </Link>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-foreground" />
              <span>Zero Data Selling Commitment</span>
            </div>
          </div>
        </main>

        {/* Minimal Swiss Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border bg-background mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>© {new Date().getFullYear()} PortalAcademia. All rights reserved.</span>
            <span>Security & Data Governance Portal</span>
          </div>
        </footer>
      </div>
    </>
  );
}
