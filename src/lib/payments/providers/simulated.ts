import type { PaymentProviderId } from "@/types/domain";
import type {
  PaymentAdapter,
  PaymentIntent,
  PaymentRequest,
  PaymentResult,
} from "../types";

/**
 * Simulated gateway used in demo mode and local development.
 *
 * It mimics the timing behaviour of Zimbabwean wallet rails: an intent is
 * created instantly, the passenger "approves" after a few seconds, and a
 * small share of attempts fail so the terminal's failure path stays honest.
 */

interface SimState {
  createdAt: number;
  amountCents: number;
  /** Predetermined outcome so repeated polls are consistent. */
  outcome: "paid" | "failed";
  /** Milliseconds after creation at which the outcome lands. */
  settleAfterMs: number;
}

const intents = new Map<string, SimState>();

export function createSimulatedAdapter(config: {
  id: PaymentProviderId;
  displayName: string;
  flow: "qr" | "push" | "card";
}): PaymentAdapter {
  return {
    id: config.id,
    displayName: config.displayName,
    flow: config.flow,
    supportsRefunds: config.flow !== "card",

    async createIntent(request: PaymentRequest): Promise<PaymentIntent> {
      const reference = `${config.id.toUpperCase()}-${request.ticketId
        .replace(/[^a-z0-9]/gi, "")
        .slice(-8)
        .toUpperCase()}`;
      intents.set(reference, {
        createdAt: Date.now(),
        amountCents: request.amountCents,
        outcome: Math.random() < 0.94 ? "paid" : "failed",
        settleAfterMs: 3500 + Math.random() * 4500,
      });
      return {
        provider: config.id,
        reference,
        qrPayload: JSON.stringify({
          v: 1,
          p: config.id,
          r: reference,
          a: request.amountCents,
          c: request.currency,
          d: request.description,
        }),
        expiresInSeconds: 90,
        status: "pending",
      };
    },

    async checkStatus(reference: string): Promise<PaymentResult> {
      const state = intents.get(reference);
      if (!state) {
        return { reference, status: "expired", failureReason: "Unknown reference" };
      }
      const elapsed = Date.now() - state.createdAt;
      if (elapsed < state.settleAfterMs) {
        return { reference, status: "processing" };
      }
      if (elapsed > 90_000 && state.outcome === "failed") {
        return { reference, status: "expired", failureReason: "Passenger did not approve in time" };
      }
      if (state.outcome === "failed") {
        return {
          reference,
          status: "failed",
          failureReason: "Insufficient wallet balance",
        };
      }
      return {
        reference,
        status: "paid",
        providerReference: `PRV${state.createdAt.toString(36).toUpperCase()}`,
        settledAmountCents: state.amountCents,
        feeCents: Math.round(state.amountCents * 0.02),
      };
    },

    async refund(reference: string, amountCents: number): Promise<PaymentResult> {
      return { reference, status: "refunded", settledAmountCents: amountCents };
    },
  };
}
