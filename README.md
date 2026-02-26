# MailInbox

> Hosted email inbox infrastructure — receive, store, and query emails via API.

MailInbox lets developers add a fully-managed email inbox to any application. Create custom `@yourdomain.com` inboxes, receive emails over SMTP, and access them via a clean REST API.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Web App | Next.js 14 (App Router) |
| SMTP Server | Node.js + `smtp-server` |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth.js v5 |
| Payments | Stripe |
| Email Delivery | Resend |
| Storage | Cloudflare R2 |
| Monorepo | Turborepo + pnpm workspaces |

---

## Project Structure

```
mailinbox/
├── apps/
│   ├── web/          # Next.js 14 dashboard & marketing site
│   └── smtp/         # Node.js SMTP ingestion server
├── packages/
│   ├── db/           # Drizzle ORM schema & migrations
│   └── config/       # Shared constants & configuration
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL

### Setup

```bash
# Clone the repo
git clone https://github.com/ThreeStackHQ/mailinbox.git
cd mailinbox

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run in development
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all apps and packages |
| `pnpm test` | Run all tests |

---

## Apps

### `apps/web`

Next.js 14 application with App Router.

- **URL:** http://localhost:3000
- **Routes:**
  - `/login` — Authentication page
  - `/dashboard` — Main dashboard
  - `/dashboard/inboxes` — Inbox management

```bash
cd apps/web
pnpm dev
```

### `apps/smtp`

Node.js SMTP server for email ingestion.

- **Port:** `SMTP_PORT` (default: 2525)

```bash
cd apps/smtp
pnpm dev
```

---

## Packages

### `packages/db`

Drizzle ORM configuration with PostgreSQL.

```typescript
import { db } from "@mailinbox/db";
```

### `packages/config`

Shared constants and configuration values.

```typescript
import { PLANS, APP_CONFIG } from "@mailinbox/config";
```

---

## Environment Variables

See `.env.example` for all required environment variables.

---

## Architecture

```
                    ┌──────────────────────┐
                    │    apps/web           │
                    │  (Next.js Dashboard)  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    packages/db        │
                    │  (Drizzle ORM)        │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
Incoming Email ──►  │    apps/smtp          │
                    │  (SMTP Server)        │
                    └──────────────────────┘
```

---

## License

Private — ThreeStack © 2026
