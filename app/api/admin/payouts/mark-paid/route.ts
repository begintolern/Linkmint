export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // ---- admin auth
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

    // ---- parse body
    const raw = await req.text();
    let body: any = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }

    const payoutId: string = (body?.payoutId ?? "").toString().trim();
    const createdAtStr: string = (body?.createdAt ?? "").toString().trim();
    const email: string = (body?.email ?? "").toString().trim();
    const netCents: number | null = typeof body?.netCents === "number" ? body.netCents : null;
    const externalPayoutId: string = (body?.externalPayoutId ?? "").toString().trim();

    // ---- find target payout
    let targetId = payoutId;

    if (!targetId) {
      // Fallback lookup by metadata (createdAt ~ window, email, netCents)
      const where: any = {
        statusEnum: { in: ["PENDING", "PROCESSING"] as any },
      };

      if (email) {
        where.user = { is: { email } };
      }

      if (Number.isFinite(netCents)) {
        where.netCents = netCents!;
      }

      if (createdAtStr) {
        const base = new Date(createdAtStr);
        if (!isNaN(base.getTime())) {
          const before = new Date(base.getTime() - 5 * 60 * 1000); // 5m window
          const after = new Date(base.getTime() + 5 * 60 * 1000);
          where.createdAt = { gte: before, lte: after };
        }
      }

      const candidate = await prisma.payout.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (candidate?.id) {
        targetId = candidate.id;
      }
    }

    if (!targetId) {
      return NextResponse.json({ success: false, error: "Missing payoutId" }, { status: 400 });
    }

    // ---- update payout
    const updated = await prisma.payout.update({
      where: { id: targetId },
      data: {
        statusEnum: "PAID" as any,
        transactionId: externalPayoutId || null,
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

    // optional event log
    await prisma.eventLog.create({
      data: {
        userId: me.id,
        type: "ADMIN_PAYOUT_MARK_PAID",
        message: `Marked payout ${updated.id} as PAID for user ${updated.userId}`,
      },
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 });
    }
    console.error("POST /api/admin/payouts/mark-paid error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
