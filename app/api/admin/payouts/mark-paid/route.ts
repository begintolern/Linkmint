export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    if (!me || (me.role ?? "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { payoutId, externalPayoutId } = await req.json();
    if (!payoutId) {
      return NextResponse.json({ success: false, error: "Missing payoutId" }, { status: 400 });
    }

    // Use transactionId (exists in your schema) instead of externalPayoutId
    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        statusEnum: "PAID" as any,
        transactionId: externalPayoutId ?? null, // <- write here
        paidAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        statusEnum: true,
        provider: true,
        netCents: true,
        receiverEmail: true,
        transactionId: true,
        paidAt: true,
      },
    });

    await prisma.eventLog.create({
      data: {
        userId: me.id,
        type: "ADMIN_PAYOUT_MARK_PAID",
        message: `Marked payout ${updated.id} as PAID for user ${updated.userId}`,
      },
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (e: any) {
    // If record not found, return 404 instead of 500
    if (e?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 });
    }
    console.error("POST /api/admin/payouts/mark-paid error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
