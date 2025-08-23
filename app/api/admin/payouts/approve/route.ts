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
      where: { email: String(session.user.email) },
      select: { id: true, role: true },
    });
    if (!me || (me.role ?? "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Input
    const body = await req.json();
    const { logId, payoutId, note } = body || {};
    if (!logId && !payoutId) {
      return NextResponse.json({ success: false, error: "Missing logId or payoutId" }, { status: 400 });
    }

    // If payoutId provided: approve the payout (Payout table) → PROCESSING; log an APPROVED entry in PayoutLog
    if (payoutId) {
      const payout = await prisma.payout.findUnique({
        where: { id: String(payoutId) },
        select: { id: true, userId: true, amount: true, statusEnum: true, receiverEmail: true, provider: true },
      });
      if (!payout) {
        return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 });
      }
      if (payout.statusEnum !== "PENDING") {
        return NextResponse.json({ success: false, error: `Payout is ${payout.statusEnum}, not PENDING` }, { status: 400 });
      }

      const updated = await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "PROCESSING",
          statusEnum: "PROCESSING" as any,
          approvedAt: new Date(),
        },
        select: { id: true, status: true, statusEnum: true, approvedAt: true },
      });

      await prisma.payoutLog.create({
        data: {
          userId: payout.userId,
          receiverEmail: payout.receiverEmail ?? null,
          amount: payout.amount ?? null,
          status: "APPROVED",
          note: note ?? `Admin approved payout ${payout.id} (${payout.provider})`,
        },
      });

      await prisma.eventLog.create({
        data: {
          userId: me.id,
          type: "ADMIN_PAYOUT_APPROVED",
          message: `Approved Payout ${payout.id} for user ${payout.userId}`,
        },
      });

      return NextResponse.json({ success: true, mode: "payout", payout: updated });
    }

    // If logId provided: mark the log as APPROVED; also try to move a matching Payout to PROCESSING (best-effort)
    if (logId) {
      const updatedLog = await prisma.payoutLog.update({
        where: { id: String(logId) },
        data: { status: "APPROVED", note: note ?? undefined },
        select: { id: true, userId: true, amount: true, receiverEmail: true, status: true, createdAt: true },
      });

      // Best-effort: find a PENDING payout for this user & set PROCESSING
      const maybePayout = await prisma.payout.findFirst({
        where: {
          userId: updatedLog.userId ?? undefined,
          statusEnum: "PENDING" as any,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      let payoutUpdate: any = null;
      if (maybePayout) {
        payoutUpdate = await prisma.payout.update({
          where: { id: maybePayout.id },
          data: { status: "PROCESSING", statusEnum: "PROCESSING" as any, approvedAt: new Date() },
          select: { id: true, status: true, statusEnum: true, approvedAt: true },
        });
      }

      await prisma.eventLog.create({
        data: {
          userId: me.id,
          type: "ADMIN_PAYOUT_APPROVED",
          message: `Approved payout log ${updatedLog.id} for user ${updatedLog.userId}`,
        },
      });

      return NextResponse.json({ success: true, mode: "log", payoutLog: updatedLog, payout: payoutUpdate });
    }

    // Fallback (shouldn’t reach)
    return NextResponse.json({ success: false, error: "Invalid state" }, { status: 500 });
  } catch (e: any) {
    console.error("POST /api/admin/payouts/approve error:", e);
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
