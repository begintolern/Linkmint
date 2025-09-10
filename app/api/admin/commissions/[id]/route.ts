// app/api/admin/commissions/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { CommissionStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  const id = params.id;
  const { action } = (await req.json()) as { action: "approve" | "pay" };

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (action === "approve") {
    if (commission.status === CommissionStatus.PAID) {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }
    if (commission.status === CommissionStatus.APPROVED) {
      return NextResponse.json({ success: true, commission });
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: CommissionStatus.APPROVED },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "commission",
        message: `Commission ${id} approved (manual)`,
        detail: `Amount ${Number(commission.amount)}`,
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  }

  if (action === "pay") {
    if (commission.status !== CommissionStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "Only approved commissions can be paid" },
        { status: 400 }
      );
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: CommissionStatus.PAID, paidOut: true },
    });

    await prisma.eventLog.create({
      data: {
        userId: commission.userId,
        type: "commission",
        message: `Commission ${id} marked paid (manual)`,
        detail: `Amount ${Number(commission.amount)}`,
      },
    });

    return NextResponse.json({ success: true, commission: updated });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
