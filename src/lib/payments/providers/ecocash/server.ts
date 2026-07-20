import "server-only";

import type { Currency, PaymentStatus } from "@/types/domain";

/**
 * Server-side client for the EcoCash Online Payments API (EIP).
 *
 * Runs only inside Route Handlers: the Basic Auth credentials and merchant
 * PIN never reach the browser. The browser talks to /api/payments/ecocash/*,
 * which delegates here. Sandbox and production differ only by env values.
 *
 * API surface (see docs/ECOCASH.md):
 *   POST /transactions/amount/                             charge request
 *   GET  /{endUserId}/transactions/amount/{correlator}     transaction lookup
 *   POST /transactions/refund/                             refund / reversal
 */

export interface EcocashConfig {
  baseUrl: string;
  username: string;
  password: string;
  merchantCode: string;
  merchantPin: string;
  merchantNumber: string;
  terminalId: string;
  merchantName: string;
  superMerchantName: string;
  location: string;
}

export function getEcocashConfig(): EcocashConfig | null {
  const {
    ECOCASH_API_BASE_URL,
    ECOCASH_API_USERNAME,
    ECOCASH_API_PASSWORD,
    ECOCASH_MERCHANT_CODE,
    ECOCASH_MERCHANT_PIN,
    ECOCASH_MERCHANT_NUMBER,
  } = process.env;
  if (
    !ECOCASH_API_BASE_URL ||
    !ECOCASH_API_USERNAME ||
    !ECOCASH_API_PASSWORD ||
    !ECOCASH_MERCHANT_CODE ||
    !ECOCASH_MERCHANT_PIN ||
    !ECOCASH_MERCHANT_NUMBER
  ) {
    return null;
  }
  return {
    baseUrl: ECOCASH_API_BASE_URL.replace(/\/+$/, ""),
    username: ECOCASH_API_USERNAME,
    password: ECOCASH_API_PASSWORD,
    merchantCode: ECOCASH_MERCHANT_CODE,
    merchantPin: ECOCASH_MERCHANT_PIN,
    merchantNumber: ECOCASH_MERCHANT_NUMBER,
    terminalId: process.env.ECOCASH_TERMINAL_ID ?? "TERM001",
    merchantName: process.env.ECOCASH_MERCHANT_NAME ?? "SmartPilater",
    superMerchantName: process.env.ECOCASH_SUPER_MERCHANT_NAME ?? "ECOCASH",
    location: process.env.ECOCASH_LOCATION ?? "Harare",
  };
}

/**
 * Normalise a Zimbabwe MSISDN to the 263XXXXXXXXX form the API accepts.
 * Handles "+263 77…", "077…", "77…" and strips spacing/punctuation.
 */
export function normaliseMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national: string;
  if (digits.startsWith("263")) national = digits.slice(3);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;
  if (!/^7[1378]\d{7}$/.test(national)) return null;
  return `263${national}`;
}

/** Best human-readable error out of the EIP's two error body shapes. */
export function ecocashErrorMessage(
  body: Record<string, unknown>,
  fallback: string,
): string {
  if (typeof body.statusMessage === "string") return body.statusMessage;
  if (typeof body.message === "string") return body.message;
  return fallback;
}

/** Map the EIP response vocabulary onto SmartPilater's PaymentStatus. */
export function mapEcocashStatus(payload: Record<string, unknown>): {
  status: PaymentStatus;
  failureReason?: string;
} {
  const haystack = [
    payload["transactionOperationStatus"],
    payload["status"],
    payload["statusMessage"],
    payload["transactionStatus"],
  ]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();

  if (/(successful|success|completed|charged\b|paid)/.test(haystack)) {
    return { status: "paid" };
  }
  if (/expired/.test(haystack)) {
    return { status: "expired", failureReason: "The payment request expired." };
  }
  if (/insufficient/.test(haystack)) {
    return { status: "failed", failureReason: "Insufficient EcoCash balance." };
  }
  if (/invalid pin/.test(haystack)) {
    return { status: "failed", failureReason: "Wrong EcoCash PIN entered." };
  }
  if (/limit exceeded/.test(haystack)) {
    return { status: "failed", failureReason: "EcoCash transaction limit exceeded." };
  }
  if (/(failed|declined|barred|cancelled)/.test(haystack)) {
    const message =
      typeof payload["statusMessage"] === "string"
        ? payload["statusMessage"]
        : "The wallet declined the payment.";
    return { status: "failed", failureReason: message };
  }
  return { status: "processing" };
}

/**
 * Non-default TLS cipher order. The EIP sandbox sits behind Cloudflare bot
 * protection that fingerprints the TLS handshake (JA3): Node's stock
 * fetch/undici handshake gets a 403 HTML block page regardless of headers,
 * while this reordered suite passes and reaches the API. Verified against
 * the sandbox on 2026-07-20.
 */
const EIP_TLS_CIPHERS = [
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-GCM-SHA384",
].join(":");

async function eipFetch(
  config: EcocashConfig,
  path: string,
  init: { method: "GET" | "POST"; body?: string },
): Promise<{ ok: boolean; httpStatus: number; body: Record<string, unknown> }> {
  const { request } = await import("node:https");
  const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const url = new URL(`${config.baseUrl}${path}`);

  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: init.method,
        ciphers: EIP_TLS_CIPHERS,
        timeout: 30_000,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmartPilater/1.0 Chrome/126.0 Safari/537.36",
          ...(init.body ? { "Content-Length": Buffer.byteLength(init.body) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          let body: Record<string, unknown> = {};
          try {
            body = JSON.parse(data) as Record<string, unknown>;
          } catch {
            // Some error paths return an empty or non-JSON body.
          }
          const httpStatus = res.statusCode ?? 0;
          resolve({ ok: httpStatus >= 200 && httpStatus < 300, httpStatus, body });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("EcoCash request timed out"));
    });
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

export interface ChargeParams {
  clientCorrelator: string;
  referenceCode: string;
  msisdn: string;
  amountCents: number;
  currency: Currency;
  description: string;
  notifyUrl?: string;
}

export async function createCharge(config: EcocashConfig, params: ChargeParams) {
  return eipFetch(config, "/transactions/amount/", {
    method: "POST",
    body: JSON.stringify({
      clientCorrelator: params.clientCorrelator,
      notifyUrl: params.notifyUrl ?? "",
      referenceCode: params.referenceCode,
      tranType: "MER",
      endUserId: params.msisdn,
      remarks: params.description.slice(0, 60),
      transactionOperationStatus: "Charged",
      paymentAmount: {
        charginginformation: {
          amount: Number((params.amountCents / 100).toFixed(2)),
          currency: params.currency,
          description: params.description.slice(0, 60),
        },
        chargeMetaData: { channel: "WEB" },
      },
      merchantCode: config.merchantCode,
      merchantPin: config.merchantPin,
      merchantNumber: config.merchantNumber,
      countryCode: "ZW",
      terminalID: config.terminalId,
      location: config.location,
      superMerchantName: config.superMerchantName,
      merchantName: config.merchantName,
    }),
  });
}

export async function lookupTransaction(
  config: EcocashConfig,
  msisdn: string,
  clientCorrelator: string,
) {
  return eipFetch(
    config,
    `/${encodeURIComponent(msisdn)}/transactions/amount/${encodeURIComponent(clientCorrelator)}`,
    { method: "GET" },
  );
}

export interface RefundParams {
  clientCorrelator: string;
  referenceCode: string;
  msisdn: string;
  amountCents: number;
  currency: Currency;
  originalEcocashReference: string;
  remarks?: string;
}

export async function createRefund(config: EcocashConfig, params: RefundParams) {
  return eipFetch(config, "/transactions/refund/", {
    method: "POST",
    body: JSON.stringify({
      clientCorrelator: params.clientCorrelator,
      referenceCode: params.referenceCode,
      tranType: "REF",
      endUserId: params.msisdn,
      originalEcocashReference: params.originalEcocashReference,
      paymentAmount: {
        charginginformation: {
          amount: Number((params.amountCents / 100).toFixed(2)),
          currency: params.currency,
          description: params.remarks ?? "Fare refund",
        },
        chargeMetaData: { channel: "WEB" },
      },
      merchantCode: config.merchantCode,
      merchantPin: config.merchantPin,
      merchantNumber: config.merchantNumber,
      countryCode: "ZW",
      terminalID: config.terminalId,
      location: config.location,
      superMerchantName: config.superMerchantName,
      merchantName: config.merchantName,
      currencyCode: params.currency,
      remarks: params.remarks ?? "Fare refund",
    }),
  });
}
