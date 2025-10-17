// app/api/ops/test-referral/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const referrerId = searchParams.get("referrerId");
  const inviteeId = searchParams.get("inviteeId");
  const grossStr = searchParams.get("gross") ?? "0";

  if (!referrerId || !inviteeId) {
    return NextResponse.json(
      { ok: false, error: "Missing referrerId or inviteeId" },
      { status: 400 }
    );
  }

  const grossCents = Math.max(0, Math.floor(Number(grossStr)));
  const active = await isReferralActiveForPair({ referrerId, inviteeId });

  const split = calcSplit({
    grossCents,
    isReferralActive: active,
  });

  return NextResponse.json({
    ok: true,
    input: { referrerId, inviteeId, grossCents },
    activeWindow: active,
    split,
    usd: {
      invitee: (split.inviteeCents / 100).toFixed(2),
      referrer: (split.referrerCents / 100).toFixed(2),
      platform: (split.platformCents / 100).toFixed(2),
    },
  });
}
