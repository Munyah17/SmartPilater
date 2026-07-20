import "server-only";
import { createHash } from "node:crypto";

/**
 * Server-side client for Paynow's Express (mobile money) checkout.
 *
 * Paynow has two integration modes: the web flow redirects the payer to a
 * hosted Paynow page; the Express/"remote transaction" flow used here skips
 * that entirely — the payer enters their number on OUR page, we call
 * Paynow's API with `method` + `phone`, and Paynow pushes the EcoCash/
 * OneMoney USSD PIN prompt straight to their handset. This is the fallback
 * SmartPilater uses when the direct EcoCash Instant Payment rail is
 * unavailable (e.g. sandbox MSISDN not yet whitelisted): same UX for the
 * conductor and passenger, different upstream gateway.
 *
 * IMPORTANT — unverified: Paynow's request/response hash must be computed
 * by concatenating field VALUES in the exact order Paynow's own SDKs use,
 * then appending the integration key, then SHA-512, uppercased. The field
 * order below follows Paynow's publicly documented integration guide, but
 * has not been confirmed against a live Paynow sandbox (no credentials were
 * available while building this). Get a Paynow integration id + key
 * (instant, free signup at paynow.co.zw) and this should be verified with a
 * real request before relying on it — if Paynow returns "Hash mismatch",
 * the field order is the first thing to check against their SDK source.
 */

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  resultUrl: string;
  returnUrl: string;
}

const PAYNOW_BASE_URL = "https://www.paynow.co.zw/interface";

export function getPaynowConfig(): PaynowConfig | null {
  const { PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY, NEXT_PUBLIC_APP_URL } =
    process.env;
  if (!PAYNOW_INTEGRATION_ID || !PAYNOW_INTEGRATION_KEY) return null;
  const appUrl = (NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return {
    integrationId: PAYNOW_INTEGRATION_ID,
    integrationKey: PAYNOW_INTEGRATION_KEY,
    resultUrl: `${appUrl}/api/payments/paynow/callback`,
    returnUrl: `${appUrl}/pay`,
  };
}

/** SHA-512 of concatenated field values + integration key, uppercase hex. */
function generateHash(values: string[], integrationKey: string): string {
  const concatenated = values.join("") + integrationKey;
  return createHash("sha512").update(concatenated, "utf8").digest("hex").toUpperCase();
}

function verifyHash(fields: Record<string, string>, integrationKey: string): boolean {
  const { hash, ...rest } = fields;
  if (!hash) return false;
  const expected = generateHash(Object.values(rest), integrationKey);
  return expected === hash.toUpperCase();
}

/** Paynow responds with `application/x-www-form-urlencoded` text, not JSON. */
function parsePaynowResponse(text: string): Record<string, string> {
  const params = new URLSearchParams(text.trim());
  const result: Record<string, string> = {};
  for (const [key, value] of params) result[key.toLowerCase()] = value;
  return result;
}

/** Zimbabwean mobile money rail Paynow should push to, inferred from prefix. */
export function inferPaynowMethod(nationalNumber: string): "ecocash" | "onemoney" {
  return nationalNumber.startsWith("71") ? "onemoney" : "ecocash";
}

export interface ExpressChargeParams {
  reference: string;
  amountCents: number;
  msisdnNational: string;
  description: string;
  authEmail?: string;
}

export interface ExpressChargeResult {
  ok: boolean;
  status?: string;
  pollUrl?: string;
  instructions?: string;
  error?: string;
}

/**
 * Initiate an Express (mobile money) payment. No redirect: Paynow sends the
 * USSD PIN prompt directly to `msisdnNational`. Poll the returned pollUrl
 * for the outcome.
 */
export async function createExpressCharge(
  config: PaynowConfig,
  params: ExpressChargeParams,
): Promise<ExpressChargeResult> {
  const method = inferPaynowMethod(params.msisdnNational);
  const fields = {
    id: config.integrationId,
    reference: params.reference,
    amount: (params.amountCents / 100).toFixed(2),
    additionalinfo: params.description.slice(0, 200),
    returnurl: config.returnUrl,
    resulturl: config.resultUrl,
    authemail: params.authEmail ?? "passenger@smartpilater.app",
    phone: params.msisdnNational,
    method,
    status: "Message",
  };
  const hash = generateHash(Object.values(fields), config.integrationKey);

  const body = new URLSearchParams({ ...fields, hash });
  const response = await fetch(`${PAYNOW_BASE_URL}/remotetransaction`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const parsed = parsePaynowResponse(await response.text());

  if (parsed.status?.toLowerCase() !== "ok") {
    return { ok: false, error: parsed.error || "Paynow rejected the request." };
  }
  return {
    ok: true,
    status: parsed.status,
    pollUrl: parsed.pollurl,
    instructions: parsed.instructions,
  };
}

export interface PollResult {
  ok: boolean;
  status?: string;
  paid: boolean;
  amount?: string;
  error?: string;
}

/** Poll a transaction's pollUrl (received from createExpressCharge) for its outcome. */
export async function pollTransaction(
  config: PaynowConfig,
  pollUrl: string,
): Promise<PollResult> {
  // Defence in depth: only ever poll a URL Paynow itself issued.
  if (!pollUrl.startsWith("https://www.paynow.co.zw/")) {
    return { ok: false, paid: false, error: "Invalid poll URL." };
  }
  const response = await fetch(pollUrl, { method: "POST", cache: "no-store" });
  const parsed = parsePaynowResponse(await response.text());

  if (parsed.hash && !verifyHash(parsed, config.integrationKey)) {
    return { ok: false, paid: false, error: "Could not verify the response from Paynow." };
  }

  const status = parsed.status ?? "";
  return {
    ok: true,
    status,
    paid: status.toLowerCase() === "paid" || status.toLowerCase() === "delivered",
    amount: parsed.amount,
  };
}
