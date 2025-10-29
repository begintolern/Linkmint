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

    // Determine query scope
    let where: any = {};
    if (isAdmin && wantsAll) {
      // no region filter
      where = {};
    } else {
      // non-admins must be scoped to a region; default to "US" if not provided
      const region = requestedRegion || "US";
      // If your model uses a different column name, adjust here.
      // @ts-ignore - keep loose to avoid schema drift compile error
      where.region = region;
    }

    // Fetch rows + count (order by recent first)
    const [items, total] = await Promise.all([
      prisma.merchantRule.findMany({
        where,
        skip: offset,
        take: limit,
        // Adjust fields to your schema as needed; we keep it permissive
        // @ts-ignore
        orderBy: { updatedAt: "desc" },
      }) as any,
      prisma.merchantRule.count({ where }) as any,
    ]);

    // Return both keys to maintain backward compatibility with any callers
    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      canViewAll: isAdmin, // inform client whether the toggle should be shown
      items,
      merchants: items, // <— legacy shape preserved
    });
  } catch (err: any) {
    // If the guards throw a Response (403/401), pass it through
    if (err instanceof Response) return err;
    console.error("merchant-rules/list error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// (Optional) POST handler if you previously supported create via this route.
// Enforce admin on any mutations.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(); // hard gate
    const body = await req.json();

    // Adjust to your schema fields
    // Example minimal upsert by unique {slug, region}
    const { slug, region, name, rulesJson } = body || {};
    if (!slug || !region) {
      return NextResponse.json({ ok: false, error: "slug and region are required" }, { status: 400 });
    }

    // @ts-ignore
    const saved = await prisma.merchantRule.upsert({
      where: { slug_region: { slug, region } }, // adjust if your unique is different
      update: {
        name,
        // @ts-ignore
        rulesJson,
      },
      create: {
        slug,
        region,
        name,
        // @ts-ignore
        rulesJson,
      },
    });

    // Keep response consistent
    return NextResponse.json({ ok: true, item: saved, merchant: saved });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("merchant-rules/list POST error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
