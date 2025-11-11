// app/api/links-trend/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Simple trend API for dashboard charts.
 * Returns a grouped count of recent SmartLinks created by the user.
 * Frontend should pass ?ids=comma,separated,ids to limit scope.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",") : [];

    let data;

    if (ids.length > 0) {
      // Get click counts or link creation timestamps for provided IDs
      data = await prisma.smartLink.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          createdAt: true,
        },
      });
    } else {
      // fallback: show the last 10 links
      data = await prisma.smartLink.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
        },
      });
    }

    const trend = data.map((item) => ({
      id: item.id,
      timestamp: item.createdAt,
    }));

    return NextResponse.json({ ok: true, trend });
  } catch (e: any) {
    console.error("[links-trend] error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
