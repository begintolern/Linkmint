// app/api/admin/payouts/approve/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Auth
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

    // Input
    const { logId, note } = await req.json();
    if (!logId) {
      return NextResponse.json({ success: false, error: "Missing logId" }, { status: 400 });
    }

    // Approve payout request in PayoutLog (string status)
    const updated = await prisma.payoutLog.update({
      where: { id: logId },
      data: {
        status: "APPROVED",
        note: note ?? undefined,
      },
      select: {
        id: true,
        status: true,
        note: true,
        userId: true,
        amount: true,
        receiverEmail: true,
        createdAt: true,
      },
    });

    // Audit
    await prisma.eventLog.create({
      data: {
        userId: me.id,
        type: "ADMIN_PAYOUT_APPROVED",
        message: `Approved payout log ${updated.id} for user ${updated.userId}`,
      },
    });

    return NextResponse.json({ success: true, payoutLog: updated });
  } catch (e) {
    console.error("POST /api/admin/payouts/approve error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
