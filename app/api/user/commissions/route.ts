// app/api/user/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payouts = await prisma.payout.findMany({
      where: { userId: user.id },
    });

    let pending = 0;
    let approved = 0;
    let paid = 0;

    payouts.forEach((\1: any) => {
      const status = payout.status.toLowerCase(); // ✅ Normalize here

      if (status === "pending") {
        pending += payout.amount;
      } else if (status === "approved") {
        approved += payout.amount;
      } else if (status === "paid") {
        paid += payout.amount;
      }
    });

    return NextResponse.json({
      pending,
      approved,
      paid,
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
