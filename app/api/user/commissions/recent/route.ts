// app/api/user/commissions/recent/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

type Ok = {
  success: true;
  items: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    // computed splits (invitee/referrer/platform) in dollars
    inviteeShare: number;
    referrerShare: number;
    platformShare: number;
  }>;
  nextCursor: string | null;
};
type Err = { success: false; error: string };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest): Promise<NextResponse<Ok | Err>> {
  try {
    const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!jwt?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: jwt.email },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 20);
    const cursor = searchParams.get("cursor");

    const rows = await prisma.commission.findMany({
      where: { userId: me.id },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, status: true, createdAt: true },
    });

    const items = rows.map((r) => {
      const amt = Number(r.amount);
      const inviteeShare = round2(amt * 0.8);
      const referrerShare = round2(amt * 0.05);
      const platformShare = round2(amt - inviteeShare - referrerShare);
      return {
        id: r.id,
        amount: amt,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        inviteeShare,
        referrerShare,
        platformShare,
      };
    });

    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

    return NextResponse.json({ success: true, items, nextCursor });
  } catch (err) {
    console.error("GET /api/user/commissions/recent error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
