# AI Sales Copilot

Premium sales CRM MVP built with Next.js, TypeScript, Tailwind CSS, Prisma, and Postgres.

## Local Development

Install dependencies:

```bash
npm install
```

Run the UI with mock fallback data:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database Setup

Create an `.env` file from `.env.example`.

For local Postgres with Docker:

```bash
docker compose up -d
```

Use this local database URL:

```env
DATABASE_URL="postgresql://ai_sales:ai_sales_password@localhost:5432/ai_sales_copilot?schema=public"
DEMO_WORKSPACE_ID="demo-workspace"
DEMO_USER_EMAIL="sarah.mitchell@example.com"
```

Generate the Prisma client, push the schema, and seed demo data:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Then run:

```bash
npm run dev
```

## What Is Production-Ready Now

- Postgres schema for workspaces, users, memberships, leads, messages, AI analyses, notes, tasks, pipeline events, integrations, usage, settings, and subscriptions.
- Prisma Client and seed workflow.
- Server-side repository layer for lead/settings reads.
- Server actions for pipeline stage updates, notes, tasks, and settings.
- Workspace membership and role checks for database reads and writes.
- Lead capture form at `/capture` and JSON ingestion endpoint at `/api/leads`.
- Optional OpenAI lead analysis via `OPENAI_API_KEY`, with mock AI fallback.
- Optional manager notification emails via `LEAD_NOTIFICATION_EMAIL`.
- Dynamic Next.js pages that can read from Postgres in production.
- Mock fallback when `DATABASE_URL` is missing, so the demo remains usable.

## Authorization Model

Local development uses `DEMO_USER_EMAIL` as the current user. The seed script creates:

- `sarah.mitchell@example.com` as workspace owner
- `alex.morgan@example.com` as workspace manager

Server actions call `requireWorkspaceAccess()` before writing to the database. Settings writes currently require `admin` or `owner`; sales workflow writes require at least `sales`.

For launch, replace the demo identity lookup in `lib/auth.ts` with Clerk, Auth.js, Supabase Auth, or another provider, while keeping the same role checks.

## Still Needed Before Real Launch

- Stripe checkout, subscription portal, and usage limits.
- Telegram/WhatsApp/Facebook webhook integrations.
- Sentry/PostHog, audit log UI, and automated tests.
