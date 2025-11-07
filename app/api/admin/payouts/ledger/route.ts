// app/api/admin/payouts/ledger/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  return !!adminKey && got === adminKey;
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const url = new URL(req.url);

    // You can pass either userId or userEmail (one is required)
    const userId = url.searchParams.get("userId") || undefined;
    const userEmail = url.searchParams.get("userEmail") || undefined;

    // Optional filters
    const status = url.searchParams.get("status") || undefined; // PENDING | PROCESSING | PAID | FAILED
    const from = url.searchParams.get("from") || undefined;     // YYYY-MM-DD
    const to = url.searchParams.get("to") || undefined;         // YYYY-MM-DD
    const take = Math.min(Number(url.searchParams.get("take") || "200"), 1000);
    const skip = Math.max(Number(url.searchParams.get("skip") || "0"), 0);

    if (!userId && !userEmail) {
      return NextResponse.json(
        { ok: false, error: "Missing userId or userEmail" },
        { status: 400 }
      );
    }

    // Resolve user by email if needed
    let resolvedUserId = userId;
    if (!resolvedUserId && userEmail) {
      const u = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      if (!u) {
        return NextResponse.json(
          { ok: false, error: "USER_NOT_FOUND", userEmail },
          { status: 404 }
        );
      }
      resolvedUserId = u.id;
    }

    const where: any = { userId: resolvedUserId };
    if (status && status !== "ALL") where.status = status;
    if (from || to) {
      where.requestedAt = {};
      if (from) where.requestedAt.gte = new Date(`${from}T00:00:00Z`);
      if (to) where.requestedAt.lte = new Date(`${to}T23:59:59Z`);
    }

    const [user, totals, byStatus, rows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: resolvedUserId! },
        select: { id: true, email: true, name: true },
      }),
      prisma.payoutRequest.aggregate({
        where,
        _count: { _all: true },
        _sum: { amountPhp: true },
        _min: { requestedAt: true },
        _max: { processedAt: true },
      }),
      prisma.payoutRequest.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
        _sum: { amountPhp: true },
      }),
      prisma.payoutRequest.findMany({
        where,
        orderBy: [{ requestedAt: "desc" }],
        take,
        skip,
        select: {
          id: true,
          amountPhp: true,
          method: true,
          provider: true,
          status: true,
          requestedAt: true,
          processedAt: true,
          processorNote: true,
          gcashNumber: true,
          bankName: true,
          bankAccountNumber: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND", userId: resolvedUserId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user,
      summary: {
        count: totals._count._all,
        sumPhp: totals._sum.amountPhp ?? 0,
        firstRequestedAt: totals._min.requestedAt ?? null,
        lastProcessedAt: totals._max.processedAt ?? null,
        byStatus: byStatus.map((g) => ({
          status: g.status,
          count: g._count._all,
          sumPhp: g._sum.amountPhp ?? 0,
        })),
      },
      rows: rows.map((r) => ({
        ...r,
        requestedAt: r.requestedAt?.toISOString() ?? null,
        processedAt: r.processedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/payouts/ledger error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
