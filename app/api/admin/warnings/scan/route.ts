// app/api/admin/warnings/scan/route.ts
export const runtime = "nodejs"; // ensure Prisma runs in Node.js

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";
import { notifyWarning } from "@/lib/notify"; // 👈 send optional Telegram alerts

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
 * POST /api/admin/warnings/scan?lookbackHours=24&limit=200
 * Manually triggers a read-only warnings scan and emits alerts.
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

    // audit log summary
    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Manual warnings scan complete – ${warnings.length} found`,
      json: { lookbackHours, limit, count: warnings.length },
    });

    // fire-and-forget Telegram alerts (no-op if env not set)
    // intentionally not awaited in series to avoid blocking; still awaited as a group for Node runtimes
    await Promise.all(
      warnings.map((w) =>
        notifyWarning({
          userId: w.userId,
          type: w.type,
          message: w.message,
          evidence: w.evidence,
          createdAt: w.createdAt,
        })
      )
    );

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
