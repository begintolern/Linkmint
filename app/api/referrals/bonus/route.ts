// app/api/referrals/bonus/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { ensureBatchesFor } from "@/lib/referrals/createReferralBatch";

/**
 * Compute 5% referrer bonus from commissions earned by invitees
 * within each batch window [startedAt, expiresAt].
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Use existing helper that already knows how to gather batches + members
    const { groups } = await ensureBatchesFor(me.id);

    let pending = 0,
      approved = 0,
      paid = 0;

    for (const g of groups) {
      const start = g.startedAt ? new Date(g.startedAt) : null;
      const end = g.expiresAt ? new Date(g.expiresAt) : null;
      if (!start || !end) continue;

      const emails: string[] = Array.isArray((g as any).users)
        ? (g as any).users.map((u: any) => u?.email).filter(Boolean)
        : [];

      if (emails.length === 0) continue;

      const members = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true },
      });
      const memberIds = members.map((m) => m.id);
      if (memberIds.length === 0) continue;

      const commissions = await prisma.commission.findMany({
        where: {
          userId: { in: memberIds },
          createdAt: { gte: start, lte: end },
        },
        select: { amount: true, status: true },
      });

      for (const c of commissions) {
        const bonus = Number(c.amount ?? 0) * 0.05; // 5%
        const s = (c.status ?? "").toLowerCase();
        if (s === "pending") pending += bonus;
        else if (s === "approved") approved += bonus;
        else if (s === "paid") paid += bonus;
      }
    }

    return NextResponse.json({
      ok: true,
      bonus: { pending, approved, paid },
      batchCount: groups.length,
    });
  } catch (e: any) {
    console.error("GET /api/referrals/bonus error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
