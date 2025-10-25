// app/api/admin/warnings/scan/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";

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
 * POST /api/admin/warnings/scan
 * Manually triggers a read-only warnings scan.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    const warnings = await scanWarnings(prisma, { lookbackHours, limit });

    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Manual warnings scan complete – ${warnings.length} found`,
      json: { lookbackHours, limit, count: warnings.length, warnings },
    });

    return NextResponse.json({ ok: true, count: warnings.length, warnings }, { status: 200 });
  } catch (err: any) {
    await safeAuditLog(prisma, {
      type: "ERROR",
      message: "Admin warnings scan failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "SCAN_FAILED" }, { status: 500 });
  }
}
