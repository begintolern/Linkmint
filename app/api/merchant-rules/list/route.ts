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

    // Build the where object without tripping Prisma's stale TS types in CI
    const where: any = { active: true };
    // @ts-ignore – CI may have a stale Prisma Client without `market` yet
    where.market = market;

    const merchants = await prisma.merchantRule.findMany({
      where,
      orderBy: [{ merchantName: "asc" }],
    });

    return NextResponse.json({ ok: true, market, merchants });
  } catch (err) {
    console.error("merchant-rules/list GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to load merchant rules." },
      { status: 500 }
    );
  }
}
