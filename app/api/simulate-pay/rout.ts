// app/api/simulate-pay/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

/**
 * POST /api/simulate-pay
 * Marks the latest approved commission as paid.
 */
export async function POST(req: Request) {
  try {
    const jwt = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
    if (!jwt?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: jwt.email },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Find most recent approved, unpaid commission
    const commission = await prisma.commission.findFirst({
      where: { userId: me.id, status: "APPROVED", paidOut: false },
      orderBy: { createdAt: "desc" },
    });

    if (!commission) {
      return NextResponse.json({ success: false, error: "No approved commissions to pay" }, { status: 404 });
    }

    const updated = await prisma.commission.update({
      where: { id: commission.id },
      data: { paidOut: true, status: "PAID" },
      select: { id: true, status: true, paidOut: true },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    console.error("simulate-pay error:", err?.message ?? err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
