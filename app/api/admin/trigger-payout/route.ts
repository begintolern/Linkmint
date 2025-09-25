// app/api/admin/trigger-payout/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

/**
 * POST /api/admin/trigger-payout
 * Marks a commission as PAID manually (admin only)
 */
export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const { id } = (await req.json()) as { id: string };

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    if (commission.status === "PAID") {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "PAID", paidOut: true },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "payout",
        message: `Commission ${id} manually marked paid`,
        detail: `Amount ${Number(commission.amount)}`,
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (err) {
    console.error("trigger-payout error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
