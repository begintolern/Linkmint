// app/api/admin/logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;   // e.g. error|signup|referral|payout|trust
    const userId = searchParams.get("userId") ?? undefined;

    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (userId) whereClause.userId = userId;

    const logs = await prisma.eventLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        message: true,
        detail: true,
        userId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, logs });
  } catch (err) {
    console.error("[admin/logs] GET error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
