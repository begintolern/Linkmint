// app/api/admin/test-trustscore-alert/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/utils/adminGuard";
// import { sendAlert } from "@/lib/telegram/sendAlert"; // optional: uncomment to actually send

export async function POST() {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: gate.status });
    }

    // If you want to actually send the alert, uncomment this:
    // await sendAlert("TrustScore test alert ✅");

    return NextResponse.json({ success: true, message: "TrustScore alert triggered." });
  } catch (err) {
    console.error("test-trustscore-alert error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
