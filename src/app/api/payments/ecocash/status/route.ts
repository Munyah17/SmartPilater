import { NextResponse, type NextRequest } from "next/server";
import {
  ecocashErrorMessage,
  getEcocashConfig,
  lookupTransaction,
  mapEcocashStatus,
  normaliseMsisdn,
} from "@/lib/payments/providers/ecocash/server";

/**
 * GET /api/payments/ecocash/status?msisdn=…&correlator=…
 *
 * Transaction lookup: mirrors EIP API 2. Terminals and the public pay page
 * poll this at ~1 Hz while the passenger approves the USSD prompt.
 */
export async function GET(request: NextRequest) {
  const config = getEcocashConfig();
  if (!config) {
    return NextResponse.json(
      { error: "EcoCash is not configured on this server." },
      { status: 503 },
    );
  }

  const correlator = request.nextUrl.searchParams.get("correlator");
  const rawMsisdn = request.nextUrl.searchParams.get("msisdn");
  const msisdn = rawMsisdn ? normaliseMsisdn(rawMsisdn) : null;
  if (!correlator || !msisdn) {
    return NextResponse.json(
      { error: "msisdn and correlator query parameters are required." },
      { status: 400 },
    );
  }

  try {
    const { ok, httpStatus, body } = await lookupTransaction(config, msisdn, correlator);
    if (!ok && httpStatus === 404) {
      return NextResponse.json({ correlator, status: "processing" });
    }
    if (!ok) {
      const message = ecocashErrorMessage(
        body,
        `EcoCash lookup failed (HTTP ${httpStatus}).`,
      );
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const mapped = mapEcocashStatus(body);
    return NextResponse.json({
      correlator,
      status: mapped.status,
      failureReason: mapped.failureReason,
      providerReference:
        typeof body.transactionId === "string"
          ? body.transactionId
          : typeof body.ecocashReference === "string"
            ? body.ecocashReference
            : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach EcoCash for a status check." },
      { status: 504 },
    );
  }
}
