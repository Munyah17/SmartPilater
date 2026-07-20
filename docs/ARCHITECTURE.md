# SmartPilater — Architecture

## System overview

```
┌──────────────┐     offline queue      ┌─────────────────────────┐
│ Terminal app │ ──── IndexedDB ──────► │ Supabase                │
│ (/terminal)  │      sync engine       │  Postgres + RLS         │
└──────────────┘                        │  Auth (JWT, roles)      │
        │                               │  Storage (photos, APKs) │
        │ payment intent                └───────────┬─────────────┘
        ▼                                           │
┌──────────────────────┐                            │
│ Payment adapter layer│  EcoCash · OneMoney ·      │
│ (registry pattern)   │  InnBucks · Omari ·        ▼
└──────────────────────┘  Paynow · POS2U ·   ┌──────────────┐
                          Visa/MC · ZIPIT    │ Fleet console │
                                             │ (/dashboard)  │
                                             └──────────────┘
```

Three principles drive every decision:

1. **The device is the source of truth at the moment of sale.** Ticket ids
   are UUIDs generated on the terminal; the backend upserts. This makes
   offline selling and replay-safe sync trivial rather than heroic.
2. **Providers are plugins.** Nothing outside `src/lib/payments/` knows what
   EcoCash is. The `PaymentAdapter` interface (`createIntent`, `checkStatus`,
   `refund`) is the entire contract.
3. **Tenancy is enforced in the database.** Every tenant table carries
   `org_id`; RLS policies call `is_org_member()`. Client code cannot opt out.

## Frontend layers

- `app/` — thin route files; Next 16 App Router with async params.
- `components/ui/` — shadcn-style primitives over Radix; all theming flows
  through CSS variables in `globals.css` (royal blue / white, charcoal dark).
- `components/{terminal,dashboard,landing,verify}/` — feature components.
- `lib/` — framework-free logic (payments, offline, receipts, formatting).
  Nothing in `lib/` imports React, which keeps it testable and portable.
- `types/domain.ts` — the single vocabulary, mirroring the SQL schema.

## Terminal state machine

`home → waiting → success | failed → home`

- `waiting` creates the ticket (IndexedDB, `syncState: "queued"`), asks the
  adapter for an intent, renders the QR, and polls `checkStatus` at 1 Hz
  under a 90-second countdown.
- `success` persists the paid state, renders the on-screen receipt, hands
  ESC/POS bytes to the printer bridge, and auto-returns after a configurable
  timeout.
- `failed` keeps the fare and destination so retry is one tap.

## Offline sync

`lib/offline/db.ts` owns the IndexedDB schema (tickets by `syncState` and
`issuedAt`). `lib/offline/sync.ts` drains the queue with exponential backoff,
triggered by reconnect, visibility, an interval, and the service worker's
Background Sync tag. Conflict resolution is last-write-wins per ticket id,
which is safe because a ticket is only ever mutated by the terminal that
issued it.

## Receipts

`lib/receipts/escpos.ts` renders a ticket to raw ESC/POS bytes (58mm) with a
verification QR. Transport is host-provided: an Android kiosk shell exposes
`window.SmartPilaterPrinter.print(base64)`; Bluetooth sockets plug in the
same way. The web app never blocks on printing.

## Database

See `supabase/migrations/0001_init.sql`. Highlights:

- Integer-cent money everywhere; no floats.
- `tickets.id` is client-generated for idempotent offline sync.
- Audit triggers on `tickets`, `transactions`, `settlements`.
- Reporting views (`v_daily_revenue`, `v_route_revenue`,
  `v_provider_revenue`, `v_terminal_last_health`) back the dashboard.
- `verify_ticket(uuid)` is a `security definer` RPC exposing only
  receipt-visible fields to the public verification page.

## Extension points

| Future feature | Where it lands |
|---|---|
| NFC cards / commuter passes | new `PaymentAdapter` + `payment_providers` row |
| Student / pensioner discounts | `route_fares` rows + a `fare_rules` table |
| School & corporate accounts | new `accounts` table joined from `tickets` |
| Live tracking / arrival ETAs | `device_events` already carries GPS payloads |
| Multi-currency | `currency` column on `tickets`/`transactions` (all money already integer) |
| Passenger app | reads the same views; no schema change |
