// app/api/admin/referral-groups/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  const email = session?.user?.email || null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if ((me?.role ?? "").toUpperCase() !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Build groups from users who have referredById (works even if there's no ReferralGroup model)
  const referredUsers = await prisma.user.findMany({
    where: { referredById: { not: null } },
    select: { id: true, email: true, name: true, createdAt: true, referredById: true },
    orderBy: { createdAt: "desc" },
  });

  const inviterIds = Array.from(new Set(referredUsers.map(u => u.referredById!).filter(Boolean)));
  const inviters = inviterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: inviterIds } },
        select: { id: true, email: true, name: true, referralCode: true, createdAt: true },
      })
    : [];

  const groups = inviters.map(inviter => ({
    inviter,
    referrals: referredUsers.filter(u => u.referredById === inviter.id),
  }));

  return NextResponse.json({ ok: true, count: groups.length, groups });
}
