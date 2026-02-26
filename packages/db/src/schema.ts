/**
 * MailInbox Database Schema
 *
 * Placeholder — full schema implementation in Sprint 1.2 (Database Schema)
 *
 * Planned tables:
 * - users         → auth, subscription tier
 * - api_keys      → key, userId, permissions, rateLimit
 * - inboxes       → id, userId, address, domain, active
 * - emails        → id, inboxId, from, to, subject, bodyText, bodyHtml, receivedAt
 * - attachments   → id, emailId, filename, mimeType, size, r2Key
 * - domains       → id, userId, domain, verified, dnsRecords
 */

// Tables will be defined here in Sprint 1.2
// Example structure (not yet implemented):
//
// export const users = pgTable("users", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   email: varchar("email", { length: 255 }).notNull().unique(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

export {};
