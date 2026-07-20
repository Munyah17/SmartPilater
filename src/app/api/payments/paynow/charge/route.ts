import { NextResponse } from "next/server";
import { z } from "zod";
import { createExpressCharge, getPaynowConfig } from "@/lib/payments/providers/paynow/server";

/**
 * POST /api/payments/paynow/charge
 *
 * Paynow Express checkout: no redirect to a Paynow-hosted page. The
 * passenger enters their number on our own screen; Paynow pushes the wallet
 * PIN prompt straight to their phone. Used as a fallback rail while the
 * direct EcoCash Instant Payment integration is blocked on sandbox
 * whitelisting.
 *
 * Paynow has no sandbox — this route calls their live production API and
 * can move real money the moment it succeeds. NEXT_PUBLIC_PAYNOW_ENABLED is
 * checked here too (not just client-side in the adapter registry) so the
 * kill-switch can't be bypassed by posting to this endpoint directly while
 * the feature is meant to be off.
 */

const chargeSchema = z.object({
  reference: z.string().min(1).max(64),
  amountCents: z.number().int().positive().max(1_000_000),
  msisdn: z.string().min(9).max(16),
  description: z.string().min(1).max(200),
});

function normaliseMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("263")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return /^7[1378]\d{7}$/.test(national) ? national : null;
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_PAYNOW_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Paynow Express checkout is disabled on this server." },
      { status: 503 },
    );
  }

  const config = getPaynowConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Paynow is not configured on this server." },
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
      { error: "Enter a valid Zimbabwe mobile number, e.g. 0771 234 567." },
      { status: 400 },
    );
  }

  try {
    const result = await createExpressCharge(config, {
      reference: parsed.data.reference,
      amountCents: parsed.data.amountCents,
      msisdnNational: msisdn,
      description: parsed.data.description,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Paynow rejected the charge." }, { status: 502 });
    }
    return NextResponse.json({
      pollUrl: result.pollUrl,
      instructions: result.instructions ?? "Enter your PIN on your phone to approve the payment.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Paynow. Check your connection and retry." },
      { status: 504 },
    );
  }
}
