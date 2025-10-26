// app/api/admin/warnings/scan/route.ts
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

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") ?? "24");
  const limit = Number(url.searchParams.get("limit") ?? "200");

  try {
    // --- 1️⃣ Base findings
    const baseFindings = await scanWarnings(prisma, { lookbackHours, limit });

    // --- 2️⃣ Shared payout email detector
    const sharedEmailFindings = await detectSharedPayoutEmails(prisma, {
      minAccounts: 2,
      limitEmails: 200,
      limitRows: 10000,
    });

    // --- 3️⃣ Self-purchase detector
    const selfPurchaseFindings = await detectSelfPurchase(prisma, {
      lookbackDays: 90,
      minHits: 1,
      maxRows: 20000,
    });

    // --- 4️⃣ Merge + de-dup (by userId + type + message)
    const key = (f: Finding) => `${f.userId}|${f.type}|${f.message}`;
    const map = new Map<string, Finding>();
    for (const f of [...baseFindings, ...sharedEmailFindings, ...selfPurchaseFindings]) {
      map.set(key(f), f);
    }
    const findings = Array.from(map.values());

    // --- 5️⃣ Log + summarize
    await safeAuditLog(prisma, {
      type: "USER_WARNING",
      message: `Manual warnings scan – total ${findings.length} findings (base:${baseFindings.length}, shared:${sharedEmailFindings.length}, self:${selfPurchaseFindings.length})`,
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

    // --- 6️⃣ Send Telegram alerts for all findings
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
