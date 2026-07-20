import type {
  PaymentAdapter,
  PaymentIntent,
  PaymentRequest,
  PaymentResult,
} from "../../types";

/**
 * Live Paynow Express adapter (browser side).
 *
 * Talks only to SmartPilater's own /api/payments/paynow/* route handlers —
 * the integration id/key never leave the server. Paynow is a push rail
 * here, same contract as the direct EcoCash adapter: `payerPhone` triggers
 * a USSD PIN prompt on the passenger's handset, no QR or redirect involved.
 */

const pollUrls = new Map<string, string>();

function buildReference(ticketId: string): string {
  return `SP${ticketId.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
}

export function createPaynowAdapter(): PaymentAdapter {
  return {
    id: "paynow",
    displayName: "Paynow",
    flow: "push",
    supportsRefunds: false,

    async createIntent(request: PaymentRequest): Promise<PaymentIntent> {
      if (!request.payerPhone) {
        throw new Error("A mobile number is required for Paynow Express checkout.");
      }
      const reference = buildReference(request.ticketId);
      const response = await fetch("/api/payments/paynow/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          amountCents: request.amountCents,
          msisdn: request.payerPhone,
          description: request.description,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Paynow charge failed.");
      }
      if (typeof body.pollUrl === "string") pollUrls.set(reference, body.pollUrl);

      return {
        provider: "paynow",
        reference,
        qrPayload: JSON.stringify({
          v: 1,
          p: "paynow",
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
      const pollUrl = pollUrls.get(reference);
      if (!pollUrl) {
        return { reference, status: "expired", failureReason: "Unknown reference" };
      }
      const response = await fetch(
        `/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`,
      );
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        // Transient lookup problems keep the countdown running rather than
        // failing a payment Paynow may still confirm.
        return { reference, status: "processing" };
      }
      const status = typeof body.status === "string" ? body.status.toLowerCase() : "";
      if (body.paid === true) return { reference, status: "paid" };
      if (status === "cancelled") {
        return { reference, status: "failed", failureReason: "The payment was cancelled." };
      }
      if (status === "disputed") {
        return { reference, status: "failed", failureReason: "The payment was disputed." };
      }
      return { reference, status: "processing" };
    },
  };
}
