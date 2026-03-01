/**
 * MailInbox SMTP Server — Sprint 1.3
 *
 * Accepts inbound emails via SMTP, authenticates via inbox credentials,
 * parses email content with mailparser, stores metadata in DB and bodies/attachments in R2.
 */

import { SMTPServer } from "smtp-server";
import { simpleParser, ParsedMail, Attachment } from "mailparser";
import { db, inboxes, emails, eq, and } from "@mailinbox/db";
import {
  uploadEmailBody,
  uploadAttachment,
  getPublicUrl,
} from "@mailinbox/storage";

const SMTP_PORT = parseInt(process.env["SMTP_PORT"] ?? "2525", 10);
const SMTP_HOST = process.env["SMTP_HOST"] ?? "0.0.0.0";
const MAX_MESSAGE_SIZE = 25 * 1024 * 1024; // 25MB
const EMAIL_TTL_DAYS = 30;

// --- Types ---

interface AuthContext {
  inboxId: string;
  emailAddress: string;
}

// --- Helpers ---

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function extractText(s: string | Buffer | undefined): string {
  if (!s) return "";
  return Buffer.isBuffer(s) ? s.toString("utf-8") : s;
}

// --- SMTP Server ---

const server = new SMTPServer({
  secure: false,
  authRequired: false, // Allow unauthenticated for catch-all; auth optional
  disabledCommands: ["STARTTLS"],
  size: MAX_MESSAGE_SIZE,

  // Per-connection authentication
  onAuth(auth, _session, callback) {
    const { username, password } = auth;

    db.select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.emailAddress, username.toLowerCase()),
          eq(inboxes.isActive, true)
        )
      )
      .limit(1)
      .then(async ([inbox]) => {
        if (!inbox) {
          return callback(new Error("Invalid credentials"), { user: null });
        }

        // In production, smtpPassword is stored as bcrypt hash.
        // For simplicity during development, accept plain password match.
        // TODO: replace with bcrypt.compare(password, inbox.smtpPassword)
        if (inbox.smtpPassword !== password) {
          return callback(new Error("Invalid credentials"), { user: null });
        }

        const ctx: AuthContext = {
          inboxId: inbox.id,
          emailAddress: inbox.emailAddress,
        };

        callback(null, { user: ctx });
      })
      .catch((err) => {
        console.error("[SMTP] Auth error:", err);
        callback(new Error("Internal error"), { user: null });
      });
  },

  onData(stream, session, callback) {
    let rawEmail = Buffer.alloc(0);

    stream.on("data", (chunk: Buffer) => {
      rawEmail = Buffer.concat([rawEmail, chunk]);
    });

    stream.on("end", async () => {
      try {
        const parsed: ParsedMail = await simpleParser(rawEmail);

        // Determine target inbox from RCPT TO
        const rcptTo = session.envelope.rcptTo[0]?.address?.toLowerCase();
        if (!rcptTo) {
          return callback(new Error("No recipient"));
        }

        // Find inbox by email address
        const [inbox] = await db
          .select()
          .from(inboxes)
          .where(and(eq(inboxes.emailAddress, rcptTo), eq(inboxes.isActive, true)))
          .limit(1);

        if (!inbox) {
          console.warn(`[SMTP] No inbox found for: ${rcptTo}`);
          return callback(null); // Accept but discard (don't reveal inbox existence)
        }

        const emailId = crypto.randomUUID();
        const now = new Date();
        const expiresAt = addDays(now, EMAIL_TTL_DAYS);

        // Upload HTML body to R2
        let htmlBodyUrl: string | null = null;
        const htmlContent = extractText(parsed.html as any);
        if (htmlContent) {
          try {
            const key = await uploadEmailBody(inbox.id, emailId, htmlContent);
            htmlBodyUrl = getPublicUrl(key);
          } catch (err) {
            console.error("[SMTP] R2 upload (html) failed:", err);
            // Continue without R2 URL — fall back to text body only
          }
        }

        // Upload attachments to R2
        const attachmentMeta: Array<{
          filename: string;
          contentType: string;
          sizeBytes: number;
          url: string;
        }> = [];

        for (const att of parsed.attachments ?? []) {
          try {
            const key = await uploadAttachment(
              inbox.id,
              emailId,
              att.filename ?? "attachment",
              att.content,
              att.contentType
            );
            attachmentMeta.push({
              filename: att.filename ?? "attachment",
              contentType: att.contentType,
              sizeBytes: att.size,
              url: getPublicUrl(key),
            });
          } catch (err) {
            console.error("[SMTP] R2 upload (attachment) failed:", err);
          }
        }

        // Build from address
        const fromAddress = parsed.from?.value[0]?.address ?? session.envelope.mailFrom || "unknown";
        const fromName = parsed.from?.value[0]?.name ?? null;

        // Store email in DB
        await db.insert(emails).values({
          id: emailId,
          inboxId: inbox.id,
          fromAddress: typeof fromAddress === "string" ? fromAddress : String(fromAddress),
          fromName,
          toAddress: rcptTo,
          subject: parsed.subject ?? "(no subject)",
          textBody: extractText(parsed.text as any) || null,
          htmlBodyUrl,
          attachments: attachmentMeta,
          headers: Object.fromEntries(
            [...(parsed.headers?.entries() ?? [])].map(([k, v]) => [
              k,
              String(v),
            ])
          ),
          sizeBytes: rawEmail.length,
          isRead: false,
          receivedAt: now,
          expiresAt,
        });

        // Increment inbox email count
        await db
          .update(inboxes)
          .set({
            emailCount: inbox.emailCount + 1,
            updatedAt: now,
          })
          .where(eq(inboxes.id, inbox.id));

        console.log(
          `[SMTP] Email stored: ${emailId} → ${rcptTo} (from: ${fromAddress})`
        );

        callback(null);
      } catch (err) {
        console.error("[SMTP] onData error:", err);
        callback(new Error("Internal processing error"));
      }
    });

    stream.on("error", (err) => {
      console.error("[SMTP] Stream error:", err);
      callback(err);
    });
  },

  onError(err) {
    console.error("[SMTP] Server error:", err);
  },
});

// --- Start ---

server.listen(SMTP_PORT, SMTP_HOST, () => {
  console.log(`📬 MailInbox SMTP Server`);
  console.log(`   Listening on ${SMTP_HOST}:${SMTP_PORT}`);
  console.log(`   Max message size: ${MAX_MESSAGE_SIZE / 1024 / 1024}MB`);
  console.log(`   Email TTL: ${EMAIL_TTL_DAYS} days`);
});

// --- Graceful shutdown ---

function shutdown() {
  console.log("[SMTP] Shutting down...");
  server.close(() => {
    console.log("[SMTP] Closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
