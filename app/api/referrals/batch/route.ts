// app/api/referrals/batch/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { createReferralBatch } from "@/lib/referrals/createReferralBatch";
import { evaluateReferralBadges } from "@/lib/referrals/evaluateReferralBadges";

export async function POST(req: NextRequest) {
  try {
    const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!jwt || !jwt.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up the user by email
    const me = await prisma.user.findUnique({
      where: { email: jwt.email as string },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pass the userId to batch + badge evaluators
    await createReferralBatch(me.id);
    const badgeResult = await evaluateReferralBadges(me.id);

    return NextResponse.json({
      success: true,
      message: "Batch created and badges evaluated.",
      badgeResult,
    });
  } catch (err: any) {
    console.error("POST /api/referrals/batch error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
