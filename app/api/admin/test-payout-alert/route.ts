// app/api/admin/test-payout-alert/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/utils/adminGuard";
// import { sendPayoutAlert } from "@/lib/alerts/sendPayoutAlert"; // optional: uncomment to actually send

export async function POST() {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: gate.status });
    }

    // If you want to actually send the alert, uncomment and provide target + amount:
    // await sendPayoutAlert("test@example.com", 12.34);

    return NextResponse.json({ success: true, message: "Payout alert triggered." });
  } catch (err) {
    console.error("test-payout-alert error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
