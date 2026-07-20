/**
 * Core domain model for SmartPilater.
 *
 * These types mirror the PostgreSQL schema in supabase/migrations and are
 * the single vocabulary shared by the terminal, dashboard, offline queue
 * and payment adapters. All money values are integer cents (USD).
 */

export type Role =
  | "super_admin"
  | "fleet_owner"
  | "driver"
  | "conductor"
  | "device";

/**
 * Currencies a fleet can transact in. Most operators run USD-only; parastatal
 * fleets accept ZWG. The org-level setting drives fares, receipts and the
 * currency sent to payment rails.
 */
export type Currency = "USD" | "ZWG";

/** How a ticket was sold: by staff on a terminal, or self-service public pay. */
export type SaleChannel = "terminal" | "public";

export type PaymentProviderId =
  | "ecocash"
  | "onemoney"
  | "innbucks"
  | "omari"
  | "paynow"
  | "pos2u"
  | "visa"
  | "mastercard"
  | "zipit"
  | "nfc_tap"
  | "cash";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

export type TicketStatus = "valid" | "used" | "refunded" | "void";

export type TerminalStatus = "online" | "offline" | "degraded";

export type SyncState = "queued" | "syncing" | "synced" | "conflict";

export interface Organization {
  id: string;
  name: string;
  tradingName: string;
  registrationNumber: string;
  phone: string;
  email: string;
  city: string;
  /**
   * The default currency: what self-service public pay always charges (the
   * passenger never picks a currency) and the terminal's starting selection.
   * Must be one of `enabledCurrencies`.
   */
  currency: Currency;
  /**
   * Currencies the fleet accepts at all, chosen by the fleet company — never
   * by the passenger. USD, ZWG, or both. A conductor/driver with more than
   * one enabled currency may pick per sale which one a given passenger pays
   * in; self-service pay always uses `currency` since the passenger has no
   * say in it.
   */
  enabledCurrencies: Currency[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  orgId: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
  active: boolean;
}

export interface Vehicle {
  id: string;
  orgId: string;
  registration: string;
  model: string;
  seats: number;
  insuranceExpiry: string;
  inspectionExpiry: string;
  driverId: string | null;
  conductorId: string | null;
  terminalId: string | null;
  routeId: string | null;
  active: boolean;
}

export interface TransportRoute {
  id: string;
  orgId: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  stops: RouteStop[];
  /**
   * Flat fare charged on self-service public pay: the price to the final
   * destination. Everyone pays this; only a logged-in conductor or driver
   * can charge custom fares or early drop-off prices on the terminal.
   */
  publicFareCents: number;
  active: boolean;
}

export interface RouteStop {
  id: string;
  name: string;
  sequence: number;
}

export interface FarePreset {
  id: string;
  routeId: string;
  label: string;
  description: string;
  amountCents: number;
  sortOrder: number;
  active: boolean;
}

export interface Terminal {
  id: string;
  orgId: string;
  serial: string;
  label: string;
  vehicleId: string | null;
  status: TerminalStatus;
  batteryPercent: number;
  signalBars: 0 | 1 | 2 | 3 | 4;
  gpsFix: boolean;
  printerOk: boolean;
  softwareVersion: string;
  androidVersion: string;
  storageFreePercent: number;
  kioskMode: boolean;
  lastSyncAt: string;
  lastSeenAt: string;
}

export interface StaffMember {
  id: string;
  orgId: string;
  role: "driver" | "conductor";
  fullName: string;
  phone: string;
  nationalId: string;
  licenceNumber?: string;
  photoUrl: string | null;
  assignedVehicleId: string | null;
  active: boolean;
  joinedAt: string;
}

export interface Trip {
  id: string;
  orgId: string;
  vehicleId: string;
  routeId: string;
  driverId: string;
  conductorId: string;
  startedAt: string;
  endedAt: string | null;
  passengerCount: number;
  revenueCents: number;
}

export interface Ticket {
  id: string;
  orgId: string;
  tripId: string | null;
  vehicleId: string;
  routeId: string;
  terminalId: string;
  farePresetId: string | null;
  destination: string;
  amountCents: number;
  provider: PaymentProviderId;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  reference: string;
  verifyCode: string;
  issuedAt: string;
  syncState: SyncState;
  /** Defaults to "terminal" for staff-issued tickets. */
  channel?: SaleChannel;
  currency?: Currency;
  /** Payer MSISDN for wallet-push rails (EcoCash instant payments). */
  payerPhone?: string;
  /** Card UID for nfc_tap payments (contactless bank card or transit card). */
  cardId?: string;
}

export interface Transaction {
  id: string;
  ticketId: string;
  orgId: string;
  provider: PaymentProviderId;
  amountCents: number;
  feeCents: number;
  status: PaymentStatus;
  reference: string;
  createdAt: string;
  settledAt: string | null;
}

export interface Settlement {
  id: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  grossCents: number;
  feesCents: number;
  netCents: number;
  transactionCount: number;
  status: "pending" | "processing" | "paid";
  paidAt: string | null;
}

export interface DeviceAlert {
  id: string;
  terminalId: string;
  terminalLabel: string;
  kind:
    | "low_battery"
    | "offline"
    | "printer_error"
    | "payment_failed"
    | "update_available";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  acknowledged: boolean;
}

/** Point-in-time metrics rendered on the dashboard overview. */
export interface DashboardSnapshot {
  todayRevenueCents: number;
  revenueDeltaPercent: number;
  todayTrips: number;
  tripsDeltaPercent: number;
  todayPassengers: number;
  passengersDeltaPercent: number;
  activeTerminals: number;
  totalTerminals: number;
  revenueByHour: { hour: string; revenueCents: number; passengers: number }[];
  revenueByDay: { day: string; revenueCents: number }[];
  paymentMix: { provider: PaymentProviderId; label: string; share: number }[];
  topRoutes: { routeId: string; name: string; revenueCents: number; trips: number }[];
  topConductors: {
    id: string;
    name: string;
    revenueCents: number;
    passengers: number;
  }[];
}
