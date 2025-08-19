// app/api/user/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only fetch fields we need
    const payouts = await prisma.payout.findMany({
      where: { userId: user.id },
      select: { status: true, amount: true },
    });

    let pending = 0;
    let approved = 0;
    let paid = 0;

    for (const p of payouts) {
      const status = String(p.status).toLowerCase();

      // Prisma Decimal-safe conversion
      const amount =
        typeof (p.amount as any)?.toNumber === "function"
          ? (p.amount as any).toNumber()
          : Number(p.amount);

      if (status === "pending") {
        pending += amount;
      } else if (status === "approved") {
        approved += amount;
      } else if (status === "paid") {
        paid += amount;
      }
    }

    return NextResponse.json({ pending, approved, paid });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
