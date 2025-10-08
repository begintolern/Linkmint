// app/api/payouts/provider/[provider]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/utils/cookieAuth";

export async function GET(
  _req: Request,
  ctx: { params: { provider: string } }
) {
  try {
    // works for both normal users and admin; blocks anonymous
    requireUser();

    const key = (ctx.params.provider || "").toUpperCase();

    if (key === "PH_GCASH" || key === "GCASH") {
      return NextResponse.json({
        ok: true,
        provider: "PH_GCASH",
        ready: false,
        mode: "PROVISIONED",
        missingEnv: ["GCASH_CLIENT_ID", "GCASH_SECRET"],
      });
    }

    if (key === "PAYPAL") {
      return NextResponse.json({
        ok: true,
        provider: "PAYPAL",
        ready: true, // adjust if you want this provisioned too
        mode: "PROVISIONED",
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  } catch (e: any) {
    const status = e?.status ?? (e?.message === "Unauthorized" ? 401 : 500);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status });
  }
}
