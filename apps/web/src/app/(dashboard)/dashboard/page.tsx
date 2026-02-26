import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your email infrastructure
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Total Inboxes
          </p>
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">No inboxes yet</p>
        </div>
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Emails Received
          </p>
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            API Requests
          </p>
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-4">📭</span>
          <p className="text-muted-foreground text-sm">No activity yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Create an inbox to get started
          </p>
        </div>
      </div>

      {/* Sprint Info */}
      <div className="bg-muted/50 border border-dashed rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">
          🚧 Sprint 1.1 — Repository & Monorepo Setup complete. Auth + DB in Sprint 1.2–1.3.
        </p>
      </div>
    </div>
  );
}
