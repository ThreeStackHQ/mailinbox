import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo / Brand */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              MailInbox
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Hosted email inbox infrastructure for developers
          </p>
        </div>

        {/* Description */}
        <div className="space-y-4 text-left bg-card border rounded-xl p-6">
          <h2 className="font-semibold text-foreground">What is MailInbox?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Add managed email inboxes to any application. Create custom{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              @yourdomain.com
            </code>{" "}
            inboxes, receive emails over SMTP, and query them via a clean REST
            API.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Custom email addresses per
              project
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> SMTP ingestion server
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> REST API for querying
              emails
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Attachment storage via R2
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Status badge */}
        <p className="text-xs text-muted-foreground">
          🚧 Under construction — Sprint 1.1 complete
        </p>
      </div>
    </main>
  );
}
