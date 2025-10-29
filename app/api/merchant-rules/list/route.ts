// app/api/merchant-rules/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getViewer, requireAdmin } from "@/lib/auth/guards";

// Utility: parse ints safely
function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  try {
    const viewer = await getViewer();

    const { searchParams } = new URL(req.url);
    const page = toInt(searchParams.get("page"), 1);
    const limit = Math.min(100, toInt(searchParams.get("limit"), 25));
    const offset = (page - 1) * limit;

    const requestedRegion = (searchParams.get("region") || "").toUpperCase();
    const wantsAll = ["1", "true"].includes(
      (searchParams.get("all") || "").toLowerCase()
    );

    // Admins can view all regions; users are restricted
    const isAdmin = viewer.role === "admin";

    // Determine query scope — keep loose to avoid schema drift
    let where: any = {};
    if (isAdmin && wantsAll) {
      where = {};
    } else {
      const region = requestedRegion || "US";
      // If your model doesn't have region, this will just be ignored at runtime if you remove it later.
      // @ts-ignore
      where.region = region;
    }

    const [items, total] = await Promise.all([
      prisma.merchantRule.findMany({
        where,
        skip: offset,
        take: limit,
        // Order defensively if one of these fields doesn’t exist
        // @ts-ignore
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }) as any,
      prisma.merchantRule.count({ where }) as any,
    ]);

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      canViewAll: isAdmin,
      items,
      merchants: items, // legacy alias
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("merchant-rules/list GET error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// TEMP: disable writes on this route until schema is aligned
export async function POST(_req: NextRequest) {
  try {
    await requireAdmin();
    return NextResponse.json(
      { ok: false, error: "Write operations are disabled on this route (not implemented)." },
      { status: 501 }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
}
