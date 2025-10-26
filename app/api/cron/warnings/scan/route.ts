// app/api/cron/warnings/scan/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";

const prisma = new PrismaClient();

/**
 * Auth helper: checks x-cron-secret header against CRON_SECRET env.
 */
function isCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || "";
  const headerSecret = req.headers.get("x-cron-secret") || "";
  return !!cronSecret && headerSecret === cronSecret;
}

/**
 * POST /api/cron/warnings/scan
 * Scheduled, read-only warnings scan (for Railway/Cloud cron).
 */
export async function POST(req: NextRequest) {
  if (!isCron(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    const warnings = await scanWarnings(new PrismaClient(), { lookbackHours, limit });

    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Cron warnings scan complete – ${warnings.length} found`,
      json: { lookbackHours, limit, count: warnings.length },
    });

    return NextResponse.json({ ok: true, count: warnings.length }, { status: 200 });
  } catch (err: any) {
    await safeAuditLog(prisma, {
      type: "ERROR",
      message: "Cron warnings scan failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "SCAN_FAILED" }, { status: 500 });
  }
}
