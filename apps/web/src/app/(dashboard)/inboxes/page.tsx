import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inboxes",
};

export default function InboxesPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inboxes</h1>
          <p className="text-muted-foreground">
            Manage your email inboxes
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          + Create Inbox
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <span className="text-5xl mb-4">📬</span>
        <h3 className="font-semibold text-foreground mb-2">No inboxes yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Create your first inbox to start receiving emails. Each inbox gets a
          unique address like{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            myapp@yourdomain.com
          </code>
          .
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Create your first inbox
        </button>
      </div>

      {/* Sprint Info */}
      <div className="bg-muted/50 border border-dashed rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">
          🚧 Inbox management coming in Sprint 1.4. DB schema in Sprint 1.2.
        </p>
      </div>
    </div>
  );
}
