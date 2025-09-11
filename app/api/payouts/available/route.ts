// app/api/payouts/available/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { CommissionStatus } from "@prisma/client";

export async function GET(_req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Sum of APPROVED, unpaid commissions for this user
  const sum = await prisma.commission.aggregate({
    where: {
      userId: user.id,
      status: CommissionStatus.APPROVED,
      paidOut: false,
    },
    _sum: { amount: true },
  });

  const amount = Number(sum._sum.amount ?? 0);
  return NextResponse.json({ success: true, amount });
}
