import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold">M</span>
          </div>
          <span className="font-bold text-xl text-foreground">MailInbox</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to continue
        </p>
      </div>

      {/* Login Form (placeholder) */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="button"
          className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Auth implementation coming in Sprint 1.3
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
