import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCharge,
  ecocashErrorMessage,
  getEcocashConfig,
  mapEcocashStatus,
  normaliseMsisdn,
} from "@/lib/payments/providers/ecocash/server";

/**
 * POST /api/payments/ecocash/charge
 *
 * Initiates an EcoCash Instant Payment charge. The customer receives a USSD
 * PIN prompt on their phone; the caller then polls the status endpoint (or
 * we receive the notifyUrl callback) until the wallet confirms.
 */

const chargeSchema = z.object({
  /** Unique per attempt — doubles as the EIP clientCorrelator. */
  correlator: z.string().min(6).max(64),
  reference: z.string().min(1).max(64),
  msisdn: z.string().min(9).max(16),
  amountCents: z.number().int().positive().max(1_000_000),
  currency: z.enum(["USD", "ZWG"]),
  description: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const config = getEcocashConfig();
  if (!config) {
    return NextResponse.json(
      { error: "EcoCash is not configured on this server." },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = chargeSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid charge request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const msisdn = normaliseMsisdn(parsed.data.msisdn);
  if (!msisdn) {
    return NextResponse.json(
      { error: "Enter a valid Zimbabwe EcoCash number, e.g. 0771 234 567." },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const notifyUrl =
    appUrl && appUrl.startsWith("https://")
      ? `${appUrl.replace(/\/+$/, "")}/api/payments/ecocash/callback`
      : undefined;

  try {
    const { ok, httpStatus, body } = await createCharge(config, {
      clientCorrelator: parsed.data.correlator,
      referenceCode: parsed.data.reference,
      msisdn,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      description: parsed.data.description,
      notifyUrl,
    });

    if (!ok) {
      const message = ecocashErrorMessage(
        body,
        `EcoCash rejected the charge (HTTP ${httpStatus}).`,
      );
      // 4xx from EcoCash is a real, actionable answer (bad MSISDN, unwhitelisted
      // sandbox number, duplicate correlator, barred wallet) — pass it through
      // as-is. Only an unexpected upstream failure (5xx, or a shape we can't
      // parse) is genuinely "we couldn't reach EcoCash properly" (502).
      const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
      return NextResponse.json({ error: message }, { status });
    }

    const mapped = mapEcocashStatus(body);
    return NextResponse.json({
      msisdn,
      correlator: parsed.data.correlator,
      status: mapped.status,
      failureReason: mapped.failureReason,
      providerReference:
        typeof body.transactionId === "string" ? body.transactionId : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach EcoCash. Check your connection and retry." },
      { status: 504 },
    );
  }
}
