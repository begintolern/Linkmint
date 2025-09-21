// scripts/audit-daily.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function logEvent({ type, message, severity = 1, userId = null, merchantId = null, meta }) {
  try {
    await prisma.complianceEvent.create({
      data: { type, message, severity, userId, merchantId, meta },
    });
  } catch (err) {
    console.error("[compliance] logEvent failed:", err);
  }
}

(async function runAudit() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1) High clicks but zero conversions (last 24h)
  const clickAgg = await prisma.clickEvent.groupBy({
    by: ["merchantId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  for (const c of clickAgg) {
    const convCount = await prisma.conversion.count({
      where: { merchantId: c.merchantId, createdAt: { gte: since } },
    });
    if ((c._count?._all || 0) > 100 && convCount === 0) {
      await logEvent({
        type: "AUDIT_ALERT",
        severity: 3,
        message: `High clicks (${c._count._all}) but 0 conversions in last 24h`,
        merchantId: c.merchantId,
        meta: { clicks: c._count._all, conversions: convCount, since: since.toISOString() },
      });
    }
  }

  // 2) Duplicate orderId (any time range)
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
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
