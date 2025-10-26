// app/api/admin/warnings/list/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Auth helper: checks x-admin-key header or cookie against ADMIN_API_KEY.
 */
function isAdmin(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY || "";
  if (!adminKey) return false;
  const cookieKey = req.cookies.get("admin_key")?.value;
  const headerKey = req.headers.get("x-admin-key");
  return cookieKey === adminKey || headerKey === adminKey;
}

/**
 * Attempts to read USER_WARNING entries from common log models.
 * Returns [] if none exist (keeps things resilient).
 */
async function readWarnings(limit: number) {
  // Try common model names: systemLog or auditLog
  const anyp = prisma as any;

  // Helper to normalize rows into a common shape
  const normalize = (rows: any[]) =>
    rows
      .filter(Boolean)
      .map((r) => {
        let json: any = undefined;
        try {
          json = r.json ? (typeof r.json === "string" ? JSON.parse(r.json) : r.json) : undefined;
        } catch (_) {
          json = r.json;
        }
        return {
          id: r.id ?? r.ID ?? r.pk ?? undefined,
          createdAt: r.createdAt ?? r.created_at ?? r.timestamp ?? undefined,
          type: (r.type ?? "").toString(),
          message: r.message ?? "",
          json,
        };
      });

  // Try systemLog first
  try {
    if (anyp.systemLog?.findMany) {
      const rows = await anyp.systemLog.findMany({
        where: { type: "USER_WARNING" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return normalize(rows);
    }
  } catch (_) {}

  // Try auditLog next
  try {
    if (anyp.auditLog?.findMany) {
      const rows = await anyp.auditLog.findMany({
        where: { type: "USER_WARNING" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return normalize(rows);
    }
  } catch (_) {}

  // If neither model exists, return empty array
  return [];
}

/**
 * GET /api/admin/warnings/list?limit=50
 * Lists the most recent USER_WARNING entries (read-only).
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || "50")));

  try {
    const warnings = await readWarnings(limit);
    return NextResponse.json({ ok: true, count: warnings.length, warnings }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "LIST_FAILED", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
