// app/api/referrals/evaluate/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { evaluateReferralBadges } from "@/lib/referrals/evaluateReferralBadges";

type MySession = Session & { user?: { id?: string; email?: string | null } };

export async function POST() {
  try {
    const session = (await getServerSession(authOptions)) as MySession | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await evaluateReferralBadges(userId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("POST /api/referrals/evaluate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
