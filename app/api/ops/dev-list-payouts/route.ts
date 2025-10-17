export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/**
 * GET /api/ops/dev-list-payouts?details=commission:XYZ&userId=...&take=20
 * - details: substring match (e.g., "commission:cmgsn8w1u000cpl2y1i6a8p71")
 * - userId: optional filter
 * - take: default 20 (max 50)
 */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const details = searchParams.get("details") ?? "";
  const userId = searchParams.get("userId") ?? undefined;
  const take = Math.min(50, Math.max(1, Number(searchParams.get("take") ?? 20)));

  const rows = await prisma.payout.findMany({
    take,
    where: {
      ...(userId ? { userId } : {}),
      ...(details ? { details: { contains: details } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      amount: true,
      method: true,
      status: true,
      createdAt: true,
      details: true,
    },
  });

  return NextResponse.json({ ok: true, payouts: rows });
}
