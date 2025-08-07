// app/api/admin/logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const logType = url.searchParams.get("type");
    const sinceParam = url.searchParams.get("since");

    const whereClause: any = {};

    if (logType && logType !== "all") {
      whereClause.type = logType;
    }

    if (sinceParam) {
      const sinceDate = new Date(Number(sinceParam));
      whereClause.createdAt = { gte: sinceDate };
    }

    const logs = await prisma.eventLogs.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
