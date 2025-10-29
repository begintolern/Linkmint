// app/api/merchant-rules/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/auth/guards";

// Safe int parsing
function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

// Helper: simple admin check from cookie (used only for debug echo)
function isCookieAdmin(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  return /(?:^|;\s*)role=admin(?:;|$)/i.test(cookie);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = toInt(url.searchParams.get("page"), 1);
  const limit = Math.min(100, toInt(url.searchParams.get("limit"), 25));
  const offset = (page - 1) * limit;
  const wantDebug = (url.searchParams.get("debug") || "").toLowerCase() === "1";

  try {
    // Soft viewer (doesn't throw); we still scope UI options based on role
    const viewer = await getViewer();
    const isAdmin = viewer.role === "admin";

    // --- Try the Prisma model dynamically (no TS complaints) ---
    const client: any = prisma as any;
    const model =
      client.merchantRule ||
      client.merchantRules ||
      client.MerchantRule ||
      client.Merchantrule ||
      null;

    if (!model) {
      // Give a helpful message in debug for admins
      if (wantDebug && isCookieAdmin(req)) {
        return NextResponse.json(
          {
            ok: false,
            error: "ModelNotFound",
            hint:
              "Prisma client has no merchantRule* model. Run /api/admin/db-tables to see table names or share the MerchantRule model from prisma/schema.prisma.",
          },
          { status: 500 }
        );
      }
      throw new Error("Merchant model not found in Prisma client");
    }

    // Minimal, schema-agnostic read: no where, no orderBy assumptions
    const [items, total] = await Promise.all([
      model.findMany({
        skip: offset,
        take: limit,
      }),
      model.count(),
    ]);

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      canViewAll: isAdmin,
      items,
      merchants: items, // legacy alias for older clients
    });
  } catch (err: any) {
    // For admins with ?debug=1, show the real message to speed up diagnosis
    if (wantDebug && isCookieAdmin(req)) {
      return NextResponse.json(
        {
          ok: false,
          error: String(err?.message || err),
          stack: err?.stack || null,
        },
        { status: 500 }
      );
    }
    // Generic for everyone else
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// Writes disabled until schema alignment
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Write operations are disabled on this route (not implemented)." },
    { status: 501 }
  );
}
