export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { assertProdAdmin } from "@/lib/utils/adminGuard";
// import { sendAlert } from "@/lib/alerts/telegram";

export async function POST() {
  try {
    const gate = await assertProdAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    // await sendAlert("Commission test alert ✅");
    return NextResponse.json({ success: true, message: "Commission alert triggered." });
  } catch (err) {
    console.error("test-commission-alert error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
