import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createRefund,
  ecocashErrorMessage,
  getEcocashConfig,
  mapEcocashStatus,
  normaliseMsisdn,
} from "@/lib/payments/providers/ecocash/server";

/**
 * POST /api/payments/ecocash/refund
 *
 * Refund / reversal (EIP API 3). Reserved for fleet-owner and super-admin
 * flows; once Supabase auth is wired this handler must additionally verify
 * the caller holds one of those roles.
 */

const refundSchema = z.object({
  correlator: z.string().min(6).max(64),
  reference: z.string().min(1).max(64),
  msisdn: z.string().min(9).max(16),
  amountCents: z.number().int().positive().max(1_000_000),
  currency: z.enum(["USD", "ZWG"]),
  originalEcocashReference: z.string().min(4).max(64),
  remarks: z.string().max(60).optional(),
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
    parsed = refundSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid refund request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const msisdn = normaliseMsisdn(parsed.data.msisdn);
  if (!msisdn) {
    return NextResponse.json({ error: "Invalid Zimbabwe MSISDN." }, { status: 400 });
  }

  try {
    const { ok, httpStatus, body } = await createRefund(config, {
      clientCorrelator: parsed.data.correlator,
      referenceCode: parsed.data.reference,
      msisdn,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      originalEcocashReference: parsed.data.originalEcocashReference,
      remarks: parsed.data.remarks,
    });

    if (!ok) {
      const message = ecocashErrorMessage(
        body,
        `EcoCash rejected the refund (HTTP ${httpStatus}).`,
      );
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const mapped = mapEcocashStatus(body);
    return NextResponse.json({
      correlator: parsed.data.correlator,
      status: mapped.status === "paid" ? "refunded" : mapped.status,
      failureReason: mapped.failureReason,
      providerReference:
        typeof body.transactionId === "string" ? body.transactionId : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach EcoCash to process the refund." },
      { status: 504 },
    );
  }
}
