// app/api/admin/trigger-auto-payout/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { runAutoPayoutEngine } from "@/lib/payouts/autoPayoutEngine";

export async function POST() {
  try {
    await runAutoPayoutEngine();
    return NextResponse.json({ success: true, message: "Auto payout engine triggered." });
  } catch (error) {
    console.error("Auto payout error:", error);
    return NextResponse.json({ success: false, error: "Failed to trigger auto payouts." }, { status: 500 });
  }
}
