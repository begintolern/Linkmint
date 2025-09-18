// app/api/admin/compliance/events/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SECRET = process.env.ADMIN_CRON_SECRET || "";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("secret") || "";
  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const items = await prisma.complianceEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, items });
}
