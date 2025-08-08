// app/api/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prisma.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const pending = payouts
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

    const approved = payouts
      .filter((p: any) => p.status === "approved")
      .reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

    const paid = payouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

    return NextResponse.json({
      pending,
      approved,
      paid,
    });
  } catch (error) {
    console.error("Error fetching commissions summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions summary" },
      { status: 500 }
    );
  }
}
