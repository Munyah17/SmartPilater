import { NextResponse, type NextRequest } from "next/server";
import { getPaynowConfig, pollTransaction } from "@/lib/payments/providers/paynow/server";

/**
 * GET /api/payments/paynow/status?pollUrl=…
 *
 * Proxies Paynow's pollUrl server-side so the integration key stays off the
 * browser (needed to verify the response hash) and so CORS never becomes
 * the caller's problem. The terminal / public pay page poll this at ~1 Hz,
 * same cadence as the direct EcoCash rail.
 */
export async function GET(request: NextRequest) {
  const config = getPaynowConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Paynow is not configured on this server." },
      { status: 503 },
    );
  }

  const pollUrl = request.nextUrl.searchParams.get("pollUrl");
  if (!pollUrl) {
    return NextResponse.json({ error: "pollUrl query parameter is required." }, { status: 400 });
  }

  try {
    const result = await pollTransaction(config, pollUrl);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Paynow lookup failed." }, { status: 502 });
    }
    return NextResponse.json({ status: result.status, paid: result.paid });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Paynow for a status check." },
      { status: 504 },
    );
  }
}
