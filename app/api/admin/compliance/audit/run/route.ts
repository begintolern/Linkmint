// app/api/admin/compliance/audit/run/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/compliance/log";

const SECRET = process.env.ADMIN_CRON_SECRET || "";

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("secret") || "";
  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1) High clicks, zero conversions
  const clicks = await prisma.clickEvent.groupBy({
    by: ["merchantId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  for (const c of clicks) {
    const convCount = await prisma.conversion.count({
      where: { merchantId: c.merchantId, createdAt: { gte: since } },
    });
    if ((c._count?._all || 0) > 100 && convCount === 0) {
      await logEvent({
        type: "AUDIT_ALERT",
        severity: 3,
        message: `High clicks (${c._count._all}) but 0 conversions (24h)`,
        merchantId: c.merchantId,
        meta: { clicks: c._count._all, conversions: convCount, since: since.toISOString() },
      });
    }
  }

  // 2) Duplicate order IDs (global)
  const dups = await prisma.conversion.groupBy({
    by: ["orderId"],
    _count: { orderId: true },
    having: { orderId: { _count: { gt: 1 } } },
  });
  for (const d of dups) {
    await logEvent({
      type: "AUDIT_ALERT",
      severity: 2,
      message: `Duplicate orderId detected: ${d.orderId}`,
      meta: { orderId: d.orderId, count: d._count.orderId },
    });
  }

  return NextResponse.json({ ok: true, flaggedMerchants: clicks.length, duplicates: dups.length });
}
