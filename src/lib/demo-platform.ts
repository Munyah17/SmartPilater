/**
 * Demo dataset for the super-admin (platform) portal.
 *
 * The platform view aggregates across every fleet company on SmartPilater.
 * Seke Express is the "live" tenant whose numbers come from demo-data; the
 * other operators are static so platform totals feel real without another
 * PRNG. Shapes mirror what the Supabase platform views will return.
 */

import type { Currency } from "@/types/domain";
import { demoTickets, demoTransactions } from "@/lib/demo-data";

export type OrgStatus = "active" | "pending" | "suspended";

export interface PlatformOrg {
  id: string;
  tradingName: string;
  legalName: string;
  city: string;
  currency: Currency;
  status: OrgStatus;
  vehicles: number;
  terminals: number;
  terminalsOnline: number;
  monthGrossCents: number;
  /** Platform fee at each org's negotiated basis points. */
  feeBasisPoints: number;
  joinedAt: string;
  contactPhone: string;
}

const sekeMonthGross = demoTickets
  .filter((t) => t.paymentStatus === "paid")
  .reduce((acc, t) => acc + t.amountCents, 0);

export const platformOrgs: PlatformOrg[] = [
  {
    id: "org-seke-express",
    tradingName: "Seke Express",
    legalName: "Seke Express (Pvt) Ltd",
    city: "Chitungwiza",
    currency: "USD",
    status: "active",
    vehicles: 6,
    terminals: 6,
    terminalsOnline: 5,
    monthGrossCents: sekeMonthGross,
    feeBasisPoints: 200,
    joinedAt: "2023-04-12",
    contactPhone: "+263 77 234 5678",
  },
  {
    id: "org-citylink",
    tradingName: "CityLink Commuters",
    legalName: "CityLink Commuter Services (Pvt) Ltd",
    city: "Harare",
    currency: "USD",
    status: "active",
    vehicles: 14,
    terminals: 14,
    terminalsOnline: 12,
    monthGrossCents: 1_284_500,
    feeBasisPoints: 200,
    joinedAt: "2023-09-02",
    contactPhone: "+263 78 445 1290",
  },
  {
    id: "org-mabvuku-flyers",
    tradingName: "Mabvuku Flyers",
    legalName: "Mabvuku Flyers Transport (Pvt) Ltd",
    city: "Harare",
    currency: "USD",
    status: "active",
    vehicles: 9,
    terminals: 8,
    terminalsOnline: 8,
    monthGrossCents: 861_200,
    feeBasisPoints: 250,
    joinedAt: "2024-02-18",
    contactPhone: "+263 77 902 3341",
  },
  {
    id: "org-metro-zig",
    tradingName: "Metro Peoples Transit",
    legalName: "Metro Peoples Transit (Parastatal)",
    city: "Harare",
    currency: "ZWG",
    status: "active",
    vehicles: 22,
    terminals: 20,
    terminalsOnline: 15,
    monthGrossCents: 5_420_000, // ZWG cents
    feeBasisPoints: 150,
    joinedAt: "2024-11-05",
    contactPhone: "+263 71 660 8802",
  },
  {
    id: "org-norton-shuttle",
    tradingName: "Norton Shuttle Co.",
    legalName: "Norton Shuttle Company (Pvt) Ltd",
    city: "Norton",
    currency: "USD",
    status: "pending",
    vehicles: 5,
    terminals: 0,
    terminalsOnline: 0,
    monthGrossCents: 0,
    feeBasisPoints: 200,
    joinedAt: "2026-07-10",
    contactPhone: "+263 77 118 4456",
  },
  {
    id: "org-gweru-united",
    tradingName: "Gweru United Kombis",
    legalName: "Gweru United Kombi Association",
    city: "Gweru",
    currency: "USD",
    status: "suspended",
    vehicles: 7,
    terminals: 6,
    terminalsOnline: 0,
    monthGrossCents: 214_800,
    feeBasisPoints: 200,
    joinedAt: "2024-06-30",
    contactPhone: "+263 78 776 0913",
  },
];

export interface PlatformSnapshot {
  activeOrgs: number;
  pendingOrgs: number;
  totalVehicles: number;
  terminalsOnline: number;
  terminalsTotal: number;
  /** USD-denominated aggregates (ZWG fleets excluded, shown separately). */
  monthGmvUsdCents: number;
  monthFeeUsdCents: number;
  monthGmvZwgCents: number;
  monthFeeZwgCents: number;
  ticketsToday: number;
  /** Key named revenueCents so RevenueTrendChart can render it directly. */
  gmvByDay: { day: string; revenueCents: number }[];
}

export function buildPlatformSnapshot(): PlatformSnapshot {
  const usdOrgs = platformOrgs.filter((o) => o.currency === "USD");
  const zwgOrgs = platformOrgs.filter((o) => o.currency === "ZWG");
  const fee = (orgs: PlatformOrg[]) =>
    orgs.reduce((acc, o) => acc + Math.round((o.monthGrossCents * o.feeBasisPoints) / 10_000), 0);

  const now = new Date();
  const todayKey = now.toDateString();
  const ticketsToday = demoTickets.filter(
    (t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === todayKey,
  ).length;

  // Seke's real daily curve, scaled up as if every fleet traded like it.
  const scale = 4.6;
  const gmvByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86_400_000);
    const key = d.toDateString();
    const cents = demoTickets
      .filter((t) => t.paymentStatus === "paid" && new Date(t.issuedAt).toDateString() === key)
      .reduce((acc, t) => acc + t.amountCents, 0);
    return {
      day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenueCents: Math.round(cents * scale),
    };
  });

  return {
    activeOrgs: platformOrgs.filter((o) => o.status === "active").length,
    pendingOrgs: platformOrgs.filter((o) => o.status === "pending").length,
    totalVehicles: platformOrgs.reduce((acc, o) => acc + o.vehicles, 0),
    terminalsOnline: platformOrgs.reduce((acc, o) => acc + o.terminalsOnline, 0),
    terminalsTotal: platformOrgs.reduce((acc, o) => acc + o.terminals, 0),
    monthGmvUsdCents: usdOrgs.reduce((acc, o) => acc + o.monthGrossCents, 0),
    monthFeeUsdCents: fee(usdOrgs),
    monthGmvZwgCents: zwgOrgs.reduce((acc, o) => acc + o.monthGrossCents, 0),
    monthFeeZwgCents: fee(zwgOrgs),
    ticketsToday,
    gmvByDay,
  };
}

/** Recent platform-wide transactions: Seke's real ones labelled per org. */
export function recentPlatformTransactions(limit = 12) {
  const orgNames = ["Seke Express", "CityLink Commuters", "Mabvuku Flyers"];
  return demoTransactions
    .slice(-limit)
    .reverse()
    .map((t, i) => ({ ...t, orgName: orgNames[i % orgNames.length] }));
}
