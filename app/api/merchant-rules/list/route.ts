// app/api/merchant-rules/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional filters:
    //  - /api/merchant-rules/list?active=true|false
    //  - /api/merchant-rules/list?q=flower
    const activeParam = searchParams.get("active");
    const q = searchParams.get("q")?.trim();

    const where: any = {};
    if (activeParam === "true") where.active = true;
    else if (activeParam === "false") where.active = false;

    if (q) {
      where.OR = [
        { merchantName: { contains: q, mode: "insensitive" } },
        { domainPattern: { contains: q, mode: "insensitive" } },
      ];
    }

    const rules = await prisma.merchantRule.findMany({
      where,
      orderBy: { merchantName: "asc" },
      select: {
        id: true,
        active: true,
        merchantName: true,
        network: true,
        domainPattern: true,
        linkTemplate: true,
        paramKey: true,
        paramValue: true,
        allowedSources: true,
        disallowed: true,
        cookieWindowDays: true,
        payoutDelayDays: true,
        commissionType: true,
        commissionRate: true,
        notes: true,
        importMethod: true,
        lastImportedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, count: rules.length, rules });
  } catch (err) {
    console.error("GET /api/merchant-rules/list error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch merchant rules" },
      { status: 500 },
    );
  }
}
