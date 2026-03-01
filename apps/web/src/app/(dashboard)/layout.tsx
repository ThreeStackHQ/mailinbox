import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);
  // Auth placeholder — Sprint 1.6 will fully wire this up
  // For now, allow access for development

  return (
    <div className="h-screen bg-[#0f172a] flex flex-col overflow-hidden">
      {/* Top Nav */}
      <header className="h-14 flex items-center justify-between px-5 border-b border-[#1e293b] bg-[#0f172a] flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#10b77f] rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">MailInbox</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard/inboxes"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
          >
            Inboxes
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#10b77f]/20 border border-[#10b77f]/30 flex items-center justify-center">
            <span className="text-[#10b77f] text-xs font-bold">
              {(session?.user?.name ?? session?.user?.email ?? "U")[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
