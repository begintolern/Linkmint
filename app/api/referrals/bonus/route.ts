// app/api/referrals/bonus/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type GroupPayload = {
  id: string;
  startedAt: string;
  expiresAt: string | null;
  active: boolean;
  memberCount: number;
  memberIds: string[];
};

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null;
    const userId = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.referralGroup.findMany({
      where: { referrerId: userId },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
        users: { select: { id: true, email: true, createdAt: true } },
      },
    });

    const now = Date.now();

    const payload: GroupPayload[] = groups.map((g) => {
      const expiresMs = g.expiresAt ? new Date(g.expiresAt).getTime() : null;
      const active = expiresMs == null ? true : expiresMs > now;
      const memberIds = (g.users ?? []).map((u) => u.id);

      return {
        id: g.id,
        startedAt: g.startedAt.toISOString(),
        expiresAt: g.expiresAt ? g.expiresAt.toISOString() : null,
        active,
        memberCount: memberIds.length,
        memberIds,
      };
    });

    // Optional totals: how many active vs expired groups
    const totals = payload.reduce(
      (acc, g) => {
        if (g.active) acc.active += 1;
        else acc.expired += 1;
        acc.members += g.memberCount;
        return acc;
      },
      { active: 0, expired: 0, members: 0 }
    );

    return NextResponse.json({ success: true, groups: payload, totals });
  } catch (e) {
    console.error("GET /api/referrals/bonus error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
