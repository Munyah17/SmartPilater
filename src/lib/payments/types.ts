import type { PaymentProviderId, PaymentStatus } from "@/types/domain";

/**
 * Payment adapter contract.
 *
 * Every gateway (EcoCash, OneMoney, InnBucks, Omari, Paynow, POS2U, card
 * rails, ZIPIT and anything added later) is integrated by implementing this
 * interface and registering it in the registry. Terminal and server code
 * only ever talk to the registry, never to a concrete provider.
 */

export interface PaymentRequest {
  /** Idempotency key: the ticket id generated on-device. */
  ticketId: string;
  amountCents: number;
  currency: "USD" | "ZWG";
  description: string;
  /** MSISDN for wallet pushes; empty for scan-to-pay flows. */
  payerPhone?: string;
  metadata: Record<string, string>;
}

export interface PaymentIntent {
  provider: PaymentProviderId;
  reference: string;
  /** Payload encoded into the on-screen QR (deep link or EMVCo string). */
  qrPayload: string;
  /** Seconds the passenger has before the intent expires. */
  expiresInSeconds: number;
  status: PaymentStatus;
}

export interface PaymentResult {
  reference: string;
  status: PaymentStatus;
  providerReference?: string;
  failureReason?: string;
  settledAmountCents?: number;
  feeCents?: number;
}

export interface PaymentAdapter {
  readonly id: PaymentProviderId;
  readonly displayName: string;
  /** Wallets that push a prompt to the payer phone vs. scan-to-pay. */
  readonly flow: "qr" | "push" | "card";
  readonly supportsRefunds: boolean;

  /** Create a payment intent the terminal can render as a QR. */
  createIntent(request: PaymentRequest): Promise<PaymentIntent>;

  /** Poll (or interpret a webhook for) the current status of an intent. */
  checkStatus(reference: string): Promise<PaymentResult>;

  /** Reverse a settled payment where the rail supports it. */
  refund?(reference: string, amountCents: number): Promise<PaymentResult>;
}
