// app/api/dev/test-commission-alert/route.ts
import { NextResponse } from "next/server";
import recordCommission from "@/lib/engines/recordCommission";

/**
 * Dev-only endpoint to test Telegram commission alerts.
 *
 * GET /api/dev/test-commission-alert
 *
 * Safely creates a dummy commission for testing Telegram alerts.
 */
export async function GET() {
  try {
    // Your known admin user ID:
    const adminUserId = "clwzud5zr0000v4l5gnkz1oz3";

    const result = await recordCommission({
      userId: adminUserId,
      amount: 123.45,
      // type omitted -> will default to "referral_purchase"
      source: "TEST_MERCHANT",
      description: "Test Telegram commission alert",
    });

    return NextResponse.json({
      ok: true,
      message: "Test commission recorded (or attempted). Check Telegram.",
      result,
    });
  } catch (err: any) {
    console.error("[test-commission-alert] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
