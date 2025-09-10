// app/api/admin/trigger-payout/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { CommissionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const body = (await req.json()) as { id: string };
    const id = body?.id?.trim();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const c = await prisma.commission.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, amount: true, paidOut: true },
    });
    if (!c) return NextResponse.json({ success: false, error: "Commission not found" }, { status: 404 });

    // Must be APPROVED before payout trigger (no PROCESSING status in enum)
    if (c.status !== CommissionStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: `Commission must be APPROVED, got ${c.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.commission.update({
      where: { id: c.id },
      data: { status: CommissionStatus.PAID, paidOut: true },
    });

    await prisma.eventLog.create({
      data: {
        userId: c.userId,
        type: "commission",
        message: `Commission ${c.id} paid (trigger-payout)`,
        detail: `Amount ${Number(c.amount)}`,
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (err) {
    console.error("POST /api/admin/trigger-payout error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
