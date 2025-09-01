// lib/paypal.ts
/**
 * Minimal PayPal Payouts client (manual/admin-triggered).
 * Uses Client Credentials to obtain an access token, then calls the Payouts API.
 *
 * Required env:
 *  - PAYPAL_CLIENT_ID
 *  - PAYPAL_CLIENT_SECRET
 *  - PAYPAL_ENV = "live" | "sandbox"   (defaults to "sandbox" if unset)
 *
 * Docs you’ll need on PayPal:
 *  - Auth:   POST /v1/oauth2/token (grant_type=client_credentials)
 *  - Payout: POST /v1/payments/payouts
 */

type PayPalEnv = "live" | "sandbox";

function getBase(env: PayPalEnv) {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function currentEnv(): PayPalEnv {
  const v = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return v === "live" ? "live" : "sandbox";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
  }

  // Reuse token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const base = getBase(currentEnv());
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) {
    const detail =
      json?.error_description || json?.error || res.statusText || "Auth failed";
    throw new Error(`PayPal auth error: ${detail}`);
  }

  // Cache with a small safety buffer
  const ttlSec = Number(json.expires_in ?? 3000);
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(60, ttlSec - 60) * 1000,
  };
  return cachedToken.token;
}

export type SendPayoutInput = {
  email: string;              // PayPal receiver (email)
  amountUSD: number;          // positive number, e.g., 10.5
  note?: string | null;       // optional note to receiver
  batchId: string;            // idempotency key; use stable value (e.g., "lm_<payoutId>")
  emailSubject?: string;      // optional subject line
};

export async function sendPayPalPayout(input: SendPayoutInput) {
  const { email, amountUSD, note, batchId } = input;

  if (!email) throw new Error("Receiver email is required");
  if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (!batchId) throw new Error("batchId is required");

  const token = await getPayPalAccessToken();
  const base = getBase(currentEnv());

  const body = {
    sender_batch_header: {
      sender_batch_id: batchId, // idempotency
      email_subject: input.emailSubject || "You have a payout from Linkmint",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amountUSD.toFixed(2),
          currency: "USD",
        },
        receiver: email,
        note: note || "Linkmint payout",
      },
    ],
  };

  const res = await fetch(`${base}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const name = json?.name || "PayPal payout error";
    const details =
      (Array.isArray(json?.details) && json.details.map((d: any) => d.issue).join(", ")) ||
      json?.message ||
      res.statusText;
    throw new Error(`${name}: ${details}`);
  }

  // Example success structure contains batch_header with payout_batch_id
  return json;
}
