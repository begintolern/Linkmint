// app/api/user/payouts/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

function toInt(n: unknown) {
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : 0;
}

function emptySummary() {
  return {
    PENDING: { count: 0, amountPhp: 0 },
    PROCESSING: { count: 0, amountPhp: 0 },
    PAID: { count: 0, amountPhp: 0 },
    FAILED: { count: 0, amountPhp: 0 },
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // 🚩 If we can't see a user (Railway token issue), return a "safe empty" payload
    if (!token || !token.email) {
      const summary = emptySummary();
      return NextResponse.json(
        {
          ok: true,
          user: null,
          summary,
          totals: { requests: 0, amountPhp: 0 },
          recent: [],
          unauthenticated: true,
        },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, email: true, disabled: true, deletedAt: true },
    });

    if (!user || user.disabled || user.deletedAt) {
      // If somehow the user is disabled, still don't throw a 500 – just treat as no data.
      const summary = emptySummary();
      return NextResponse.json(
        {
          ok: true,
          user: null,
          summary,
          totals: { requests: 0, amountPhp: 0 },
          recent: [],
          unauthenticated: true,
        },
        { status: 200 }
      );
    }

    const userId = user.id;

    // 1) Stats by status (payoutRequest table)
    const byStatus = await prisma.payoutRequest.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
      _sum: { amountPhp: true },
    });

    const stat = (s: Status) => {
      const g = byStatus.find((r) => r.status === s);
      return {
        count: g?._count._all ?? 0,
        amountPhp: toInt(g?._sum.amountPhp ?? 0),
      };
    };

    const summary = {
      PENDING: stat("PENDING"),
      PROCESSING: stat("PROCESSING"),
      PAID: stat("PAID"),
      FAILED: stat("FAILED"),
    };

    // 2) Recent items (last 10)
    const recent = await prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      summary,
      totals: {
        requests: Object.values(summary).reduce((a, b) => a + b.count, 0),
        amountPhp: Object.values(summary).reduce(
          (a, b) => a + b.amountPhp,
          0
        ),
      },
      recent,
      unauthenticated: false,
    });
  } catch (err) {
    console.error("GET /api/user/payouts/summary error:", err);
    // Even on error, don't throw 401 — just return an empty, safe payload.
    const summary = emptySummary();
    return NextResponse.json(
      {
        ok: true,
        user: null,
        summary,
        totals: { requests: 0, amountPhp: 0 },
        recent: [],
        unauthenticated: true,
      },
      { status: 200 }
    );
  }
}
