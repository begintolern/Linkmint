// app/api/cron/warnings/scan/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { scanWarnings } from "@/lib/warnings";
import { safeAuditLog } from "@/lib/auditLog";
import { notifyWarning } from "@/lib/notify";
import { detectSharedPayoutEmails } from "@/lib/detectors/sharedPayoutEmail";
import { detectSelfPurchase } from "@/lib/detectors/selfPurchase";

const prisma = new PrismaClient();

function isCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret") || "";
  return header === secret;
}

type Finding = {
  userId: string;
  type: string;
  message: string;
  evidence?: unknown;
  createdAt?: string | Date;
};

/**
 * POST /api/cron/warnings/scan?lookbackHours=24&limit=200
 * Triggered by scheduler; runs base + detectors and emits Telegram alerts.
 */
export async function POST(req: NextRequest) {
  if (!isCron(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    // Base findings
    const baseFindings = await scanWarnings(prisma, { lookbackHours, limit });

    // Shared payout email clusters
    const sharedEmailFindings = await detectSharedPayoutEmails(prisma, {
      minAccounts: 2,
      limitEmails: 200,
      limitRows: 10000,
    });

    // Self-purchase overlaps
    const selfPurchaseFindings = await detectSelfPurchase(prisma, {
      lookbackDays: Math.ceil(lookbackHours / 24) || 1,
      minHits: 1,
      maxRows: 20000,
    });

    // Merge + de-dup
    const key = (f: Finding) => `${f.userId}|${f.type}|${f.message}`;
    const map = new Map<string, Finding>();
    for (const f of [...baseFindings, ...sharedEmailFindings, ...selfPurchaseFindings]) {
      map.set(key(f), f);
    }
    const findings = Array.from(map.values());

    // Audit summary
    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Cron warnings scan – total ${findings.length} findings (base:${baseFindings.length}, shared:${sharedEmailFindings.length}, self:${selfPurchaseFindings.length})`,
      json: {
        lookbackHours,
        limit,
        total: findings.length,
        breakdown: {
          base: baseFindings.length,
          sharedPayoutEmail: sharedEmailFindings.length,
          selfPurchase: selfPurchaseFindings.length,
        },
      },
    });

    // Telegram alerts
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

    return NextResponse.json({ ok: true, count: findings.length, warnings: findings }, { status: 200 });
  } catch (err: any) {
    await safeAuditLog(prisma, {
      type: "ERROR",
      message: "Cron warnings scan failed",
      json: { error: String(err?.message || err) },
    });
    return NextResponse.json({ ok: false, error: "SCAN_FAILED" }, { status: 500 });
  }
}
