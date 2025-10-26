// app/api/admin/warnings/scan/route.ts
export const runtime = "nodejs"; // ensure Prisma runs in Node.js

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";
import { notifyWarning } from "@/lib/notify";
import { detectSharedPayoutEmails } from "@/lib/detectors/sharedPayoutEmail";

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

type Finding = {
  userId: string;
  type: string;
  message: string;
  evidence?: unknown;
  createdAt?: string | Date;
};

/**
 * POST /api/admin/warnings/scan?lookbackHours=24&limit=200
 * Manually triggers a read-only warnings scan + shared payout email detector, and emits alerts.
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    // 1) Existing detectors (whatever you already had in scanWarnings)
    const baseFindings = await scanWarnings(prisma, { lookbackHours, limit });

    // 2) New detector: shared payout email clusters (schema-agnostic)
    const sharedEmailFindings = await detectSharedPayoutEmails(prisma, {
      minAccounts: 2,
      limitEmails: 200,
      limitRows: 10000,
    });

    // 3) Merge + de-dup (by userId+type+message)
    const key = (f: Finding) => `${f.userId}|${f.type}|${f.message}`;
    const map = new Map<string, Finding>();
    for (const f of [...baseFindings, ...sharedEmailFindings]) {
      map.set(key(f), f);
    }
    const findings = Array.from(map.values());

    // 4) Audit summary
    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Manual warnings scan complete – ${findings.length} total findings (base: ${baseFindings.length}, sharedPayout: ${sharedEmailFindings.length})`,
      json: {
        lookbackHours,
        limit,
        total: findings.length,
        breakdown: {
          base: baseFindings.length,
          sharedPayoutEmail: sharedEmailFindings.length,
        },
      },
    });

    // 5) Telegram alerts (no-op if env missing)
    await Promise.all(
      findings.map((w) =>
        notifyWarning({
          userId: w.userId,
          type: w.type,
          message: w.message,
          evidence: (w as any).evidence,
          createdAt: (w as any).createdAt,
        })
      )
    );

    return NextResponse.json(
      { ok: true, count: findings.length, warnings: findings },
      { status: 200 }
    );
  } catch (err: any) {
    await safeAuditLog(prisma, {
      type: "ERROR",
      message: "Admin warnings scan failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "SCAN_FAILED" }, { status: 500 });
  }
}
