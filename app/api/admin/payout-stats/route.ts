// app/api/admin/payout-stats/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function GET() {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.status });
  }

  const [paidAgg, pendingAgg, failedAgg, lastPaid] = await Promise.all([
    prisma.payoutRequest.aggregate({
      where: { status: "PAID" },
      _sum: { amountPhp: true },
      _avg: { amountPhp: true },
      _count: { _all: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: "PENDING" },
      _sum: { amountPhp: true },
      _count: { _all: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: "FAILED" },
      _count: { _all: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: "PAID" },
      _max: { processedAt: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      totalPaid: paidAgg._sum.amountPhp ?? 0,
      paidCount: paidAgg._count._all ?? 0,
      avgPaid: paidAgg._avg.amountPhp ?? 0,
      pendingTotal: pendingAgg._sum.amountPhp ?? 0,
      pendingCount: pendingAgg._count._all ?? 0,
      failedCount: failedAgg._count._all ?? 0,
      lastPaidAt: lastPaid._max.processedAt ?? null,
    },
  });
}
