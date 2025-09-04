// app/api/admin/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";

/**
 * GET /api/admin/commissions?limit=20&cursor=<id>&status=Pending|Approved|Paid|Rejected
 */
export async function GET(req: NextRequest) {
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) return gate.res;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 50);
  const cursor = url.searchParams.get("cursor"); // commission.id
  const status = url.searchParams.get("status") as
    | "Pending"
    | "Approved"
    | "Paid"
    | "Rejected"
    | null;

  const where: any = {};
  if (status) where.status = status;

  const rows = await prisma.commission.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      paidOut: true,
      type: true,
      source: true,
      description: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const next = rows.pop()!;
    nextCursor = next.id;
  }

  const out = rows.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ success: true, rows: out, nextCursor });
}
