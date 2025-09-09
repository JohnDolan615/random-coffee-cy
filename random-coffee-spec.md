Role & Output Mode

You are a senior full-stack TypeScript engineer. Generate a complete, production-grade repository that I can git init and push immediately. Do not explain; output the full file tree followed by the full contents of every file. No placeholders or TODOs—write working code.

Product you must implement

A “Random Coffee” Telegram bot that onboards users in ~60s, stores their profile, and pairs them with relevant people weekly using a scoring algorithm. Monetization is Telegram Stars (XTR) only. Use the attached spec as the source of truth for:

Onboarding flow & copy (“60-second onboarding”), field definitions, and UX guardrails. 



Matching algorithm (eligibility, scoring components, default weights, greedy V1; optional blossom V2), scheduling/handshake, cooldowns, and feedback loop. 



Database schema, ERD, and handlers diagram; use the Prisma schema structure and naming from the spec. 



Monetization via Stars: subscription + microtransactions + teams, XTR invoices, refunds, and compliance notes. Implement at least Pro Monthly + 3 microtransactions (Extra match, Re-roll, Priority). 



If anything in my instructions conflicts with the spec, the spec wins.

Tech stack & architecture (TypeScript-first)

Monorepo with pnpm workspaces

apps/next — Next.js 14 (App Router) for mini-app/admin + simple JSON APIs

apps/bot — Node worker using grammY for Telegram updates

PostgreSQL + Prisma as ORM/migrations

Redis + BullMQ for daily matching cron + reminders

Zod for input validation; Pino logs; ESLint + Prettier

Docker Compose for Postgres and Redis

Vitest for unit/integration tests

Implement these features exactly
1) Onboarding & Profile (Telegram DM)

Implement the “60-second onboarding” steps, prompts, and button behaviors (profession, industry ≤2, topics 3–5 with custom tags, 120-char “about”, goal 1–2, mode + city/radius, timezone autodetect fallback, optional frequency). Use the exact copy and options from the spec. Provide /profile to edit. Include progress hint and guardrails (skip where optional). 



2) Data model & Prisma

Use the ERD and Prisma schema structure from the spec (User, Profile, City, UserTopic, UserIndustry, Availability, Blocklist, Pairing, PairFeedback, Subscription, Payment), matching enums and indexes. Keep field names as in the spec (mode, radiusKm, vibe, frequency, etc.). Include migrations and a seed script with ~100 diverse fake users. 



3) Matching

Eligibility/pool: respect paused, frequency, pending/confirmed, mode compatibility (online/both; in-person must share city & be within radius), availability overlap, language/company filters, do-not-match. Bucket by mode/city/timezone. 



Scoring: implement components (topics Jaccard; industry proximity; profession relation; goal compatibility; seniority fit; availability overlap; distance penalty; diversity boost; repeat cooldown). Implement vibe slider weight adjustments and default weights from the spec config. Expose weights in a YAML/TS config. 



Algorithm: ship V1 greedy with reciprocity check (top-K, mutual top-10). Code cleanly so we can swap to blossom later. 



Scheduling handshake: after pairing, propose 3 overlapping slots (convert per timezone); create 2-person group on confirm; ping at 48h; expire at 72–96h and re-queue. Store Pairing rows and status transitions. 



Cooldown: don’t re-match same pair within 12 weeks. Track feedback (rating, tags, no-show). Basic dashboard chart of acceptance, show-rate, avg score.

4) Stars (XTR) monetization

Implement sendInvoice with currency: "XTR" for:

Pro Monthly (770 XTR)

Extra match (150 XTR)

Instant re-roll (60 XTR)

Priority boost 24h (120 XTR)

Mark payments and activate entitlements (e.g., Pro lifts weekly limit, adds priority, auto-scheduler).

Handle :successful_payment and refundStarPayment helper for support.

Guard paywalls at conversion moments from the spec (after limit, weak similarity, etc.). 



5) Queues & cron

BullMQ queue match with a daily job per the spec: run 09:00 user-local; in code, schedule UTC cron and bucket by timezone clusters. Add reminders queue. Provide /api/match/trigger for manual trigger (admin only). 


6) Mini-app + Admin

Minimal user mini-app: view/edit profile, pause/resume, manage availability windows, do-not-match list.

Admin dashboard: list today’s pool, pairs created, acceptance, show-rate, simple search; feature to refund a payment; toggle “avoid same company” globally.

7) Handlers diagram flow & commands

Implement commands from the spec: /start, /profile, /match, /pause, /resume, /terms, /paysupport. Match the handlers flow and statuses (pending|confirmed|expired|done|no_show). 


Repository layout (exact)
random-coffee/
  package.json            # pnpm workspaces
  pnpm-workspace.yaml
  turbo.json              # optional, or just scripts
  .editorconfig
  .gitignore
  README.md
  docker-compose.yml
  .env.example
  packages/
    shared/
      tsconfig.json
      src/constants/matching.ts     # weights & matrices
      src/types/index.ts
  apps/
    bot/
      package.json
      tsconfig.json
      src/index.ts
      src/handlers/onboarding.ts
      src/handlers/profile.ts
      src/handlers/match.ts
      src/handlers/payments.ts
      src/handlers/scheduling.ts
      src/services/scoring.ts
      src/services/pairing.ts
      src/services/availability.ts
      src/queue/bull.ts
      src/queue/jobs/dailyMatch.ts
      src/lib/prisma.ts
      src/lib/logger.ts
    next/
      package.json
      tsconfig.json
      next.config.js
      app/(marketing)/page.tsx
      app/dashboard/page.tsx
      app/api/match/trigger/route.ts
      app/api/health/route.ts
      app/api/bot/route.ts           # optional webhook (disabled by default)
      src/lib/prisma.ts
      src/lib/auth.ts (stub)
      src/lib/validators.ts
      src/lib/payments.ts
      src/components/*
  prisma/
    schema.prisma
    migrations/* (auto-generated)
    seed.ts
  tests/
    scoring.spec.ts
    pairing.spec.ts
    payments.spec.ts
  .eslintrc.cjs
  .prettierrc

Critical implementation details

Prisma schema: replicate the models/enums/relations from the spec exactly (names, indices, composite PKs). 



Scoring: ship jaccard(), industry/profession/goal adjacency lookups, availability overlap (minutes / target duration), distance penalty, diversity boost, repeat penalty. Weights from the spec defaults; vibe map from the spec’s table. Configurable via packages/shared/src/constants/matching.ts. 



Payments: use grammY sendInvoice with Stars; store Telegram charge id; idempotency on payment save; update Subscription/entitlements. Implement /terms and a simple privacy page.

Queues: QueueScheduler enabled; daily cron (UTC) approximating 09:00 Asia/Nicosia for initial launch; buckets for other timezones.

Security: rate-limit actions via Redis; validate all text inputs with Zod; sanitize custom tags; enforce blocklists and same-company avoidance if toggled.

Logging/metrics: Pino logs; timing for match pipeline; simple counters exposed via /api/health.

Environment variables
BOT_TOKEN=
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coffee
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:3000
WEBHOOK_SECRET=dev-only

Package scripts

Root:

"dev": "pnpm -C apps/next dev & pnpm -C apps/bot dev"

"build": "pnpm -C apps/next build && pnpm -C apps/bot build"

"migrate": "prisma migrate dev"

"seed": "ts-node prisma/seed.ts"

"lint": "eslint ."

"test": "vitest run"

Bot:

"dev": "ts-node src/index.ts" (long polling by default; webhook code commented)

Next:

usual next dev/build/start

Tests (must pass)

scoring.spec.ts: unit tests for Jaccard, vibe weight mapping, cooldown, and distance penalty.

pairing.spec.ts: greedy matching respects reciprocity, no same pair within cooldown.

payments.spec.ts: invoice payload parsing + idempotent payment write.

Docker & local run

docker-compose.yml with postgres:16 and redis:7

README with:

pnpm i

docker compose up -d

pnpm migrate && pnpm seed

Set BOT_TOKEN

pnpm dev

Optional: set webhook to APP_URL/api/bot (instructions included)

Non-negotiable acceptance criteria

I can onboard, edit profile, and run /match to enqueue myself.

Daily job creates pairs using the spec scoring & weights; I can confirm a slot and the bot creates a 2-person chat with intro cards (1-liner + topics). 



Weekly free limit enforced; paywalls appear at the moments described in the spec; paying in Stars instantly unlocks features. 



Prisma migrations run clean; seed works; tests pass.

Now output the full repository (file tree + all files). No commentary.