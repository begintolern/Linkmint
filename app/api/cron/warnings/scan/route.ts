// app/api/cron/warnings/scan/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";
import { notifyWarning } from "@/lib/notify";

const prisma = new PrismaClient();

function isCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret") || "";
  return header === secret;
}

/**
 * POST /api/cron/warnings/scan?lookbackHours=24&limit=200
 * Triggered by your scheduler; emits Telegram alerts for findings.
 */
export async function POST(req: NextRequest) {
  if (!isCron(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    const warnings = await scanWarnings(prisma, { lookbackHours, limit });

    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Cron warnings scan complete – ${warnings.length} found`,
      json: { lookbackHours, limit, count: warnings.length },
    });

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
      message: "Cron warnings scan failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "SCAN_FAILED" }, { status: 500 });
  }
}
