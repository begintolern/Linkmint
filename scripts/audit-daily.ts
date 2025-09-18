// scripts/audit-daily.ts
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/compliance/log";

async function runAudit() {
  const since = new Date();
  since.setDate(since.getDate() - 1); // last 24h

  // 1. Merchants with >100 clicks but 0 conversions
  const merchants = await prisma.clickEvent.groupBy({
    by: ["merchantId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  for (const m of merchants) {
    const convCount = await prisma.conversion.count({
      where: { merchantId: m.merchantId, createdAt: { gte: since } },
    });

    if (m._count._all > 100 && convCount === 0) {
      await logEvent({
        type: "AUDIT_ALERT",
        severity: 3,
        message: `High clicks (${m._count._all}) but no conversions in last 24h`,
        merchantId: m.merchantId,
        meta: { clicks: m._count._all, conversions: convCount },
      });
    }
  }

  // 2. Duplicate order IDs
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

  console.log("✅ Audit complete");
}

runAudit().finally(() => prisma.$disconnect());
