// app/api/admin/payouts/queue/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { Prisma, CommissionStatus } from "@prisma/client";

/**
 * GET /api/admin/payouts/queue?limit=50&email=foo@example.com&cursor=<id>
 * Returns a page of APPROVED & unpaid commissions to be queued for payout.
 */
export async function GET(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);
  const emailFilter = (url.searchParams.get("email") || "").trim();
  const cursor = url.searchParams.get("cursor") || null;

  // Build a typed where filter
  const where: Prisma.CommissionWhereInput = {
    status: CommissionStatus.APPROVED,
    paidOut: false,
    ...(emailFilter
      ? {
          user: {
            is: {
              email: { contains: emailFilter, mode: "insensitive" },
            },
          },
        }
      : {}),
  };

  const rows = await prisma.commission.findMany({
    where,
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      amount: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

  return NextResponse.json({
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.user?.email ?? "",
      amount: Number(r.amount),
      createdAt: r.createdAt,
    })),
    nextCursor,
  });
}
