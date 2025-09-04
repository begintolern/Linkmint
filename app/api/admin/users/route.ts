// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";

/**
 * GET /api/admin/users?limit=10&cursor=<id>
 * Returns latest users with simple ID cursor pagination.
 */
export async function GET(req: NextRequest) {
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
  const cursor = searchParams.get("cursor"); // user.id

  const where = {}; // (add filters later if needed)

  const rows = await prisma.user.findMany({
    where,
    take: limit + 1, // fetch one extra to detect nextCursor
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      trustScore: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const next = rows.pop()!; // remove the extra
    nextCursor = next.id;
  }

  // Serialize dates to strings for the client
  const out = rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
  }));

  return NextResponse.json({ success: true, rows: out, nextCursor });
}
