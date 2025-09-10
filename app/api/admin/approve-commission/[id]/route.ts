// app/api/admin/approve-commission/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { CommissionStatus } from "@prisma/client";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  // Admin auth
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const id = params.id;

    const existing = await prisma.commission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Already paid? bail
    if (existing.status === CommissionStatus.PAID) {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }

    // Already approved? just echo back
    if (existing.status === CommissionStatus.APPROVED) {
      return NextResponse.json({ success: true, commission: existing });
    }

    // Otherwise move to APPROVED (from UNVERIFIED / PENDING / etc.)
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: CommissionStatus.APPROVED },
    });

    await prisma.eventLog.create({
      data: {
        userId: existing.userId,
        type: "commission",
        message: `Commission ${id} approved (manual)`,
        detail: `Amount ${Number(existing.amount)}`,
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (err) {
    console.error("PATCH /api/admin/approve-commission/[id] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
