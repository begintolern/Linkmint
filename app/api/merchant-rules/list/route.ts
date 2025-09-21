import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/merchant-rules/list?market=PH
 * - market: "US" | "PH" | "SG" | ...
 * - defaults to "US" if not provided
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const market = (url.searchParams.get("market") || "US").toUpperCase();

    // Use raw SQL to avoid Prisma model type drift during rollout
    const merchants = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM "MerchantRule"
      WHERE "active" = true
        AND UPPER(COALESCE("market", 'US')) = $1
      ORDER BY "merchantName" ASC
      `,
      market
    );

    return NextResponse.json({ ok: true, market, merchants });
  } catch (err) {
    console.error("merchant-rules/list GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to load merchant rules." },
      { status: 500 }
    );
  }
}
