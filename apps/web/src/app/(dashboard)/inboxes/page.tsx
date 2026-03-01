"use client";

/**
 * MailInbox — Sprint 1.7: Dashboard Layout & Email UI
 *
 * Three-panel email client:
 *   LEFT  — Inbox list (create, select, badge for unread count)
 *   MIDDLE — Email list for selected inbox (subject, from, timestamp, unread dot)
 *   RIGHT  — Email detail view (HTML preview, attachments, delete/reply)
 *
 * TODO (Sprint 1.5): Replace mock data with real API calls to:
 *   GET /api/inboxes               — list user's inboxes
 *   GET /api/inboxes/:id/emails    — list emails for inbox
 *   GET /api/inboxes/:id/emails/:emailId — get single email
 *   DELETE /api/inboxes/:id/emails/:emailId — delete email
 *
 * TODO (Sprint 1.6): Auth integration (useSession / server-side redirect)
 */

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

interface Email {
  id: string;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null; // sanitized HTML
  attachments: Attachment[];
  isRead: boolean;
  receivedAt: string; // ISO string
}

interface Inbox {
  id: string;
  name: string;
  emailAddress: string;
  emailCount: number;
  unreadCount: number;
  isActive: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INBOXES: Inbox[] = [
  {
    id: "inbox-1",
    name: "staging-app",
    emailAddress: "staging-app@mailinbox.threestack.io",
    emailCount: 12,
    unreadCount: 3,
    isActive: true,
  },
  {
    id: "inbox-2",
    name: "production-alerts",
    emailAddress: "production-alerts@mailinbox.threestack.io",
    emailCount: 5,
    unreadCount: 1,
    isActive: true,
  },
  {
    id: "inbox-3",
    name: "auth-tests",
    emailAddress: "auth-tests@mailinbox.threestack.io",
    emailCount: 24,
    unreadCount: 0,
    isActive: true,
  },
];

const MOCK_EMAILS: Record<string, Email[]> = {
  "inbox-1": [
    {
      id: "email-1",
      fromAddress: "noreply@myapp.io",
      fromName: "MyApp",
      toAddress: "staging-app@mailinbox.threestack.io",
      subject: "Welcome to MyApp!",
      textBody: "Thanks for signing up. Please verify your email.",
      htmlBody: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#0f172a">Welcome to MyApp!</h2>
        <p style="color:#475569">Thanks for signing up. Please verify your email address to get started.</p>
        <a href="#" style="display:inline-block;background:#10b77f;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email →</a>
        <p style="color:#94a3b8;font-size:14px">If you didn't sign up, you can safely ignore this email.</p>
      </div>`,
      attachments: [],
      isRead: false,
      receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "email-2",
      fromAddress: "billing@stripe.com",
      fromName: "Stripe",
      toAddress: "staging-app@mailinbox.threestack.io",
      subject: "Your invoice from Stripe: $49.00",
      textBody: "Your invoice of $49.00 is available.",
      htmlBody: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#0f172a">Invoice from Stripe</h2>
        <p style="color:#475569">Your monthly invoice for <strong>$49.00</strong> is now available.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f8fafc"><td style="padding:8px;border:1px solid #e2e8f0">Pro Plan — Monthly</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:right"><strong>$49.00</strong></td></tr>
        </table>
        <a href="#" style="display:inline-block;background:#635BFF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Invoice →</a>
      </div>`,
      attachments: [
        {
          filename: "invoice_2026_03.pdf",
          contentType: "application/pdf",
          sizeBytes: 48200,
          url: "#",
        },
      ],
      isRead: false,
      receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "email-3",
      fromAddress: "alerts@myapp.io",
      fromName: "MyApp Alerts",
      toAddress: "staging-app@mailinbox.threestack.io",
      subject: "Password reset request",
      textBody: "A password reset was requested for your account.",
      htmlBody: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#0f172a">Password Reset Request</h2>
        <p style="color:#475569">We received a request to reset the password for your account.</p>
        <a href="#" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password →</a>
        <p style="color:#94a3b8;font-size:14px">This link expires in 1 hour. If you didn't request this, please ignore.</p>
      </div>`,
      attachments: [],
      isRead: false,
      receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "email-4",
      fromAddress: "no-reply@github.com",
      fromName: "GitHub",
      toAddress: "staging-app@mailinbox.threestack.io",
      subject: "[ThreeStackHQ/mailinbox] New issue: SMTP connection timeout",
      textBody: "A new issue was opened in ThreeStackHQ/mailinbox.",
      htmlBody: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#0f172a">[ThreeStackHQ/mailinbox] New issue #42</h2>
        <p><strong>SMTP connection timeout on high load</strong></p>
        <p style="color:#475569">Opened by <strong>Ruud</strong></p>
        <a href="#" style="display:inline-block;background:#24292f;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">View Issue →</a>
      </div>`,
      attachments: [],
      isRead: true,
      receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "inbox-2": [
    {
      id: "email-5",
      fromAddress: "alerts@sentry.io",
      fromName: "Sentry",
      toAddress: "production-alerts@mailinbox.threestack.io",
      subject: "🚨 [PRODUCTION] Unhandled Exception in api/stripe/webhook",
      textBody: "A new unhandled exception occurred.",
      htmlBody: `<div style="font-family:sans-serif;padding:24px;max-width:600px;border-left:4px solid #ef4444">
        <h2 style="color:#ef4444">🚨 Production Alert</h2>
        <p style="color:#475569">Unhandled exception in <code>api/stripe/webhook</code></p>
        <pre style="background:#f8fafc;padding:12px;border-radius:6px;font-size:13px;overflow:auto">TypeError: Cannot read property 'id' of undefined
  at handleSubscriptionUpsert (webhook.ts:271:23)</pre>
        <a href="#" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">View in Sentry →</a>
      </div>`,
      attachments: [],
      isRead: false,
      receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],
  "inbox-3": [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getInitials(name: string | null, email: string): string {
  if (name) return (name[0] ?? "?").toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

function getFileIcon(contentType: string): string {
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("image")) return "🖼️";
  if (contentType.includes("zip") || contentType.includes("tar")) return "📦";
  if (contentType.includes("text")) return "📝";
  return "📎";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InboxListPanel({
  inboxes,
  selectedId,
  onSelect,
  onCreateInbox,
}: {
  inboxes: Inbox[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateInbox: () => void;
}) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-[#1e293b] flex flex-col bg-[#0f172a]">
      {/* Header */}
      <div className="p-3 border-b border-[#1e293b]">
        <button
          onClick={onCreateInbox}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#10b77f] hover:bg-[#0ea36f] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Inbox
        </button>
      </div>

      {/* Inbox list */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {inboxes.map((inbox) => (
          <button
            key={inbox.id}
            onClick={() => onSelect(inbox.id)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors group ${
              selectedId === inbox.id
                ? "bg-[#10b77f]/15 text-[#10b77f] border border-[#10b77f]/25"
                : "text-gray-400 hover:bg-[#1e293b] hover:text-white"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${selectedId === inbox.id ? "text-[#10b77f]" : "text-gray-500 group-hover:text-gray-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium truncate">{inbox.name}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5 pl-6">{inbox.emailAddress}</p>
            </div>
            {inbox.unreadCount > 0 && (
              <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#10b77f] text-white text-[10px] font-bold">
                {inbox.unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function EmailListPanel({
  inbox,
  emails,
  selectedEmailId,
  onSelect,
}: {
  inbox: Inbox | null;
  emails: Email[];
  selectedEmailId: string | null;
  onSelect: (email: Email) => void;
}) {
  if (!inbox) {
    return (
      <div className="w-80 flex-shrink-0 border-r border-[#1e293b] flex items-center justify-center text-gray-500 bg-[#0f172a]">
        <div className="text-center">
          <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">Select an inbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-[#1e293b] flex flex-col bg-[#0f172a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{inbox.name}</h2>
          <p className="text-xs text-gray-500">{emails.length} emails</p>
        </div>
        <button className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-[#1e293b] transition-colors">
          Sort ▾
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg border border-[#334155]">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search emails..."
            className="bg-transparent text-xs text-gray-300 placeholder-gray-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-6">
            <div>
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-sm font-medium text-gray-300 mb-1">No emails yet</p>
              <p className="text-xs text-gray-500">
                Send an email to{" "}
                <span className="font-mono text-[#10b77f]">{inbox.emailAddress}</span>
              </p>
            </div>
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email)}
              className={`w-full text-left px-4 py-3 hover:bg-[#1e293b] transition-colors ${
                selectedEmailId === email.id ? "bg-[#1e293b] border-l-2 border-[#10b77f]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {!email.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b77f] flex-shrink-0 mt-1" />
                  )}
                  <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-white" : "text-gray-300"}`}>
                    {email.fromName ?? email.fromAddress}
                  </span>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{formatRelativeTime(email.receivedAt)}</span>
              </div>
              <p className={`text-xs truncate mb-1 ${!email.isRead ? "text-gray-200" : "text-gray-400"}`}>
                {email.subject ?? "(no subject)"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {email.textBody ?? ""}
              </p>
              {email.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {email.attachments.length} attachment{email.attachments.length > 1 ? "s" : ""}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function EmailDetailPanel({
  email,
  onDelete,
}: {
  email: Email | null;
  onDelete: (id: string) => void;
}) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#0f172a]">
        <div className="text-center">
          <svg className="w-14 h-14 text-gray-800 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
          <p className="text-sm text-gray-500">Select an email to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a] min-w-0">
      {/* Email header */}
      <div className="px-6 py-4 border-b border-[#1e293b] flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-lg font-bold text-white leading-tight">
            {email.subject ?? "(no subject)"}
          </h1>
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#10b77f] border border-[#10b77f]/30 rounded-lg hover:bg-[#10b77f]/10 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
            <button
              onClick={() => onDelete(email.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {/* From/To */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#10b77f]">
              {getInitials(email.fromName, email.fromAddress)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {email.fromName ?? email.fromAddress}
              </span>
              {email.fromName && (
                <span className="text-xs text-gray-500">&lt;{email.fromAddress}&gt;</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>to {email.toAddress}</span>
              <span>·</span>
              <span>{new Date(email.receivedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto">
        {email.htmlBody ? (
          <iframe
            srcDoc={email.htmlBody}
            title="Email preview"
            className="w-full h-full bg-white"
            sandbox="allow-same-origin"
            style={{ minHeight: "400px" }}
          />
        ) : (
          <div className="p-6">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {email.textBody ?? "(empty email body)"}
            </pre>
          </div>
        )}
      </div>

      {/* Attachments */}
      {email.attachments.length > 0 && (
        <div className="px-6 py-4 border-t border-[#1e293b] flex-shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Attachments ({email.attachments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                download={att.filename}
                className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg hover:border-[#10b77f]/40 hover:bg-[#10b77f]/5 transition-colors group"
              >
                <span className="text-lg">{getFileIcon(att.contentType)}</span>
                <div>
                  <p className="text-xs font-medium text-gray-200 group-hover:text-white truncate max-w-32">
                    {att.filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatBytes(att.sizeBytes)}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#10b77f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Inbox Modal ───────────────────────────────────────────────────────

function CreateInboxModal({ onClose, onCreated }: { onClose: () => void; onCreated: (inbox: Inbox) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    // TODO: POST /api/inboxes
    // Mock for now
    await new Promise((r) => setTimeout(r, 500));
    const emailAddress = `${name.toLowerCase().replace(/\s+/g, "-")}@mailinbox.threestack.io`;
    onCreated({
      id: `inbox-${Date.now()}`,
      name: name.trim(),
      emailAddress,
      emailCount: 0,
      unreadCount: 0,
      isActive: true,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Create Inbox</h2>
        <p className="text-sm text-gray-400 mb-5">
          Create a new disposable email inbox to capture test emails.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Inbox Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="staging-app"
              className="w-full px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-[#10b77f] transition-colors"
              autoFocus
            />
            {name && (
              <p className="text-xs text-gray-500 mt-1">
                Address:{" "}
                <span className="text-[#10b77f] font-mono">
                  {name.toLowerCase().replace(/\s+/g, "-")}@mailinbox.threestack.io
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 border border-[#334155] rounded-lg hover:text-white hover:border-[#475569] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#10b77f] hover:bg-[#0ea36f] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Inbox"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InboxesPage() {
  const [inboxes, setInboxes] = useState<Inbox[]>(MOCK_INBOXES);
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedInbox = inboxes.find((i) => i.id === selectedInboxId) ?? null;
  const emails = selectedInboxId ? (MOCK_EMAILS[selectedInboxId] ?? []) : [];

  const handleSelectInbox = useCallback((id: string) => {
    setSelectedInboxId(id);
    setSelectedEmail(null);
  }, []);

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmail(email);
  }, []);

  const handleDeleteEmail = useCallback((emailId: string) => {
    // TODO: DELETE /api/inboxes/:inboxId/emails/:emailId
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    // Optimistic UI — remove from list
    setInboxes((prev) =>
      prev.map((inbox) =>
        inbox.id === selectedInboxId
          ? { ...inbox, emailCount: Math.max(0, inbox.emailCount - 1) }
          : inbox
      )
    );
  }, [selectedEmail, selectedInboxId]);

  const handleCreateInbox = useCallback((inbox: Inbox) => {
    setInboxes((prev) => [...prev, inbox]);
    setSelectedInboxId(inbox.id);
    setShowCreateModal(false);
  }, []);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Inbox list panel */}
      <InboxListPanel
        inboxes={inboxes}
        selectedId={selectedInboxId}
        onSelect={handleSelectInbox}
        onCreateInbox={() => setShowCreateModal(true)}
      />

      {/* Email list panel */}
      <EmailListPanel
        inbox={selectedInbox}
        emails={emails}
        selectedEmailId={selectedEmail?.id ?? null}
        onSelect={handleSelectEmail}
      />

      {/* Email detail panel */}
      <EmailDetailPanel
        email={selectedEmail}
        onDelete={handleDeleteEmail}
      />

      {/* Create inbox modal */}
      {showCreateModal && (
        <CreateInboxModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateInbox}
        />
      )}
    </div>
  );
}
