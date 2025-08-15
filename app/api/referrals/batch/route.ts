// app/api/referrals/batch/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { createReferralBatch } from "@/lib/referrals/createReferralBatch";
import { evaluateReferralBadges } from "@/lib/referrals/evaluateReferralBadges";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("linkmint_token")?.value ?? "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await createReferralBatch(token);
    await evaluateReferralBadges(token);

    return NextResponse.json({ message: "Batch created and badge evaluated" });
  } catch (err) {
    console.error("POST /api/referrals/batch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
