// app/api/user/bonus/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bonusCents: true,
      bonusEligibleUntil: true,
      bonusTier: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  let remainingDays: number | null = null;
  if (user.bonusEligibleUntil) {
    const ms = user.bonusEligibleUntil.getTime() - now.getTime();
    remainingDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({
    bonusCents: user.bonusCents,
    bonusUSD: Number((user.bonusCents / 100).toFixed(2)),
    bonusTier: user.bonusTier,
    bonusEligibleUntil: user.bonusEligibleUntil,
    remainingDays,
  });
}
