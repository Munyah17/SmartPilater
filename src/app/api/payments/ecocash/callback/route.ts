import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { mapEcocashStatus } from "@/lib/payments/providers/ecocash/server";

/**
 * POST /api/payments/ecocash/callback
 *
 * notifyUrl webhook receiver for EcoCash payment lifecycle events. Polling
 * remains the source of truth for the on-screen flow (terminals may be
 * offline-adjacent); this endpoint durably records events server-side so
 * settlements never depend on a phone keeping its browser open.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const correlator =
    typeof payload.clientCorrelator === "string" ? payload.clientCorrelator : null;
  const mapped = mapEcocashStatus(payload);

  // Persist when Supabase is configured; otherwise acknowledge so the
  // sandbox does not retry forever.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey && correlator) {
    const supabase = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    await supabase.from("payment_events").insert({
      provider: "ecocash",
      correlator,
      status: mapped.status,
      payload,
    });
  }

  return NextResponse.json({ received: true });
}
