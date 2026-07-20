-- ============================================================================
-- SmartPilater · Seed data (development only — do not run in production)
-- A single fleet, "Seke Express", mirroring the in-app demo dataset.
-- ============================================================================

insert into organizations (id, name, trading_name, registration_number, phone, email, city)
values (
  '00000000-0000-4000-8000-000000000001',
  'Seke Express (Pvt) Ltd', 'Seke Express', 'PVT 4482/2023',
  '+263 77 234 5678', 'ops@sekeexpress.co.zw', 'Chitungwiza'
);

-- Routes
insert into routes (id, org_id, name, origin, destination, distance_km) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
   'Seke 1 — Harare CBD', 'Seke Unit A', 'Fourth Street Rank', 27),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001',
   'Seke 2 — Copacabana', 'Seke Unit L', 'Copacabana Rank', 25),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001',
   'Chikwanha — Town (Express)', 'Chikwanha', 'Market Square', 23);

insert into route_stops (route_id, name, sequence) values
  ('00000000-0000-4000-8000-000000000101', 'Seke Unit A', 1),
  ('00000000-0000-4000-8000-000000000101', 'Chikwanha', 2),
  ('00000000-0000-4000-8000-000000000101', 'Makoni', 3),
  ('00000000-0000-4000-8000-000000000101', 'Hunyani Bridge', 4),
  ('00000000-0000-4000-8000-000000000101', 'Mbudzi Roundabout', 5),
  ('00000000-0000-4000-8000-000000000101', 'Simon Mazorodze Rd', 6),
  ('00000000-0000-4000-8000-000000000101', 'Fourth Street Rank', 7),
  ('00000000-0000-4000-8000-000000000102', 'Seke Unit L', 1),
  ('00000000-0000-4000-8000-000000000102', 'Zengeza 4', 2),
  ('00000000-0000-4000-8000-000000000102', 'Chigovanyika', 3),
  ('00000000-0000-4000-8000-000000000102', 'St Mary''s', 4),
  ('00000000-0000-4000-8000-000000000102', 'Mbudzi Roundabout', 5),
  ('00000000-0000-4000-8000-000000000102', 'Copacabana Rank', 6),
  ('00000000-0000-4000-8000-000000000103', 'Chikwanha', 1),
  ('00000000-0000-4000-8000-000000000103', 'Mbudzi Roundabout', 2),
  ('00000000-0000-4000-8000-000000000103', 'Market Square', 3);

insert into route_fares (route_id, label, description, amount_cents, sort_order) values
  ('00000000-0000-4000-8000-000000000101', 'Local', 'Within Seke units', 100, 1),
  ('00000000-0000-4000-8000-000000000101', 'Main Rank', 'Seke to Fourth Street', 150, 2),
  ('00000000-0000-4000-8000-000000000101', 'Extended', 'Beyond the rank', 200, 3),
  ('00000000-0000-4000-8000-000000000101', 'Halfway', 'Mbudzi drop-off', 100, 4),
  ('00000000-0000-4000-8000-000000000102', 'Local', 'Within Zengeza', 100, 1),
  ('00000000-0000-4000-8000-000000000102', 'Copacabana', 'Full route', 150, 2),
  ('00000000-0000-4000-8000-000000000103', 'Express', 'Chikwanha to town', 150, 1);

-- Staff
insert into drivers (id, org_id, full_name, phone, national_id, licence_number) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Tendai Moyo', '+263 77 101 2001', '63-482913 K 42', 'DL 48213'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Blessing Chirwa', '+263 77 101 2002', '63-517204 K 18', 'DL 51930'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Farai Ncube', '+263 77 101 2003', '63-604118 K 77', 'DL 60412');

insert into conductors (id, org_id, full_name, phone, national_id) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 'Tatenda Marufu', '+263 78 202 3001', '63-712845 T 31'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'Panashe Zhou', '+263 78 202 3002', '63-693210 T 55'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', 'Tinashe Chikafu', '+263 78 202 3003', '63-581472 T 09');

-- Vehicles
insert into vehicles (id, org_id, registration, model, seats, insurance_expiry, inspection_expiry, route_id, driver_id, conductor_id) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001',
   'AEC 4521', 'Toyota Quantum', 15, '2026-11-04', '2026-09-15',
   '00000000-0000-4000-8000-000000000101',
   '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001',
   'AFB 8834', 'Toyota Hiace', 18, '2026-10-08', '2026-08-19',
   '00000000-0000-4000-8000-000000000102',
   '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000302'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000001',
   'ADQ 1290', 'Nissan Caravan', 15, '2026-12-01', '2026-09-30',
   '00000000-0000-4000-8000-000000000103',
   '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000303');

-- Terminals
insert into terminals (id, org_id, serial, label, vehicle_id, software_version, android_version) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001',
   'SPT-24-1000', 'Terminal AEC 4521', '00000000-0000-4000-8000-000000000401', '1.4.0', '13'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001',
   'SPT-24-1007', 'Terminal AFB 8834', '00000000-0000-4000-8000-000000000402', '1.4.0', '12'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000001',
   'SPT-24-1014', 'Terminal ADQ 1290', '00000000-0000-4000-8000-000000000403', '1.3.2', '11');

insert into terminal_health (terminal_id, status, battery_percent, signal_bars, gps_fix, printer_ok, storage_free_percent) values
  ('00000000-0000-4000-8000-000000000501', 'online', 87, 4, true, true, 62),
  ('00000000-0000-4000-8000-000000000502', 'online', 54, 3, true, true, 48),
  ('00000000-0000-4000-8000-000000000503', 'offline', 12, 0, false, false, 71);

insert into software_releases (version, channel, notes, mandatory) values
  ('1.4.0', 'stable', 'Faster QR rendering, InnBucks deep links, printer watchdog.', false),
  ('1.3.2', 'stable', 'Patch: reconnect loop fix for degraded networks.', false);

-- Sample paid tickets (a tiny slice; realistic volume comes from terminals)
insert into tickets (id, org_id, vehicle_id, route_id, terminal_id, destination, amount_cents, provider, payment_status, reference, issued_at) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000101',
   '00000000-0000-4000-8000-000000000501', 'Fourth Street', 150, 'ecocash', 'paid', 'SP100001', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000101',
   '00000000-0000-4000-8000-000000000501', 'Makoni', 100, 'innbucks', 'paid', 'SP100002', now() - interval '1 hour'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000102',
   '00000000-0000-4000-8000-000000000502', 'Copacabana', 150, 'omari', 'failed', 'SP100003', now() - interval '30 minutes');

insert into transactions (ticket_id, org_id, provider, amount_cents, fee_cents, status, provider_reference) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'ecocash', 150, 3, 'paid', 'ECO-9F31KX'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', 'innbucks', 100, 2, 'paid', 'INN-77Q2ZL');
