-- ============================================================================
-- SmartPilater · Initial schema
-- Digital fare collection for Zimbabwean kombis.
--
-- Conventions
--   * Money is integer cents (USD unless stated) — never floats.
--   * Every tenant-scoped table carries org_id and is protected by RLS.
--   * Terminals authenticate as devices (role = 'device') with a device JWT;
--     their writes are constrained to their own org and terminal id.
--   * updated_at is maintained by trigger on every mutable table.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type app_role as enum ('super_admin', 'fleet_owner', 'driver', 'conductor', 'device');
create type payment_status as enum ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded');
create type ticket_status as enum ('valid', 'used', 'refunded', 'void');
create type terminal_status as enum ('online', 'offline', 'degraded');
create type settlement_status as enum ('pending', 'processing', 'paid');
create type alert_severity as enum ('info', 'warning', 'critical');
create type device_event_kind as enum (
  'boot', 'shutdown', 'low_battery', 'offline', 'online', 'printer_error',
  'payment_failed', 'update_available', 'update_applied', 'kiosk_breach', 'diagnostics'
);

-- ----------------------------------------------------------------------------
-- organizations — fleet owners (tenants)
-- ----------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text not null,
  registration_number text,
  phone text,
  email text,
  city text,
  settlement_bank_account text,           -- masked at the API layer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table organizations is 'Fleet owners; the tenant boundary for RLS.';

-- ----------------------------------------------------------------------------
-- users / roles
-- profiles extends Supabase auth.users; role assignments are per-org.
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references organizations (id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id smallint primary key,
  key app_role unique not null,
  description text not null
);

insert into roles (id, key, description) values
  (1, 'super_admin', 'Platform operator: all organizations, devices and settings'),
  (2, 'fleet_owner', 'Owns vehicles, staff, routes and revenue for one organization'),
  (3, 'driver',      'Assigned vehicle, daily summary, trip history'),
  (4, 'conductor',   'Primary terminal operator'),
  (5, 'device',      'A mounted terminal authenticating as itself');

create table user_roles (
  user_id uuid not null references profiles (id) on delete cascade,
  role_id smallint not null references roles (id),
  org_id uuid references organizations (id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_org_idx on user_roles (org_id);

-- Helper: does the current JWT belong to a member of the org?
create or replace function is_org_member(check_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and (org_id = check_org or role_id = 1)
  );
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role_id = 1);
$$;

-- ----------------------------------------------------------------------------
-- routes / stops / fares
-- ----------------------------------------------------------------------------
create table routes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  origin text not null,
  destination text not null,
  distance_km numeric(6, 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routes_org_idx on routes (org_id);

create table route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  name text not null,
  sequence smallint not null,
  unique (route_id, sequence)
);

create table route_fares (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  label text not null,                     -- e.g. Local, Main Rank, Extended
  description text,
  amount_cents integer not null check (amount_cents > 0),
  sort_order smallint not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create index route_fares_route_idx on route_fares (route_id) where active;

-- ----------------------------------------------------------------------------
-- vehicles / staff
-- ----------------------------------------------------------------------------
create table drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  full_name text not null,
  phone text,
  national_id text,
  licence_number text,
  photo_url text,
  active boolean not null default true,
  joined_at date default current_date,
  updated_at timestamptz not null default now()
);
create index drivers_org_idx on drivers (org_id);

create table conductors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  full_name text not null,
  phone text,
  national_id text,
  photo_url text,
  active boolean not null default true,
  joined_at date default current_date,
  updated_at timestamptz not null default now()
);
create index conductors_org_idx on conductors (org_id);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  registration text not null unique,
  model text,
  seats smallint check (seats between 4 and 80),
  insurance_expiry date,
  inspection_expiry date,
  route_id uuid references routes (id) on delete set null,
  driver_id uuid references drivers (id) on delete set null,
  conductor_id uuid references conductors (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_org_idx on vehicles (org_id);

-- ----------------------------------------------------------------------------
-- terminals & telemetry
-- ----------------------------------------------------------------------------
create table terminals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  serial text not null unique,
  label text,
  vehicle_id uuid references vehicles (id) on delete set null,
  device_user_id uuid references profiles (id) on delete set null,  -- the device identity
  software_version text,
  android_version text,
  kiosk_mode boolean not null default true,
  provisioned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index terminals_org_idx on terminals (org_id);

create table terminal_health (
  id bigint generated always as identity primary key,
  terminal_id uuid not null references terminals (id) on delete cascade,
  status terminal_status not null,
  battery_percent smallint check (battery_percent between 0 and 100),
  signal_bars smallint check (signal_bars between 0 and 4),
  gps_fix boolean,
  printer_ok boolean,
  storage_free_percent smallint,
  reported_at timestamptz not null default now()
);
create index terminal_health_latest_idx on terminal_health (terminal_id, reported_at desc);

create table device_events (
  id bigint generated always as identity primary key,
  terminal_id uuid not null references terminals (id) on delete cascade,
  kind device_event_kind not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index device_events_terminal_idx on device_events (terminal_id, created_at desc);

-- ----------------------------------------------------------------------------
-- trips / tickets / payments
-- ----------------------------------------------------------------------------
create table trips (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id),
  route_id uuid not null references routes (id),
  driver_id uuid references drivers (id),
  conductor_id uuid references conductors (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);
create index trips_org_started_idx on trips (org_id, started_at desc);

create table payment_providers (
  id text primary key,                     -- 'ecocash', 'innbucks', …
  display_name text not null,
  flow text not null check (flow in ('qr', 'push', 'card')),
  fee_basis_points integer not null default 200,
  active boolean not null default true
);

insert into payment_providers (id, display_name, flow) values
  ('ecocash',    'EcoCash',    'push'),
  ('onemoney',   'OneMoney',   'push'),
  ('innbucks',   'InnBucks',   'qr'),
  ('omari',      'Omari',      'qr'),
  ('paynow',     'Paynow',     'qr'),
  ('pos2u',      'POS2U',      'card'),
  ('visa',       'Visa',       'card'),
  ('mastercard', 'Mastercard', 'card'),
  ('zipit',      'ZIPIT',      'qr');

create table tickets (
  id uuid primary key,                     -- generated ON DEVICE for offline idempotency
  org_id uuid not null references organizations (id) on delete cascade,
  trip_id uuid references trips (id) on delete set null,
  vehicle_id uuid not null references vehicles (id),
  route_id uuid not null references routes (id),
  terminal_id uuid not null references terminals (id),
  fare_id uuid references route_fares (id),
  destination text,
  amount_cents integer not null check (amount_cents > 0),
  provider text not null references payment_providers (id),
  status ticket_status not null default 'valid',
  payment_status payment_status not null default 'pending',
  reference text,
  issued_at timestamptz not null,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_org_issued_idx on tickets (org_id, issued_at desc);
create index tickets_reference_idx on tickets (reference);
create index tickets_paid_idx on tickets (org_id, issued_at) where payment_status = 'paid';

create table payment_attempts (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references tickets (id) on delete cascade,
  provider text not null references payment_providers (id),
  reference text not null,
  status payment_status not null default 'pending',
  failure_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index payment_attempts_ticket_idx on payment_attempts (ticket_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id),
  org_id uuid not null references organizations (id) on delete cascade,
  provider text not null references payment_providers (id),
  amount_cents integer not null,
  fee_cents integer not null default 0,
  status payment_status not null,
  provider_reference text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  settlement_id uuid
);
create index transactions_org_created_idx on transactions (org_id, created_at desc);
create index transactions_settlement_idx on transactions (settlement_id);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_cents bigint not null default 0,
  fees_cents bigint not null default 0,
  net_cents bigint not null default 0,
  transaction_count integer not null default 0,
  status settlement_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index settlements_org_idx on settlements (org_id, period_end desc);

alter table transactions
  add constraint transactions_settlement_fk
  foreign key (settlement_id) references settlements (id) on delete set null;

-- ----------------------------------------------------------------------------
-- platform tables
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  terminal_id uuid references terminals (id) on delete cascade,
  severity alert_severity not null default 'info',
  title text not null,
  body text,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_org_idx on notifications (org_id, created_at desc);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  org_id uuid,
  action text not null,                    -- e.g. 'vehicle.update', 'terminal.reboot'
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index audit_logs_org_idx on audit_logs (org_id, created_at desc);

create table software_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  channel text not null default 'stable' check (channel in ('stable', 'beta')),
  notes text,
  artifact_url text,
  mandatory boolean not null default false,
  released_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations (id) on delete cascade,
  opened_by uuid references profiles (id),
  subject text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table configuration_settings (
  org_id uuid not null references organizations (id) on delete cascade,
  key text not null,                       -- e.g. 'terminal.success_timeout_seconds'
  value jsonb not null,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now(),
  primary key (org_id, key)
);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','routes','route_fares','drivers','conductors',
    'vehicles','terminals','trips','tickets','support_tickets'
  ] loop
    execute format(
      'create trigger %I_touch before update on %I for each row execute function touch_updated_at()',
      t, t
    );
  end loop;
end $$;

-- Audit trigger for the money-critical tables.
create or replace function write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, org_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    coalesce(new.org_id, old.org_id),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce(new.id::text, old.id::text),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger tickets_audit after insert or update or delete on tickets
  for each row execute function write_audit();
create trigger transactions_audit after insert or update or delete on transactions
  for each row execute function write_audit();
create trigger settlements_audit after update on settlements
  for each row execute function write_audit();

-- ----------------------------------------------------------------------------
-- Reporting views
-- ----------------------------------------------------------------------------
create view v_daily_revenue as
select
  org_id,
  issued_at::date as day,
  count(*) as tickets,
  sum(amount_cents) as revenue_cents
from tickets
where payment_status = 'paid'
group by org_id, issued_at::date;

create view v_route_revenue as
select t.org_id, t.route_id, r.name as route_name,
       count(*) as tickets, sum(t.amount_cents) as revenue_cents
from tickets t join routes r on r.id = t.route_id
where t.payment_status = 'paid'
group by t.org_id, t.route_id, r.name;

create view v_provider_revenue as
select org_id, provider, count(*) as tickets, sum(amount_cents) as revenue_cents
from tickets
where payment_status = 'paid'
group by org_id, provider;

create view v_terminal_last_health as
select distinct on (terminal_id)
  terminal_id, status, battery_percent, signal_bars, gps_fix, printer_ok,
  storage_free_percent, reported_at
from terminal_health
order by terminal_id, reported_at desc;

-- Public, rate-limited ticket verification: exposes only what a receipt shows.
create or replace function verify_ticket(ticket_id uuid)
returns table (
  paid boolean,
  vehicle_registration text,
  route_name text,
  destination text,
  amount_cents integer,
  provider text,
  issued_at timestamptz,
  ticket_status ticket_status
) language sql stable security definer set search_path = public as $$
  select
    t.payment_status = 'paid',
    v.registration,
    r.name,
    t.destination,
    t.amount_cents,
    t.provider,
    t.issued_at,
    t.status
  from tickets t
  join vehicles v on v.id = t.vehicle_id
  join routes r on r.id = t.route_id
  where t.id = ticket_id;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table routes enable row level security;
alter table route_stops enable row level security;
alter table route_fares enable row level security;
alter table drivers enable row level security;
alter table conductors enable row level security;
alter table vehicles enable row level security;
alter table terminals enable row level security;
alter table terminal_health enable row level security;
alter table device_events enable row level security;
alter table trips enable row level security;
alter table tickets enable row level security;
alter table payment_attempts enable row level security;
alter table transactions enable row level security;
alter table settlements enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table software_releases enable row level security;
alter table support_tickets enable row level security;
alter table configuration_settings enable row level security;

-- Org members read their own tenant; super admins read everything.
create policy org_read on organizations for select using (is_org_member(id));
create policy org_admin_write on organizations for all using (is_super_admin());

create policy profiles_self on profiles for select using (id = auth.uid() or is_org_member(org_id));
create policy profiles_self_update on profiles for update using (id = auth.uid());

create policy user_roles_read on user_roles for select
  using (user_id = auth.uid() or is_super_admin());

-- Tenant-scoped read/write pattern, repeated per table.
create policy routes_rw on routes for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy route_stops_rw on route_stops for all
  using (exists (select 1 from routes r where r.id = route_id and is_org_member(r.org_id)));
create policy route_fares_rw on route_fares for all
  using (exists (select 1 from routes r where r.id = route_id and is_org_member(r.org_id)));
create policy drivers_rw on drivers for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy conductors_rw on conductors for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy vehicles_rw on vehicles for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy terminals_rw on terminals for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy trips_rw on trips for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy tickets_rw on tickets for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy payment_attempts_rw on payment_attempts for all
  using (exists (select 1 from tickets t where t.id = ticket_id and is_org_member(t.org_id)));
create policy transactions_read on transactions for select using (is_org_member(org_id));
create policy settlements_read on settlements for select using (is_org_member(org_id));
create policy terminal_health_rw on terminal_health for all
  using (exists (select 1 from terminals t where t.id = terminal_id and is_org_member(t.org_id)));
create policy device_events_rw on device_events for all
  using (exists (select 1 from terminals t where t.id = terminal_id and is_org_member(t.org_id)));
create policy notifications_rw on notifications for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy audit_read on audit_logs for select using (is_org_member(org_id) or is_super_admin());
create policy releases_read on software_releases for select using (true);
create policy releases_admin on software_releases for all using (is_super_admin());
create policy support_rw on support_tickets for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy config_rw on configuration_settings for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
