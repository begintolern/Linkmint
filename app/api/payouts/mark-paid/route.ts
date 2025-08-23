// app/api/admin/payouts/mark-paid/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { payoutId, externalPayoutId, notes } = await req.json();
    if (!payoutId || !externalPayoutId) {
      return NextResponse.json({ success: false, error: "Missing payoutId or externalPayoutId" }, { status: 400 });
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        externalPayoutId,
        status: "PAID",          // legacy string
        statusEnum: "PAID",      // new enum
        paidAt: new Date(),
        notes: notes ?? null,
      },
      select: { id: true, status: true, statusEnum: true, externalPayoutId: true, paidAt: true },
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (e) {
    console.error("POST /api/admin/payouts/mark-paid error", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
