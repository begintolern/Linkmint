// app/api/user/overrides/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

// Local string type so we don't import Prisma enums
type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED" | string;

type Totals = { pending: number; approved: number; paid: number };
type Ok = { success: true; totals: Totals };
type Err = { success: false; error: string };

export async function GET(req: NextRequest): Promise<NextResponse<Ok | Err>> {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Cast just the where clause (or type condition) to any to bypass enum typing
    const rows = await prisma.commission.findMany({
      where: {
        userId: user.id,
        // Any of these three work; pick one:
        // type: "override_bonus" as any,
        // type: { equals: "override_bonus" } as any,
        ...( { type: "override_bonus" } as any ),
      },
      select: { amount: true, status: true },
    });

    let pending = 0, approved = 0, paid = 0;

    for (const r of rows) {
      const st = (r.status as CommissionStatus) || "";
      const amt = Number(r.amount) || 0;
      if (st === "PENDING") pending += amt;
      else if (st === "APPROVED") approved += amt;
      else if (st === "PAID") paid += amt;
    }

    return NextResponse.json({ success: true, totals: { pending, approved, paid } });
  } catch (err) {
    console.error("overrides/summary error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
