/**
 * @mailinbox/config
 *
 * Shared constants and configuration for the MailInbox monorepo.
 */

// Application metadata
export const APP_CONFIG = {
  name: "MailInbox",
  description: "Hosted email inbox infrastructure for developers",
  version: "0.0.1",
  url: process.env["NEXTAUTH_URL"] ?? "http://localhost:3000",
} as const;

// Convenience exports
export const APP_URL = process.env["NEXTAUTH_URL"] ?? "https://mailinbox.threestack.io";
export const EMAIL_RETENTION_DAYS = 7 as const;

// SMTP configuration
export const SMTP_CONFIG = {
  port: parseInt(process.env["SMTP_PORT"] ?? "2525", 10),
  hostname: "0.0.0.0",
  maxMessageSize: 25 * 1024 * 1024, // 25MB
} as const;

// Subscription plans
export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    limits: {
      inboxes: 1,
      emailsPerMonth: 100,
      storageGB: 0.1,
      apiRequestsPerDay: 1_000,
    },
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    price: 9,
    limits: {
      inboxes: 10,
      emailsPerMonth: 10_000,
      storageGB: 5,
      apiRequestsPerDay: 100_000,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 29,
    limits: {
      inboxes: 100,
      emailsPerMonth: 100_000,
      storageGB: 50,
      apiRequestsPerDay: 1_000_000,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // Custom pricing
    limits: {
      inboxes: -1, // Unlimited
      emailsPerMonth: -1, // Unlimited
      storageGB: -1, // Unlimited
      apiRequestsPerDay: -1, // Unlimited
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pagination defaults
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// API routes
export const API_ROUTES = {
  inboxes: "/api/v1/inboxes",
  emails: "/api/v1/emails",
  webhooks: "/api/v1/webhooks",
} as const;
