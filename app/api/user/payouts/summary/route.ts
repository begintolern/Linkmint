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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Dev bypass flags (same behavior as before)
    const allowDev =
      process.env.ALLOW_DEV_PAYOUTS_REQUEST === "1" ||
      process.env.ALLOW_DEV_PAYOUTS_REQUEST_BYPASS === "1";
    const devUserIdParam = url.searchParams.get("devUserId") || undefined;

    // 1) Primary auth: JWT token from NextAuth (same style as commissions summary)
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    let user = null as
      | {
          id: string;
          email: string | null;
          disabled: boolean;
          deletedAt: Date | null;
        }
      | null;

    if (token?.email) {
      user = await prisma.user.findUnique({
        where: { email: token.email },
        select: {
          id: true,
          email: true,
          disabled: true,
          deletedAt: true,
        },
      });
    } else if (allowDev && devUserIdParam) {
      // 2) Dev-only fallback: explicit userId via query param
      user = await prisma.user.findUnique({
        where: { id: devUserIdParam },
        select: {
          id: true,
          email: true,
          disabled: true,
          deletedAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (user.disabled || user.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    const userId = user.id;

    // 3) Stats by status (same logic as before)
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

    // 4) Recent items (last 10)
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
    });
  } catch (err) {
    console.error("GET /api/user/payouts/summary error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
