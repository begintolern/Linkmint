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

// Lists recent commissions with only safe fields (no schema guessing)
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const take = Math.min(50, Math.max(1, Number(searchParams.get("take") ?? 10)));

  const rows = await prisma.commission.findMany({
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, commissions: rows });
}
