// app/api/referrals/status/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ✅ runtime
import type { Session } from "next-auth";          // ✅ types
import { authOptions } from "@/lib/auth/options";
import { checkReferralBonus } from "@/lib/referrals/checkReferralBonus";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = await checkReferralBonus(email);
    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("referrals/status error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
