// app/api/merchant-rules/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/auth/guards";
import {
  canViewAllRegions,
  effectiveUserRegion,
  normalizeRegion,
} from "@/lib/config/market";

// Utility: safe integer parsing
function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  try {
    const viewer = await getViewer(); // { id, email, role: "admin" | "user" }
    const { searchParams } = new URL(req.url);

    const page = toInt(searchParams.get("page"), 1);
    const limit = Math.min(100, toInt(searchParams.get("limit"), 25));
    const offset = (page - 1) * limit;

    const requestedRegion = (searchParams.get("region") || "").toUpperCase();
    const wantsAll =
      searchParams.get("all") === "1" || searchParams.get("all") === "true";

    // Detect admin either from session OR cookie fallback
    const isAdmin =
      viewer.role === "admin" ||
      req.cookies.get("role")?.value === "admin";

    // PH-only launch rules:
    // - Only admins may request ?all=1 (see everything)
    // - Non-admins are always forced to PH
    const allowAll = canViewAllRegions(isAdmin ? "admin" : "user", wantsAll);

    // Decide which "market" to filter by. Our schema uses `market` (e.g., "PH" | "US"),
    // not `region`. We normalize any incoming value to our known codes.
    let where: any = {};
    if (allowAll) {
      // Admins viewing all can still narrow by explicit region if provided.
      const maybeRegion = normalizeRegion(requestedRegion);
      if (requestedRegion) {
        // If admin passed ?region=US (or PH/GLOBAL), apply it.
        where.market = maybeRegion;
      } // else: no market filter (all)
    } else {
      // For non-admin (or admin not requesting all), compute effective region,
      // which PH-locks regular users during PH launch.
      const eff = effectiveUserRegion(isAdmin ? "admin" : "user", requestedRegion);
      where.market = eff;
    }

    // Optional: simple name/domain search
    const q = searchParams.get("q")?.trim();
    if (q) {
      where.OR = [
        { merchantName: { contains: q, mode: "insensitive" } },
        { domainPattern: { contains: q, mode: "insensitive" } },
      ];
    }

    // Fetch rows + total count (order newest first when available)
    const [items, total] = await Promise.all([
      prisma.merchantRule.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }) as any,
      prisma.merchantRule.count({ where }) as any,
    ]);

    // Optional debug echo of legacy response shape
    const debug = searchParams.get("debug") === "1";
    if (debug) {
      return NextResponse.json({
        ok: true,
        page,
        limit,
        total,
        canViewAll: allowAll,
        items,
        merchants: items, // legacy alias
      });
    }

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      canViewAll: allowAll,
      items,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("merchant-rules/list error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * Note:
 * Creation/updates are handled in dedicated routes (e.g., /create, /update).
 * We intentionally keep this file read-only to avoid type drift vs. your schema.
 */
