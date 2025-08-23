// app/api/admin/payouts/queue/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

/**
 * Returns commissions ready to pay (Approved + not paid).
 * Supports cursor pagination and optional email contains filter.
 *
 * Query:
 *   ?limit=20
 *   ?cursor=<commissionId>
 *   ?email=<filter by user email contains>
 */
export async function GET(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const cursor = searchParams.get("cursor") || null;
    const emailFilter = (searchParams.get("email") || "").trim();

    // ✅ Relation filter must use `is` when filtering by fields on the related model
    const where = {
      status: "Approved" as const,
      paidOut: false,
      ...(emailFilter
        ? {
            user: {
              is: {
                email: { contains: emailFilter, mode: "insensitive" as const },
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
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

    return NextResponse.json({
      success: true,
      items: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        email: r.user?.email ?? null,
        name: r.user?.name ?? null,
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (err) {
    console.error("GET /api/admin/payouts/queue error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
