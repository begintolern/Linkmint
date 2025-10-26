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
 * Attempts to read USER_WARNING entries from:
 * 1) Prisma models (systemLog/auditLog)
 * 2) Raw SQL table "SystemLog" (fallback created by safeAuditLog)
 */
async function readWarnings(limit: number) {
  const anyp = prisma as any;

  const normalize = (rows: any[]) =>
    rows.map((r) => {
      let parsed: any = undefined;
      try {
        parsed =
          r.json && typeof r.json === "string" ? JSON.parse(r.json) : r.json;
      } catch {
        parsed = r.json;
      }
      return {
        id: r.id ?? r.ID ?? r.pk ?? undefined,
        createdAt: r.createdAt ?? r.created_at ?? r.timestamp ?? r.createdat ?? undefined,
        type: (r.type ?? "").toString(),
        message: r.message ?? "",
        json: parsed,
      };
    });

  // 1) Try Prisma systemLog
  try {
    if (anyp.systemLog?.findMany) {
      const rows = await anyp.systemLog.findMany({
        where: { type: "USER_WARNING" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return normalize(rows);
    }
  } catch {}

  // 2) Try Prisma auditLog
  try {
    if (anyp.auditLog?.findMany) {
      const rows = await anyp.auditLog.findMany({
        where: { type: "USER_WARNING" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return normalize(rows);
    }
  } catch {}

  // 3) Raw SQL fallback to "SystemLog"
  try {
    // Ensure table exists (noop if it already does)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemLog" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "json" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id","type","message","json","createdAt"
       FROM "SystemLog"
       WHERE "type" = 'USER_WARNING'
       ORDER BY "createdAt" DESC
       LIMIT ${Number(limit) || 50}`
    );

    return normalize(rows);
  } catch {
    // Final fallback: nothing
  }

  return [];
}

/**
 * GET /api/admin/warnings/list?limit=50
 * Lists recent USER_WARNING entries from logs. Read-only.
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
