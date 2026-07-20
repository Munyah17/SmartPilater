import type {
  PaymentAdapter,
  PaymentIntent,
  PaymentRequest,
  PaymentResult,
} from "../../types";

/**
 * Live EcoCash Instant Payment adapter (browser side).
 *
 * Talks only to SmartPilater's own /api/payments/ecocash/* route handlers —
 * the merchant credentials live on the server. EcoCash is a push rail: the
 * charge sends a USSD PIN prompt to the payer's phone, so `payerPhone` is
 * required. The QR payload is informational (the passenger approves on their
 * handset, not by scanning).
 */

interface IntentState {
  msisdn: string;
  currency: "USD" | "ZWG";
  /** A terminal charge that already resolved on create (sandbox often does). */
  resolved?: PaymentResult;
}

const intents = new Map<string, IntentState>();

/** clientCorrelator must be unique per attempt, even when retrying a ticket. */
function buildCorrelator(ticketId: string): string {
  const compact = ticketId.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase();
  return `SP${compact}${Date.now().toString(36).toUpperCase()}`;
}

export function createEcocashAdapter(): PaymentAdapter {
  return {
    id: "ecocash",
    displayName: "EcoCash",
    flow: "push",
    supportsRefunds: true,

    async createIntent(request: PaymentRequest): Promise<PaymentIntent> {
      if (!request.payerPhone) {
        throw new Error("An EcoCash number is required for instant payment.");
      }
      const correlator = buildCorrelator(request.ticketId);
      const response = await fetch("/api/payments/ecocash/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correlator,
          reference: `SP_${request.ticketId.replace(/[^a-z0-9]/gi, "").slice(-12)}`,
          msisdn: request.payerPhone,
          amountCents: request.amountCents,
          currency: request.currency,
          description: request.description,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "EcoCash charge failed.",
        );
      }

      const msisdn = typeof body.msisdn === "string" ? body.msisdn : request.payerPhone;
      const status = body.status as PaymentResult["status"] | undefined;
      intents.set(correlator, {
        msisdn,
        currency: request.currency,
        resolved:
          status && status !== "pending" && status !== "processing"
            ? {
                reference: correlator,
                status,
                failureReason:
                  typeof body.failureReason === "string" ? body.failureReason : undefined,
                providerReference:
                  typeof body.providerReference === "string"
                    ? body.providerReference
                    : undefined,
                settledAmountCents: status === "paid" ? request.amountCents : undefined,
              }
            : undefined,
      });

      return {
        provider: "ecocash",
        reference: correlator,
        qrPayload: JSON.stringify({
          v: 1,
          p: "ecocash",
          r: correlator,
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
      if (state.resolved) return state.resolved;

      const response = await fetch(
        `/api/payments/ecocash/status?msisdn=${encodeURIComponent(
          state.msisdn,
        )}&correlator=${encodeURIComponent(reference)}`,
      );
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        // Transient lookup problems keep the countdown running rather than
        // failing a payment the wallet may still confirm.
        return { reference, status: "processing" };
      }
      const status = (body.status as PaymentResult["status"]) ?? "processing";
      const result: PaymentResult = {
        reference,
        status,
        failureReason:
          typeof body.failureReason === "string" ? body.failureReason : undefined,
        providerReference:
          typeof body.providerReference === "string" ? body.providerReference : undefined,
      };
      if (status === "paid" || status === "failed" || status === "expired") {
        intents.set(reference, { ...state, resolved: result });
      }
      return result;
    },

    async refund(reference: string, amountCents: number): Promise<PaymentResult> {
      const state = intents.get(reference);
      if (!state?.resolved?.providerReference) {
        return {
          reference,
          status: "failed",
          failureReason: "Original EcoCash reference not available on this device.",
        };
      }
      const response = await fetch("/api/payments/ecocash/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correlator: `RF${reference.slice(2)}${Date.now().toString(36).toUpperCase()}`,
          reference: `REF_${reference}`,
          msisdn: state.msisdn,
          amountCents,
          currency: state.currency,
          originalEcocashReference: state.resolved.providerReference,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        return {
          reference,
          status: "failed",
          failureReason: typeof body.error === "string" ? body.error : "Refund failed.",
        };
      }
      return {
        reference,
        status: "refunded",
        settledAmountCents: amountCents,
      };
    },
  };
}
