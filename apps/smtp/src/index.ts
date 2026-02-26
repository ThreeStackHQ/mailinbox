/**
 * MailInbox SMTP Server
 *
 * Placeholder — full implementation in Sprint 1.4 (SMTP Ingestion Engine)
 *
 * Will handle:
 * - Receiving inbound emails via SMTP
 * - Parsing headers, body, and attachments
 * - Storing emails to the database via @mailinbox/db
 * - Uploading attachments to Cloudflare R2
 */

const SMTP_PORT = parseInt(process.env["SMTP_PORT"] ?? "2525", 10);

console.log(`📬 MailInbox SMTP Server`);
console.log(`   Port: ${SMTP_PORT}`);
console.log(`   Status: placeholder (Sprint 1.4)`);
console.log(`   Use 'smtp-server' package for implementation`);

// Keep the process alive
process.stdin.resume();

process.on("SIGTERM", () => {
  console.log("SMTP server shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SMTP server shutting down...");
  process.exit(0);
});
