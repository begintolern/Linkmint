export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function maskDbUrl(url?: string | null) {
  if (!url) return "unset";
  try {
    const u = new URL(url);
    return `${u.protocol}//***:***@${u.hostname}:${u.port || ""}${u.pathname}`;
  } catch {
    return "invalid";
  }
}

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  let shopeeRows: any[] = [];
  let lazadaRows: any[] = [];
  let totalMerchants = 0;

  try {
    totalMerchants = await prisma.merchantRule.count();

    shopeeRows = await prisma.merchantRule.findMany({
      where: { merchantName: { contains: "Shopee", mode: "insensitive" } },
      select: { id: true, merchantName: true, market: true, domainPattern: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    lazadaRows = await prisma.merchantRule.findMany({
      where: { merchantName: { contains: "Lazada", mode: "insensitive" } },
      select: { id: true, merchantName: true, market: true, domainPattern: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      db: maskDbUrl(url),
      error: String(e?.message || e),
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    db: maskDbUrl(url),
    totals: { merchants: totalMerchants },
    shopee: { count: shopeeRows.length, rows: shopeeRows },
    lazada: { count: lazadaRows.length, rows: lazadaRows },
  });
}
