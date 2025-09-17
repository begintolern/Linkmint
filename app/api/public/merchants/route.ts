// app/api/public/merchants/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/public/merchants?all=true  -> returns all with status
// GET /api/public/merchants            -> returns only ACTIVE by default
export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeAll = url.searchParams.get("all") === "true";

  const where = includeAll ? {} : { status: "ACTIVE" as const, active: true };

  const merchants = await prisma.merchantRule.findMany({
    where,
    orderBy: { merchantName: "asc" },
    select: {
      id: true,
      merchantName: true,
      network: true,
      domainPattern: true,
      commissionType: true,
      commissionRate: true,
      status: true,
      active: true,
      notes: true,
      // if you have linkTemplate or public link fields, include them here:
      // linkTemplate: true,
    },
  });

  // Normalize Decimal -> string
  const payload = merchants.map((m) => ({
    ...m,
    commissionRate:
      m.commissionRate != null ? m.commissionRate.toString() : null,
  }));

  return NextResponse.json({ merchants: payload });
}
