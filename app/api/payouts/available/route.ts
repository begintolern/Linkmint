// app/api/payouts/available/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Sum of pending/approved payouts (simulate available balance logic)
    const commissions = await prisma.commission.aggregate({
      where: {
        userId: user.id,
        status: "approved",
        paidOut: false,
      },
      _sum: { amount: true },
    });

    const available = commissions._sum.amount ?? 0;

    return NextResponse.json({ success: true, available });
  } catch (e) {
    console.error("GET /api/payouts/available error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
