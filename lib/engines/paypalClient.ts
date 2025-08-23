// lib/engines/paypalClient.ts

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
}

// 1) Get OAuth2 access token
export async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // Next.js fetch defaults are fine on the server
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// 2) Create a Payout (single item) to an email
export async function createPayPalPayout(
  receiverEmail: string,
  amount: string | number,
  note: string = "Linkmint sandbox payout"
): Promise<any> {
  const token = await getPayPalAccessToken();
  const value = typeof amount === "number" ? amount.toFixed(2) : Number(amount).toFixed(2);

  const body = {
    sender_batch_header: {
      sender_batch_id: `batch_${Date.now()}`,
      email_subject: "You have a payout from Linkmint",
      email_message: "You received a payout from Linkmint (sandbox).",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: { value, currency: "USD" },
        note,
        receiver: receiverEmail,
      },
    ],
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PayPal payout error: ${res.status} ${JSON.stringify(data)}`);
  }

  return data; // includes batch header with payout_batch_id
}
