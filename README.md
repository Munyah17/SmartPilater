# SmartPilater

**Digital fare collection for Zimbabwean kombis. Seke 1 & 2 paElo.**

SmartPilater replaces cash on minibus taxis while preserving the workflow every
crew already knows. The conductor taps a fare, the terminal shows a dynamic QR,
the passenger pays from EcoCash, InnBucks, OneMoney, Omari, ZIPIT or card, a
verifiable receipt prints, and the money lands in the fleet account with fees
itemised. Built to scale from one kombi on Seke Road to national fleets.

| Surface | Route | Who uses it |
|---|---|---|
| Landing | `/` | Everyone |
| Terminal | `/terminal` | Conductors (mounted Android device, kiosk mode) |
| Fleet console | `/dashboard` | Fleet owners and admins |
| Ticket verification | `/verify` and `/verify/[code]` | Inspectors, passengers, anyone |
| Sign in | `/login` | All staff roles |

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style UI ·
Framer Motion · TanStack Query · Supabase (Postgres, Auth, Storage, RLS) ·
Recharts · React Hook Form + Zod · PWA (service worker, IndexedDB, Background
Sync) · ESC/POS thermal printing · Netlify.

## Quick start

```bash
git clone https://github.com/Munyah17/SmartPilater.git
cd SmartPilater
npm install
npm run dev
```

Open http://localhost:3000. **With no environment variables the app runs in
demo mode**: a deterministic in-memory fleet (Seke Express, Chitungwiza) with
three routes, six vehicles and three weeks of ticket history. Every screen is
fully interactive, including the terminal payment flow with a simulated
gateway that approves, fails and expires the way real rails do.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration and seed in the SQL editor (or via the CLI):
   ```bash
   supabase db push          # applies supabase/migrations/0001_init.sql
   psql < supabase/seed.sql  # development data (never in production)
   ```
3. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Settings → API.
4. Restart the dev server. Auth and data now go through Supabase; demo mode
   switches itself off.

The schema ships with row-level security on every tenant table, audit
triggers on money movement, reporting views, and a `verify_ticket` RPC that
exposes only what a printed receipt already shows.

## Deploying (Netlify)

The repo includes `netlify.toml`. In Netlify:

1. **Add new site → Import an existing project → GitHub → `Munyah17/SmartPilater`.**
2. Build command and publish directory are picked up from `netlify.toml`.
3. Add the environment variables from `.env.example` under Site settings →
   Environment variables (demo mode works with none set).
4. Every push to `main` triggers a deployment.

## Offline-first design

Terminals ride through dead zones daily, so connectivity is treated as an
optimisation rather than a requirement:

- Every ticket is written to **IndexedDB first** with a device-generated UUID.
- The **sync engine** drains the queue on reconnect, on visibility change, on
  an interval, and via the service worker's **Background Sync** tag. Replays
  are safe because tickets are idempotent by id (the server upserts).
- The **service worker** serves the app shell offline, so a reboot in a dead
  zone still opens straight into `/terminal`.
- Offline state is always visible: the status bar badge and the "selling
  offline" notice keep the crew informed without stopping them.

## Payments architecture

All gateways sit behind one `PaymentAdapter` interface
(`src/lib/payments/types.ts`): `createIntent → checkStatus → refund`. The
registry (`src/lib/payments/registry.ts`) maps provider ids to
implementations; in demo mode every id resolves to a simulated adapter with
realistic timing. Adding a rail is one new file and one registry line — the
terminal never changes.

## Project structure

```
src/
  app/                 Routes (landing, terminal, dashboard, verify, login)
  components/
    ui/                Design-system primitives (button, card, dialog, …)
    terminal/          Status bar, payment flow, terminal state machine
    dashboard/         Shell, charts, stat cards
    landing/           Marketing page
  lib/
    payments/          Adapter contract, registry, simulated provider
    offline/           IndexedDB store + sync engine
    receipts/          ESC/POS builder for 58mm thermal printers
    supabase/          Browser + server clients (null in demo mode)
    demo-data.ts       Deterministic demo fleet
  types/               Shared domain model (mirrors the SQL schema)
supabase/
  migrations/          0001_init.sql — full schema, RLS, triggers, views
  seed.sql             Development data
docs/                  Architecture and deployment notes
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Roles

Super admin (platform), fleet owner (own vehicles, staff, revenue, devices),
driver (assigned vehicle and summaries), conductor (terminal operator) and
device (the terminal itself, authenticating with its own identity). RBAC
lives in `user_roles` and is enforced by RLS policies, not client code.

## Roadmap-ready

The schema and adapter layers already leave room for NFC fare cards, commuter
passes, school transport accounts, intercity coaches, parcel payments, live
vehicle tracking and multi-currency deployments without structural rework.

---

Built with care for the people who move Zimbabwe.
