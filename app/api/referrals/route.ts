// app/api/referrals/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { addDays } from "date-fns";

type RefUser = { email: string | null };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        referralGroup: {
          select: {
            startedAt: true,
            users: { select: { email: true } },
          },
        },
      },
    });

    if (!user || !user.referralGroup) {
      return NextResponse.json(
        { error: "User or referral group not found" },
        { status: 404 }
      );
    }

    const referredUsers =
      (user.referralGroup.users as RefUser[] | null | undefined)?.filter(
        (u: RefUser) => !!u.email && u.email !== user.email
      ).map((u: RefUser) => u.email as string) ?? [];

    const startedAt = user.referralGroup.startedAt;
    const expiresAt = startedAt
      ? addDays(new Date(startedAt), 90).toISOString()
      : null;

    return NextResponse.json({
      referralLink: `https://linkmint.co/signup?ref=${user.id}`,
      totalReferrals: referredUsers.length,
      isActive: referredUsers.length >= 3,
      expiresAt,
    });
  } catch (error: any) {
    console.error("API /referrals error:", error?.message, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
