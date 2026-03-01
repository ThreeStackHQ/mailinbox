export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, inboxes, emails, eq, and, sql } from "@mailinbox/db";
import { getPresignedUrl } from "@mailinbox/storage";

// GET /api/inboxes/:id/emails/:emailId — get single email with pre-signed body URL
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; emailId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify inbox ownership
    const [inbox] = await db
      .select({ id: inboxes.id })
      .from(inboxes)
      .where(and(eq(inboxes.id, params.id), eq(inboxes.userId, session.user.id)))
      .limit(1);

    if (!inbox) {
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }

    const [email] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, params.emailId), eq(emails.inboxId, params.id)))
      .limit(1);

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Mark as read
    if (!email.isRead) {
      await db
        .update(emails)
        .set({ isRead: true })
        .where(eq(emails.id, params.emailId));
    }

    // Generate pre-signed URL for HTML body if stored in R2
    let htmlBodyPresignedUrl: string | null = null;
    if (email.htmlBodyUrl && !email.htmlBodyUrl.startsWith("http")) {
      try {
        htmlBodyPresignedUrl = await getPresignedUrl(email.htmlBodyUrl, 3600);
      } catch (err) {
        console.error("[GET email] presign error:", err);
      }
    } else {
      htmlBodyPresignedUrl = email.htmlBodyUrl;
    }

    return NextResponse.json({
      ...email,
      htmlBodyUrl: htmlBodyPresignedUrl,
    });
  } catch (error) {
    console.error("[GET /api/inboxes/:id/emails/:emailId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/inboxes/:id/emails/:emailId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; emailId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify inbox ownership
    const [inbox] = await db
      .select({ id: inboxes.id })
      .from(inboxes)
      .where(and(eq(inboxes.id, params.id), eq(inboxes.userId, session.user.id)))
      .limit(1);

    if (!inbox) {
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(emails)
      .where(and(eq(emails.id, params.emailId), eq(emails.inboxId, params.id)))
      .returning({ id: emails.id });

    if (!deleted) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Decrement inbox email count
    await db
      .update(inboxes)
      .set({ emailCount: sql`${inboxes.emailCount} - 1` })
      .where(eq(inboxes.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/inboxes/:id/emails/:emailId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
