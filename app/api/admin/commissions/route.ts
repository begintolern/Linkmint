// app/api/admin/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

/**
 * Simple, explicit split rules for display (can be moved to DB later):
 * - User: 90%
 * - Referrer override: 5%
 * - Linkmint margin: 5%
 */
const SPLIT = {
  USER: 0.90,
  REFERRER: 0.05,
  PLATFORM: 0.05,
};

function withSplits(amount: number) {
  const userShare = +(amount * SPLIT.USER).toFixed(2);
  const referrerShare = +(amount * SPLIT.REFERRER).toFixed(2);
  const platformShare = +(amount * SPLIT.PLATFORM).toFixed(2);
  // if rounding leaves a penny off, give it to the user
  const total = +(userShare + referrerShare + platformShare).toFixed(2);
  const diff = +(amount - total).toFixed(2);
  return {
    userShare: +(userShare + diff).toFixed(2),
    referrerShare,
    platformShare,
  };
}

export async function GET(req: NextRequest) {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);
    const cursor = searchParams.get("cursor");

    const items = await prisma.commission.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        type: true,
        status: true,
        paidOut: true,
        source: true,
        description: true,
        user: { select: { id: true, email: true, name: true, referredById: true } },
      },
    });

    const enriched = items.map((it) => {
      const splits = withSplits(Number(it.amount));
      return {
        ...it,
        ...splits, // userShare, referrerShare, platformShare
        hasReferrer: !!it.user?.referredById,
      };
    });

    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    return NextResponse.json({ success: true, items: enriched, nextCursor, splitPolicy: SPLIT });
  } catch (err) {
    console.error("GET /api/admin/commissions error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
