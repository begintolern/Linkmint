// lib/ops/health.ts
import { prisma } from "@/lib/db";

export type OpsHealth = {
  now: string;
  dbOk: boolean;
  recentErrors: number;
  payoutQueue: number;
  autoPayoutEnabled: boolean | null;
  rssMB?: number | null;
  heapMB?: number | null;
};

export async function getOpsHealth(): Promise<OpsHealth> {
  // DB ping
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  // recentErrors from EventLog (last 15m) with robust fallback
  const since = new Date(Date.now() - 15 * 60 * 1000);
  let recentErrors = 0;
  try {
    recentErrors = await (prisma as any).eventLog.count({
      where: { severity: { gte: 3 }, createdAt: { gte: since } },
    });
  } catch {
    // Fallback to aggregate if prisma.count signature/middleware causes issues
    try {
      const agg = await (prisma as any).eventLog.aggregate({
        _count: { _all: true },
        where: { severity: { gte: 3 }, createdAt: { gte: since } },
      });
      recentErrors = Number((agg as any)?._count?._all ?? 0);
    } catch {
      recentErrors = 0;
    }
  }

  // payoutQueue: payouts with status PENDING
  let payoutQueue = 0;
  try {
    payoutQueue = await (prisma as any).payout.count({
      where: { statusEnum: "PENDING" },
    });
  } catch {}

  // autoPayoutEnabled flag (DB config if present; else null)
  let autoPayoutEnabled: boolean | null = null;
  try {
    const cfg = await (prisma as any).systemConfig.findFirst({
      where: { key: "AUTO_PAYOUT_ENABLED" },
    });
    if (cfg) autoPayoutEnabled = String((cfg as any).value) === "true";
  } catch {}

  // memory metrics (best-effort)
  let rssMB: number | null = null;
  let heapMB: number | null = null;
  try {
    const mem =
      typeof process?.memoryUsage === "function" ? process.memoryUsage() : null;
    if (mem) {
      rssMB = Math.round((mem.rss / 1024 / 1024) * 10) / 10;
      heapMB = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
    }
  } catch {}

  return {
    now: new Date().toISOString(),
    dbOk,
    recentErrors,
    payoutQueue,
    autoPayoutEnabled,
    rssMB,
    heapMB,
  };
}
