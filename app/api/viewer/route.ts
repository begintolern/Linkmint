// app/api/viewer/route.ts
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/guards";
import { ACTIVE_MARKET, IS_MARKET_PH } from "@/lib/config/market";

export async function GET() {
  try {
    const v = await getViewer(); // { id, email, role, region }
    return NextResponse.json({
      ok: true,
      viewer: v,
      market: {
        active: ACTIVE_MARKET,      // "PH" (for current launch)
        isPH: IS_MARKET_PH,         // true during PH-only
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
