// app/api/referrals/evaluate/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { evaluateReferralBadges } from "@/lib/referrals/evaluateReferralBadges";

export async function POST(req: NextRequest) {
  try {
    const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!jwt || !jwt.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badge = await evaluateReferralBadges(jwt.email);
    return NextResponse.json({ success: true, message: "Badge evaluated", badge });
  } catch (err) {
    console.error("POST /api/referrals/evaluate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
