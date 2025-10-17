// app/api/ops/test-split/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

// Usage:
// /api/ops/test-split?gross=1000&active=1  -> gross in cents, active 1/0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grossStr = searchParams.get("gross") ?? "0";
    const activeStr = searchParams.get("active") ?? "0";

    const grossCents = Math.max(0, Math.floor(Number(grossStr)));
    const isReferralActive = activeStr === "1" || activeStr.toLowerCase?.() === "true";

    const split = calcSplit({
      grossCents,
      isReferralActive,
    });

    return NextResponse.json({
      ok: true,
      input: { grossCents, isReferralActive },
      split,
      // convenience: also show dollars
      usd: {
        invitee: (split.inviteeCents / 100).toFixed(2),
        referrer: (split.referrerCents / 100).toFixed(2),
        platform: (split.platformCents / 100).toFixed(2),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}
