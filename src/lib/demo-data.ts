/**
 * Demo dataset for SmartPilater.
 *
 * Until a Supabase project is connected (see README), the app runs in demo
 * mode against this deterministic in-memory fleet: a Chitungwiza operator
 * running kombis between Seke and Harare CBD. The shapes are identical to
 * what the Supabase repositories return, so swapping the data source does
 * not touch a single screen.
 */

import type {
  DashboardSnapshot,
  DeviceAlert,
  FarePreset,
  Organization,
  PaymentProviderId,
  Settlement,
  StaffMember,
  Terminal,
  Ticket,
  Transaction,
  TransportRoute,
  Vehicle,
} from "@/types/domain";

/** Seeded PRNG so every render of demo data is identical. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260717);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function between(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export const demoOrg: Organization = {
  id: "org-seke-express",
  name: "Seke Express (Pvt) Ltd",
  tradingName: "Seke Express",
  registrationNumber: "PVT 4482/2023",
  phone: "+263 77 234 5678",
  email: "ops@sekeexpress.co.zw",
  city: "Chitungwiza",
  currency: "USD",
  createdAt: "2023-04-12T08:00:00Z",
};

export const demoRoutes: TransportRoute[] = [
  {
    id: "route-seke1",
    orgId: demoOrg.id,
    name: "Seke 1 — Harare CBD",
    origin: "Seke Unit A",
    destination: "Fourth Street Rank",
    distanceKm: 27,
    publicFareCents: 150,
    active: true,
    stops: [
      { id: "s1", name: "Seke Unit A", sequence: 1 },
      { id: "s2", name: "Chikwanha", sequence: 2 },
      { id: "s3", name: "Makoni", sequence: 3 },
      { id: "s4", name: "Hunyani Bridge", sequence: 4 },
      { id: "s5", name: "Mbudzi Roundabout", sequence: 5 },
      { id: "s6", name: "Simon Mazorodze Rd", sequence: 6 },
      { id: "s7", name: "Fourth Street Rank", sequence: 7 },
    ],
  },
  {
    id: "route-seke2",
    orgId: demoOrg.id,
    name: "Seke 2 — Copacabana",
    origin: "Seke Unit L",
    destination: "Copacabana Rank",
    distanceKm: 25,
    publicFareCents: 150,
    active: true,
    stops: [
      { id: "s8", name: "Seke Unit L", sequence: 1 },
      { id: "s9", name: "Zengeza 4", sequence: 2 },
      { id: "s10", name: "Chigovanyika", sequence: 3 },
      { id: "s11", name: "St Mary's", sequence: 4 },
      { id: "s12", name: "Mbudzi Roundabout", sequence: 5 },
      { id: "s13", name: "Copacabana Rank", sequence: 6 },
    ],
  },
  {
    id: "route-townline",
    orgId: demoOrg.id,
    name: "Chikwanha — Town (Express)",
    origin: "Chikwanha",
    destination: "Market Square",
    distanceKm: 23,
    publicFareCents: 100,
    active: true,
    stops: [
      { id: "s14", name: "Chikwanha", sequence: 1 },
      { id: "s15", name: "Mbudzi Roundabout", sequence: 2 },
      { id: "s16", name: "Market Square", sequence: 3 },
    ],
  },
];

export const demoFares: FarePreset[] = [
  {
    id: "fare-local",
    routeId: "route-seke1",
    label: "Local",
    description: "Within Seke units",
    amountCents: 100,
    sortOrder: 1,
    active: true,
  },
  {
    id: "fare-rank",
    routeId: "route-seke1",
    label: "Main Rank",
    description: "Seke to Fourth Street",
    amountCents: 150,
    sortOrder: 2,
    active: true,
  },
  {
    id: "fare-extended",
    routeId: "route-seke1",
    label: "Extended",
    description: "Beyond the rank",
    amountCents: 200,
    sortOrder: 3,
    active: true,
  },
  {
    id: "fare-halfway",
    routeId: "route-seke1",
    label: "Halfway",
    description: "Mbudzi drop-off",
    amountCents: 100,
    sortOrder: 4,
    active: true,
  },
];

const driverNames = [
  "Tendai Moyo",
  "Blessing Chirwa",
  "Farai Ncube",
  "Simba Mutasa",
  "Kudakwashe Dube",
  "Munyaradzi Gumbo",
];

const conductorNames = [
  "Tatenda Marufu",
  "Panashe Zhou",
  "Tinashe Chikafu",
  "Anesu Mapfumo",
  "Takudzwa Sibanda",
  "Learnmore Phiri",
];

const vehicleModels = [
  "Toyota Quantum",
  "Toyota Hiace",
  "Nissan Caravan",
  "Toyota Quantum GL",
];

const plates = ["AEC 4521", "AFB 8834", "ADQ 1290", "AGH 6647", "AEZ 3308", "AFK 9915"];

export const demoDrivers: StaffMember[] = driverNames.map((name, i) => ({
  id: `driver-${i + 1}`,
  orgId: demoOrg.id,
  role: "driver",
  fullName: name,
  phone: `+263 77 ${between(100, 999)} ${between(1000, 9999)}`,
  nationalId: `63-${between(100000, 999999)} K ${between(10, 99)}`,
  licenceNumber: `DL ${between(10000, 99999)}`,
  photoUrl: null,
  assignedVehicleId: `veh-${i + 1}`,
  active: i < 5,
  joinedAt: `202${between(3, 5)}-0${between(1, 9)}-1${between(0, 9)}T08:00:00Z`,
}));

export const demoConductors: StaffMember[] = conductorNames.map((name, i) => ({
  id: `conductor-${i + 1}`,
  orgId: demoOrg.id,
  role: "conductor",
  fullName: name,
  phone: `+263 78 ${between(100, 999)} ${between(1000, 9999)}`,
  nationalId: `63-${between(100000, 999999)} T ${between(10, 99)}`,
  photoUrl: null,
  assignedVehicleId: `veh-${i + 1}`,
  active: i < 5,
  joinedAt: `202${between(3, 5)}-0${between(1, 9)}-2${between(0, 9)}T08:00:00Z`,
}));

export const demoVehicles: Vehicle[] = plates.map((registration, i) => ({
  id: `veh-${i + 1}`,
  orgId: demoOrg.id,
  registration,
  model: pick(vehicleModels),
  seats: pick([15, 18, 22] as const),
  insuranceExpiry: `2026-1${between(0, 1)}-0${between(1, 9)}`,
  inspectionExpiry: `2026-0${between(8, 9)}-1${between(0, 9)}`,
  driverId: `driver-${i + 1}`,
  conductorId: `conductor-${i + 1}`,
  terminalId: `term-${i + 1}`,
  routeId: demoRoutes[i % demoRoutes.length].id,
  active: i < 5,
}));

export const demoTerminals: Terminal[] = demoVehicles.map((vehicle, i) => {
  const online = i !== 4;
  return {
    id: `term-${i + 1}`,
    orgId: demoOrg.id,
    serial: `SPT-24-${1000 + i * 7}`,
    label: `Terminal ${vehicle.registration}`,
    vehicleId: vehicle.id,
    status: online ? (i === 3 ? "degraded" : "online") : "offline",
    batteryPercent: online ? between(35, 98) : between(5, 20),
    signalBars: online ? (pick([2, 3, 3, 4] as const) as 2 | 3 | 4) : 0,
    gpsFix: online,
    printerOk: i !== 3,
    softwareVersion: i === 5 ? "1.3.2" : "1.4.0",
    androidVersion: pick(["11", "12", "13"]),
    storageFreePercent: between(22, 80),
    kioskMode: true,
    lastSyncAt: new Date(Date.now() - (online ? between(1, 20) : between(120, 400)) * 60_000).toISOString(),
    lastSeenAt: new Date(Date.now() - (online ? between(0, 4) : between(120, 400)) * 60_000).toISOString(),
  };
});

const providerWeights: [PaymentProviderId, string, number][] = [
  ["ecocash", "EcoCash", 0.52],
  ["innbucks", "InnBucks", 0.19],
  ["onemoney", "OneMoney", 0.09],
  ["omari", "Omari", 0.08],
  ["zipit", "ZIPIT", 0.05],
  ["visa", "Visa", 0.04],
  ["paynow", "Paynow", 0.03],
];

function weightedProvider(): PaymentProviderId {
  const r = rand();
  let acc = 0;
  for (const [id, , w] of providerWeights) {
    acc += w;
    if (r <= acc) return id;
  }
  return "ecocash";
}

const destinations = [
  "Fourth Street",
  "Copacabana",
  "Makoni",
  "Chikwanha",
  "Mbudzi",
  "Market Square",
  "St Mary's",
  "Zengeza 4",
];

/** ~3 weeks of ticket history, denser at peak hours. */
function buildTickets(): { tickets: Ticket[]; transactions: Transaction[] } {
  const tickets: Ticket[] = [];
  const transactions: Transaction[] = [];
  const now = Date.now();
  let n = 0;

  for (let day = 20; day >= 0; day--) {
    for (let hour = 5; hour <= 21; hour++) {
      // Peak commuter waves: 06:00–09:00 and 16:00–19:00.
      const peak = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
      const count = peak ? between(6, 14) : between(1, 5);
      for (let i = 0; i < count; i++) {
        n++;
        const vehicle = pick(demoVehicles.slice(0, 5));
        const fare = pick(demoFares);
        const provider = weightedProvider();
        const issued = new Date(now - day * 86_400_000);
        issued.setHours(hour, between(0, 59), between(0, 59), 0);
        // A small share of attempts fail or expire, mirroring real gateways.
        const roll = rand();
        const paymentStatus =
          roll > 0.97 ? "failed" : roll > 0.94 ? "expired" : "paid";
        const id = `tkt-${day}-${hour}-${i}-${n}`;
        const ticket: Ticket = {
          id,
          orgId: demoOrg.id,
          tripId: null,
          vehicleId: vehicle.id,
          routeId: vehicle.routeId ?? "route-seke1",
          terminalId: vehicle.terminalId ?? "term-1",
          farePresetId: fare.id,
          destination: pick(destinations),
          amountCents: fare.amountCents,
          provider,
          status: paymentStatus === "paid" ? "valid" : "void",
          paymentStatus,
          reference: `SP${String(100000 + n)}`,
          verifyCode: `${id}`,
          issuedAt: issued.toISOString(),
          syncState: day === 0 && hour >= new Date(now).getHours() - 1 && rand() > 0.7 ? "queued" : "synced",
        };
        tickets.push(ticket);
        if (paymentStatus === "paid") {
          transactions.push({
            id: `txn-${id}`,
            ticketId: id,
            orgId: demoOrg.id,
            provider,
            amountCents: fare.amountCents,
            feeCents: Math.round(fare.amountCents * 0.02),
            status: "paid",
            reference: ticket.reference,
            createdAt: ticket.issuedAt,
            settledAt: day > 1 ? new Date(issued.getTime() + 86_400_000).toISOString() : null,
          });
        }
      }
    }
  }
  return { tickets, transactions };
}

const built = buildTickets();
export const demoTickets = built.tickets;
export const demoTransactions = built.transactions;

export const demoSettlements: Settlement[] = Array.from({ length: 8 }, (_, i) => {
  const gross = between(180000, 420000);
  const fees = Math.round(gross * 0.02);
  const end = new Date(Date.now() - (i + 1) * 7 * 86_400_000);
  const start = new Date(end.getTime() - 6 * 86_400_000);
  return {
    id: `set-${i + 1}`,
    orgId: demoOrg.id,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    grossCents: gross,
    feesCents: fees,
    netCents: gross - fees,
    transactionCount: between(1400, 3200),
    status: i === 0 ? "processing" : "paid",
    paidAt: i === 0 ? null : new Date(end.getTime() + 2 * 86_400_000).toISOString(),
  };
});

export const demoAlerts: DeviceAlert[] = [
  {
    id: "alert-1",
    terminalId: "term-5",
    terminalLabel: "Terminal AEZ 3308",
    kind: "offline",
    message: "Terminal has been offline for 3 hours. Last seen near Mbudzi Roundabout.",
    severity: "critical",
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-2",
    terminalId: "term-4",
    terminalLabel: "Terminal AGH 6647",
    kind: "printer_error",
    message: "Printer reported a paper jam. Receipts are queuing on the device.",
    severity: "warning",
    createdAt: new Date(Date.now() - 55 * 60_000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-3",
    terminalId: "term-5",
    terminalLabel: "Terminal AEZ 3308",
    kind: "low_battery",
    message: "Battery at 12%. Check the vehicle charging cable.",
    severity: "warning",
    createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
    acknowledged: true,
  },
  {
    id: "alert-4",
    terminalId: "term-6",
    terminalLabel: "Terminal AFK 9915",
    kind: "update_available",
    message: "SmartPilater 1.4.0 is available. Schedule an over-the-air update.",
    severity: "info",
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    acknowledged: false,
  },
];

const providerLabels: Record<string, string> = Object.fromEntries(
  providerWeights.map(([id, label]) => [id, label]),
);

export function buildSnapshot(): DashboardSnapshot {
  const now = new Date();
  const todayKey = now.toDateString();
  const yesterdayKey = new Date(now.getTime() - 86_400_000).toDateString();

  const paidToday = demoTickets.filter(
    (t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === todayKey,
  );
  const paidYesterday = demoTickets.filter(
    (t) =>
      t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === yesterdayKey,
  );

  const sum = (arr: Ticket[]) => arr.reduce((acc, t) => acc + t.amountCents, 0);
  const todayRevenue = sum(paidToday);
  const yesterdayRevenue = sum(paidYesterday) || 1;

  const revenueByHour = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 5;
    const inHour = paidToday.filter((t) => new Date(t.issuedAt).getHours() === hour);
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      revenueCents: sum(inHour),
      passengers: inHour.length,
    };
  });

  const revenueByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86_400_000);
    const key = d.toDateString();
    const inDay = demoTickets.filter(
      (t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === key,
    );
    return {
      day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenueCents: sum(inDay),
    };
  });

  const paidAll = demoTickets.filter((t) => t.paymentStatus === "paid");
  const byProvider = new Map<string, number>();
  for (const t of paidAll) {
    byProvider.set(t.provider, (byProvider.get(t.provider) ?? 0) + 1);
  }
  const paymentMix = [...byProvider.entries()]
    .map(([provider, count]) => ({
      provider: provider as PaymentProviderId,
      label: providerLabels[provider] ?? provider,
      share: Math.round((count / paidAll.length) * 100),
    }))
    .sort((a, b) => b.share - a.share);

  const byRoute = new Map<string, { revenueCents: number; trips: number }>();
  for (const t of paidAll) {
    const entry = byRoute.get(t.routeId) ?? { revenueCents: 0, trips: 0 };
    entry.revenueCents += t.amountCents;
    entry.trips += 1;
    byRoute.set(t.routeId, entry);
  }
  const topRoutes = [...byRoute.entries()]
    .map(([routeId, v]) => ({
      routeId,
      name: demoRoutes.find((r) => r.id === routeId)?.name ?? routeId,
      ...v,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  const byVehicle = new Map<string, { revenueCents: number; passengers: number }>();
  for (const t of paidAll) {
    const entry = byVehicle.get(t.vehicleId) ?? { revenueCents: 0, passengers: 0 };
    entry.revenueCents += t.amountCents;
    entry.passengers += 1;
    byVehicle.set(t.vehicleId, entry);
  }
  const topConductors = [...byVehicle.entries()]
    .map(([vehicleId, v]) => {
      const conductor = demoConductors.find(
        (c) => c.assignedVehicleId === vehicleId,
      );
      return {
        id: conductor?.id ?? vehicleId,
        name: conductor?.fullName ?? "Unassigned",
        revenueCents: v.revenueCents,
        passengers: v.passengers,
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    todayRevenueCents: todayRevenue,
    revenueDeltaPercent: Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100),
    todayTrips: Math.max(1, Math.round(paidToday.length / 14)),
    tripsDeltaPercent: 8,
    todayPassengers: paidToday.length,
    passengersDeltaPercent: Math.round(
      ((paidToday.length - (paidYesterday.length || 1)) / (paidYesterday.length || 1)) * 100,
    ),
    activeTerminals: demoTerminals.filter((t) => t.status !== "offline").length,
    totalTerminals: demoTerminals.length,
    revenueByHour,
    revenueByDay,
    paymentMix,
    topRoutes,
    topConductors,
  };
}

/** Simulated network latency so loading skeletons are demonstrable. */
export function withLatency<T>(data: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
