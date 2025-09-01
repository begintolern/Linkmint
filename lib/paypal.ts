// lib/paypal.ts
/**
 * Minimal PayPal Payouts client for manual/admin-triggered payouts.
 *
 * Required env vars:
 *  - PAYPAL_CLIENT_ID
 *  - PAYPAL_CLIENT_SECRET
 *  - PAYPAL_ENV = "live" | "sandbox"   (defaults to "sandbox")
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

/**
 * Fetch and cache an OAuth2 token from PayPal
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
  }

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

  const ttlSec = Number(json.expires_in ?? 3000);
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(60, ttlSec - 60) * 1000,
  };
  return cachedToken.token;
}

export type SendPayoutInput = {
  email: string;
  amountUSD: number;
  note?: string | null;
  batchId: string;
  emailSubject?: string;
};

/**
 * Send a single payout via PayPal Payouts API
 */
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
      sender_batch_id: batchId,
      email_subject: input.emailSubject || "You have a payout from Linkmint",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: { value: amountUSD.toFixed(2), currency: "USD" },
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

  return json;
}
