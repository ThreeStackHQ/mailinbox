import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  plan: text("plan").notNull().default("free"), // "free" | "pro"
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inboxes (disposable email addresses)
export const inboxes = pgTable("inboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // human-readable label
  emailAddress: text("email_address").notNull().unique(), // e.g. abc123@mailinbox.threestack.io
  smtpPassword: text("smtp_password").notNull(), // hashed
  isActive: boolean("is_active").notNull().default(true),
  emailCount: integer("email_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Emails (received messages)
export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  inboxId: uuid("inbox_id")
    .notNull()
    .references(() => inboxes.id, { onDelete: "cascade" }),
  fromAddress: text("from_address").notNull(),
  fromName: text("from_name"),
  toAddress: text("to_address").notNull(),
  subject: text("subject"),
  textBody: text("text_body"),
  htmlBodyUrl: text("html_body_url"), // R2 URL
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  headers: jsonb("headers").$type<Record<string, string>>().default({}),
  sizeBytes: bigint("size_bytes", { mode: "number" }).default(0),
  isRead: boolean("is_read").notNull().default(false),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // auto-cleanup
});

// Stripe subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(), // "active" | "canceled" | "past_due" | "trialing"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Inbox = typeof inboxes.$inferSelect;
export type NewInbox = typeof inboxes.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

interface Attachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url: string; // R2 URL
}
