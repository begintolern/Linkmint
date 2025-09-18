// app/api/admin/compliance/events/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SECRET = process.env.ADMIN_CRON_SECRET || "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("secret") || "";
  const type = url.searchParams.get("type") || "";

  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const where = type ? { type } : {};

  const items = await prisma.complianceEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, items });
}
