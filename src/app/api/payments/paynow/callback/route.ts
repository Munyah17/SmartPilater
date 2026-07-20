import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/payments/paynow/callback
 *
 * Paynow's resultUrl webhook. Polling (via /api/payments/paynow/status)
 * remains the source of truth for the on-screen flow; this durably records
 * the server-to-server notification so settlement never depends on a phone
 * keeping its browser tab open.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const params = new URLSearchParams(body);
  const reference = params.get("reference");
  const status = params.get("status");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey && reference) {
    const supabase = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    await supabase.from("payment_events").insert({
      provider: "paynow",
      correlator: reference,
      status: status?.toLowerCase() === "paid" ? "paid" : "processing",
      payload: Object.fromEntries(params),
    });
  }

  return NextResponse.json({ received: true });
}
