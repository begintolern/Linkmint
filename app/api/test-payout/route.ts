// app/api/test-payout/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/utils/adminGuard";
// ✅ use the consolidated helper (no more "@/lib/paypal/client")
import { getPayPalAccessToken } from "@/lib/paypal";
import { logPayPalPayoutEvent } from "@/lib/payouts/logPayPalPayoutEvent";

// Prefer PAYPAL_ENV (live|sandbox); fallback to legacy PAYPAL_MODE if present
const MODE = (process.env.PAYPAL_ENV || process.env.PAYPAL_MODE || "sandbox")
  .toString()
  .toLowerCase();

const API_BASE =
  MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function POST(req: NextRequest) {
  // Admin-only safety
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const receiverEmail =
      (body?.toEmail as string) ||
      (process.env.PAYPAL_TEST_RECEIVER as string) ||
      "sb-40kiz44539704@personal.example.com";

    const amountNum = Number(body?.amount ?? 4.55);
    const amount = amountNum.toFixed(2);
    const note = (body?.note as string) || "Linkmint sandbox payout";

    if (!receiverEmail) {
      return NextResponse.json({ success: false, error: "Missing receiver email" }, { status: 400 });
    }
    if (!(amountNum > 0)) {
      return NextResponse.json({ success: false, error: "Amount must be > 0" }, { status: 400 });
    }

    // ---- DEBUG: what server sees (masked) ----
    console.log(
      "PP ENV check:",
      "CID_PREFIX", (process.env.PAYPAL_CLIENT_ID || "").slice(0, 6),
      "CID_LEN", (process.env.PAYPAL_CLIENT_ID || "").length,
      "SEC_LEN", (process.env.PAYPAL_CLIENT_SECRET || "").length,
      "ENV/MODE", MODE
    );

    // 1) get OAuth token (from consolidated helper)
    const token = await getPayPalAccessToken();

    // 2) create payout (single item)
    const res = await fetch(`${API_BASE}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout from Linkmint",
          email_message: MODE === "live"
            ? "You received a payout from Linkmint."
            : "You received a payout from Linkmint (sandbox).",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: amount, currency: "USD" },
            note,
            receiver: receiverEmail,
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `PayPal payout error: ${res.status}`, details: data },
        { status: 500 }
      );
    }

    const batchId =
      data?.batch_header?.payout_batch_id ??
      data?.batch_header?.sender_batch_header?.sender_batch_id ??
      null;

    // 3) Audit log
    await logPayPalPayoutEvent({
      userId: null, // unknown in this test route
      receiverEmail,
      amount: amountNum,
      paypalBatchId: batchId,
      transactionId: null, // txn id isn't returned at creation time
      note,
    });

    return NextResponse.json({
      success: true,
      receiverEmail,
      amount,
      batchId,
      raw: data,
    });
  } catch (err: any) {
    console.error("test-payout error:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
