export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, inboxes, emails, eq, and, desc } from "@mailinbox/db";

// GET /api/inboxes/:id/emails — list emails for an inbox
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify inbox ownership
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(and(eq(inboxes.id, params.id), eq(inboxes.userId, session.user.id)))
      .limit(1);

    if (!inbox) {
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }

    const inboxEmails = await db
      .select({
        id: emails.id,
        fromAddress: emails.fromAddress,
        fromName: emails.fromName,
        toAddress: emails.toAddress,
        subject: emails.subject,
        isRead: emails.isRead,
        sizeBytes: emails.sizeBytes,
        receivedAt: emails.receivedAt,
        expiresAt: emails.expiresAt,
      })
      .from(emails)
      .where(eq(emails.inboxId, params.id))
      .orderBy(desc(emails.receivedAt));

    return NextResponse.json(inboxEmails);
  } catch (error) {
    console.error("[GET /api/inboxes/:id/emails]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
