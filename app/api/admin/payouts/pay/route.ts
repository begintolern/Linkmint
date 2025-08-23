// app/api/admin/payouts/pay/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

type Body =
  | { ids: string[]; dryRun?: boolean }
  | { all: true; limit?: number; email?: string; dryRun?: boolean };

export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    // Find the target rows
    let targets: { id: string; userId: string; amount: number }[] = [];

    if ("ids" in body && Array.isArray(body.ids) && body.ids.length > 0) {
      const rows = await prisma.commission.findMany({
        where: { id: { in: body.ids }, status: "Approved", paidOut: false },
        select: { id: true, userId: true, amount: true },
      });
      targets = rows.map((r) => ({ id: r.id, userId: r.userId, amount: Number(r.amount) }));
    } else if ("all" in body && body.all === true) {
      const limit = Math.min(Math.max(Number((body as any).limit ?? 50), 1), 200);
      const emailFilter = (body as any).email ? String((body as any).email).trim() : "";

      const rows = await prisma.commission.findMany({
        where: {
          status: "Approved",
          paidOut: false,
          ...(emailFilter
            ? { user: { is: { email: { contains: emailFilter, mode: "insensitive" } } } }
            : {}),
        },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true, userId: true, amount: true },
      });
      targets = rows.map((r) => ({ id: r.id, userId: r.userId, amount: Number(r.amount) }));
    } else {
      return NextResponse.json({ success: false, error: "Provide {ids:[]} or {all:true}" }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({ success: true, updated: 0, totalAmount: 0, ids: [] });
    }

    if ((body as any).dryRun) {
      const totalAmount = targets.reduce((sum, t) => sum + t.amount, 0);
      return NextResponse.json({ success: true, updated: 0, totalAmount, ids: targets.map(t => t.id), dryRun: true });
    }

    // Pay them in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const ids = targets.map((t) => t.id);
      await tx.commission.updateMany({
        where: { id: { in: ids } },
        data: { status: "Paid", paidOut: true },
      });

      // Write logs (best-effort, not blocking)
      await Promise.all(
        targets.map((t) =>
          tx.eventLog.create({
            data: {
              userId: t.userId,
              type: "payout",
              message: `Commission ${t.id} marked paid (bulk)`,
              detail: `Amount ${t.amount}`,
            },
          })
        )
      );

      return { count: ids.length };
    });

    const totalAmount = targets.reduce((sum, t) => sum + t.amount, 0);
    return NextResponse.json({
      success: true,
      updated: result.count,
      totalAmount,
      ids: targets.map((t) => t.id),
    });
  } catch (err) {
    console.error("POST /api/admin/payouts/pay error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
