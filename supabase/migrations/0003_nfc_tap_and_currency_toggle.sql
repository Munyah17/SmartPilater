-- ============================================================================
-- SmartPilater · NFC/RFID tap payments & per-fleet currency toggle
--
-- Adds:
--   * payment_providers row for nfc_tap (contactless bank card / RFID commuter
--     card via a mounted reader — see docs/hardware note on Android POS units
--     with built-in NFC readers)
--   * tickets.card_id            — card UID for nfc_tap payments
--   * organizations.enabled_currencies — which currencies the fleet accepts
--     at all (USD, ZWG or both); organizations.currency (added in 0002)
--     becomes "the default", used for self-service public pay where the
--     passenger never chooses. Staff pick per sale when more than one
--     currency is enabled.
-- ============================================================================

-- 'tap' joins 'qr' | 'push' | 'card' as a distinct contactless NFC/RFID flow.
alter table payment_providers drop constraint payment_providers_flow_check;
alter table payment_providers
  add constraint payment_providers_flow_check check (flow in ('qr', 'push', 'card', 'tap'));

insert into payment_providers (id, display_name, flow) values
  ('nfc_tap', 'Tap Card', 'tap')
on conflict (id) do nothing;

alter table tickets
  add column card_id text;

alter table organizations
  add column enabled_currencies currency_code[] not null default array['USD']::currency_code[];

-- The default currency must itself be one of the accepted ones.
alter table organizations
  add constraint organizations_currency_is_enabled
  check (currency = any (enabled_currencies));

comment on column organizations.enabled_currencies is
  'Currencies the fleet company chooses to accept — never chosen by the passenger. Public pay always charges organizations.currency; staff may pick per sale when more than one is enabled.';
