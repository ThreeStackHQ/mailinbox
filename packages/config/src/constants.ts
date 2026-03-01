export const APP_NAME = "MailInbox" as const;
export const APP_URL = "https://mailinbox.threestack.io" as const;
export const APP_DESCRIPTION = "Email testing for indie devs — MailTrap, but $5/mo" as const;

export const DEFAULT_SMTP_PORT = 2525 as const;
export const DEFAULT_SMTP_HOST = "0.0.0.0" as const;

export const EMAIL_RETENTION_DAYS = 7 as const;
export const FREE_INBOX_LIMIT = 1 as const;
export const FREE_EMAIL_LIMIT = 50 as const;

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    inboxLimit: FREE_INBOX_LIMIT,
    emailLimit: FREE_EMAIL_LIMIT,
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 500, // cents
    inboxLimit: Infinity,
    emailLimit: Infinity,
  },
} as const;
