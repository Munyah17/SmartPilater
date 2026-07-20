import type { PaymentProviderId } from "@/types/domain";
import type { PaymentAdapter } from "./types";
import { createSimulatedAdapter } from "./providers/simulated";
import { createEcocashAdapter } from "./providers/ecocash/client";

/**
 * Central registry of payment adapters.
 *
 * In demo mode every provider resolves to a simulated adapter that follows
 * the same lifecycle (intent → pending → paid/failed/expired) as the real
 * rails. Production adapters are dropped in per provider without touching
 * any caller: replace the factory in this map, nothing else.
 *
 * EcoCash goes live when NEXT_PUBLIC_ECOCASH_ENABLED=true and the server
 * holds the EIP credentials (see .env.example). The flag is inlined at
 * build time, so flipping it requires a rebuild.
 */
const adapters = new Map<PaymentProviderId, PaymentAdapter>();

export function isEcocashLive(): boolean {
  return process.env.NEXT_PUBLIC_ECOCASH_ENABLED === "true";
}

const catalogue: {
  id: PaymentProviderId;
  displayName: string;
  flow: "qr" | "push" | "card";
}[] = [
  { id: "ecocash", displayName: "EcoCash", flow: "push" },
  { id: "onemoney", displayName: "OneMoney", flow: "push" },
  { id: "innbucks", displayName: "InnBucks", flow: "qr" },
  { id: "omari", displayName: "Omari", flow: "qr" },
  { id: "paynow", displayName: "Paynow", flow: "qr" },
  { id: "pos2u", displayName: "POS2U", flow: "card" },
  { id: "visa", displayName: "Visa", flow: "card" },
  { id: "mastercard", displayName: "Mastercard", flow: "card" },
  { id: "zipit", displayName: "ZIPIT", flow: "qr" },
];

for (const entry of catalogue) {
  adapters.set(entry.id, createSimulatedAdapter(entry));
}

if (isEcocashLive()) {
  adapters.set("ecocash", createEcocashAdapter());
}

export function getAdapter(id: PaymentProviderId): PaymentAdapter {
  const adapter = adapters.get(id);
  if (!adapter) {
    throw new Error(`No payment adapter registered for provider "${id}"`);
  }
  return adapter;
}

export function listAdapters(): PaymentAdapter[] {
  return [...adapters.values()];
}
