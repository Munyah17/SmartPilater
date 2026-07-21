import { NextResponse } from "next/server";
import { z } from "zod";
import { createHostedCheckout, getPaynowConfig } from "@/lib/payments/providers/paynow/server";

/**
 * POST /api/payments/paynow/checkout
 *
 * Paynow's classic hosted checkout: full redirect to Paynow's own page.
 * Paynow collects the payment method and handles the entire payer
 * interaction — SmartPilater only finds out the outcome via the resultUrl
 * webhook (see /api/payments/paynow/callback) and the browser bouncing back
 * to returnPath. No phone number touches our servers for this flow.
 *
 * Same live-production caveat as the Express endpoint: gated behind
 * NEXT_PUBLIC_PAYNOW_ENABLED so the kill-switch can't be bypassed by
 * calling this route directly while the feature is meant to be off.
 */

const checkoutSchema = z.object({
  reference: z.string().min(1).max(64),
  amountCents: z.number().int().positive().max(1_000_000),
  description: z.string().min(1).max(200),
  /** App-relative path Paynow should return the browser to, e.g. /pay/veh-1 */
  returnPath: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_PAYNOW_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Paynow checkout is disabled on this server." },
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
    parsed = checkoutSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const separator = parsed.data.returnPath.includes("?") ? "&" : "?";
  const returnUrl = `${appUrl}${parsed.data.returnPath}${separator}paynow_ref=${encodeURIComponent(parsed.data.reference)}`;

  try {
    const result = await createHostedCheckout(config, {
      reference: parsed.data.reference,
      amountCents: parsed.data.amountCents,
      description: parsed.data.description,
      returnUrl,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Paynow rejected the checkout." },
        { status: 502 },
      );
    }
    return NextResponse.json({ browserUrl: result.browserUrl, pollUrl: result.pollUrl });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Paynow. Check your connection and retry." },
      { status: 504 },
    );
  }
}
