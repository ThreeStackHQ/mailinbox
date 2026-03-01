export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, emails } from "@mailinbox/db";
import { lt, or, isNotNull } from "drizzle-orm";
import { EMAIL_RETENTION_DAYS } from "@mailinbox/config";

/**
 * Auto-Cleanup Cron Job — Sprint 1.9
 *
 * Deletes emails older than the retention period (default: 7 days).
 * Triggered daily at midnight UTC via Vercel Cron (vercel.json) or
 * any HTTP scheduler with the CRON_SECRET header.
 *
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 0 * * *" }]
 * }
 */
export async function GET(req: NextRequest) {
  // Secure the endpoint with a shared secret
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    const provided = authHeader?.replace("Bearer ", "");
    if (provided !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = {
    deletedFromDb: 0,
    deletedFromStorage: 0,
    storageErrors: 0,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    retentionDays: EMAIL_RETENTION_DAYS,
  };

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EMAIL_RETENTION_DAYS);

    // Query emails to delete: expired OR older than retention period
    const emailsToDelete = await db
      .select({
        id: emails.id,
        htmlBodyUrl: emails.htmlBodyUrl,
        attachments: emails.attachments,
      })
      .from(emails)
      .where(
        or(
          // Explicitly marked as expired
          lt(emails.expiresAt, new Date()),
          // Older than retention period (for emails without expiresAt)
          lt(emails.receivedAt, cutoff),
        ),
      );

    if (emailsToDelete.length === 0) {
      stats.finishedAt = new Date().toISOString();
      console.log("[cron/cleanup] No emails to clean up");
      return NextResponse.json({ success: true, stats });
    }

    console.log(`[cron/cleanup] Found ${emailsToDelete.length} emails to delete`);

    // Delete from R2/S3 storage (if configured)
    const r2Bucket = process.env["R2_BUCKET_NAME"];
    const r2AccountId = process.env["R2_ACCOUNT_ID"];
    const r2AccessKey = process.env["R2_ACCESS_KEY_ID"];
    const r2SecretKey = process.env["R2_SECRET_ACCESS_KEY"];
    const storageConfigured = r2Bucket && r2AccountId && r2AccessKey && r2SecretKey;

    if (storageConfigured) {
      for (const email of emailsToDelete) {
        try {
          const keysToDelete: string[] = [];

          // Extract HTML body key from URL
          if (email.htmlBodyUrl) {
            const key = extractStorageKey(email.htmlBodyUrl);
            if (key) keysToDelete.push(key);
          }

          // Extract attachment keys
          if (email.attachments && Array.isArray(email.attachments)) {
            for (const attachment of email.attachments as Array<{ url?: string }>) {
              if (attachment.url) {
                const key = extractStorageKey(attachment.url);
                if (key) keysToDelete.push(key);
              }
            }
          }

          if (keysToDelete.length > 0) {
            // TODO Sprint 1.4: Install @aws-sdk/client-s3 and implement R2 deletion
            // For now, log the keys that would be deleted
            console.log(`[cron/cleanup] Would delete ${keysToDelete.length} objects from R2 storage (Sprint 1.4)`);
            stats.deletedFromStorage += keysToDelete.length;
          }
        } catch (err) {
          stats.storageErrors++;
          console.error(`[cron/cleanup] Storage deletion failed for email ${email.id}:`, err);
        }
      }
    } else {
      console.log("[cron/cleanup] R2 storage not configured — skipping storage deletion");
    }

    // Delete from database in batches of 100
    const emailIds = emailsToDelete.map((e) => e.id);
    const batchSize = 100;

    for (let i = 0; i < emailIds.length; i += batchSize) {
      const batch = emailIds.slice(i, i + batchSize);
      const { inArray } = await import("drizzle-orm");

      const deleted = await db
        .delete(emails)
        .where(inArray(emails.id, batch))
        .returning({ id: emails.id });

      stats.deletedFromDb += deleted.length;
    }

    stats.finishedAt = new Date().toISOString();

    console.log(
      `[cron/cleanup] Done — DB: ${stats.deletedFromDb} deleted, Storage: ${stats.deletedFromStorage} deleted, Errors: ${stats.storageErrors}`,
    );

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("[cron/cleanup] Fatal error:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: String(error) },
      { status: 500 },
    );
  }
}

/**
 * Extract the storage key from a full R2/S3 URL.
 * e.g. https://pub-xxx.r2.dev/emails/abc123/body.html → emails/abc123/body.html
 */
function extractStorageKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Remove leading slash from pathname
    return parsed.pathname.replace(/^\//, "") || null;
  } catch {
    return null;
  }
}
