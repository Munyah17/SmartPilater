-- ============================================================================
-- SmartPilater · Public pay, multi-currency & EcoCash Instant Payment
--
-- Adds:
--   * organizations.currency        — fleet-chosen transacting currency
--   * routes.public_fare_cents      — flat self-service fare (final destination)
--   * tickets.channel               — 'terminal' (staff) vs 'public' (self-serve)
--   * tickets.currency / payer_phone
--   * transactions.client_correlator — EIP idempotency / lookup key
--   * payment_events                — durable webhook (notifyUrl) log
-- ============================================================================

create type sale_channel as enum ('terminal', 'public');
create type currency_code as enum ('USD', 'ZWG');

-- Fleet companies choose USD or ZiG; USD is the street default, parastatals
-- run ZWG (and every operator must legally be able to accept it).
alter table organizations
  add column currency currency_code not null default 'USD';

-- The flat fare charged on self-service public pay: the price to the route's
-- final destination. Custom fares and early drop-offs require a signed-in
-- conductor or driver on the terminal.
alter table routes
  add column public_fare_cents integer check (public_fare_cents > 0);

alter table tickets
  add column channel sale_channel not null default 'terminal',
  add column currency currency_code not null default 'USD',
  add column payer_phone text;

alter table transactions
  add column client_correlator text;
create unique index transactions_correlator_idx
  on transactions (client_correlator) where client_correlator is not null;

-- ----------------------------------------------------------------------------
-- payment_events — raw provider callbacks (EcoCash notifyUrl et al.)
-- Written by the service role from the webhook route handler; polling remains
-- the UX source of truth, this is the settlement-grade audit trail.
-- ----------------------------------------------------------------------------
create table payment_events (
  id bigint generated always as identity primary key,
  provider text not null references payment_providers (id),
  correlator text not null,
  status payment_status not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
create index payment_events_correlator_idx on payment_events (correlator, received_at desc);

alter table payment_events enable row level security;

-- Only the platform (service role bypasses RLS) writes events; super admins
-- may read them for support.
create policy payment_events_super_admin_read
  on payment_events for select
  using (is_super_admin());
