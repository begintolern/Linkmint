// app/api/payouts/provider/PH_GCASH/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/utils/cookieAuth";
export async function GET() {
  try {
    requireUser(); // blocks anonymous, allows any logged-in user
    return NextResponse.json({
      ok: true,
      provider: "PH_GCASH",
      ready: false,
      mode: "PROVISIONED",
      missingEnv: ["GCASH_CLIENT_ID", "GCASH_SECRET"],
    });
  } catch (e: any) {
    const status = e?.status ?? (e?.message === "Unauthorized" ? 401 : 500);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status });
  }
}
