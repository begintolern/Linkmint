// lib/ops/watchdog.ts
import { prisma } from "@/lib/db";
import { getOpsHealth } from "./health";
import { sendOpsAlert } from "./alerts";
import { pgTryAdvisoryLock, pgAdvisoryUnlock } from "./locks";

const LOCK_KEY = 771234567890; // number to support older TS targets
let started = false;

export function startWatchdog() {
  // Feature flag + singleton guard
  if (process.env.WATCHDOG_ENABLED !== "1") return;
  if (started) return;
  started = true;

  const interval = Math.max(
    15000,
    Number(process.env.WATCHDOG_INTERVAL_MS || 60000)
  );

  (async function loop() {
    // Leader election (cast to avoid bigint typing issues)
    const isLeader = await (pgTryAdvisoryLock as any)(
      prisma as any,
      LOCK_KEY as any
    );
    if (!isLeader) {
      setTimeout(loop, interval);
      return;
    }

    try {
      const h = await getOpsHealth();

      // Basic health logging
      if (!h.dbOk) {
        await (prisma as any).eventLog?.create?.({
          data: { type: "OPS_HEALTH", severity: 4, message: "DB ping failed" },
        });
        await sendOpsAlert("[OPS] DB ping failed — investigate");
      }

      if (h.payoutQueue > 100) {
        await (prisma as any).eventLog?.create?.({
          data: {
            type: "OPS_HEALTH",
            severity: 3,
            message: `High payout queue: ${h.payoutQueue}`,
          },
        });
      }

      if (h.recentErrors > 20) {
        await (prisma as any).eventLog?.create?.({
          data: {
            type: "OPS_HEALTH",
            severity: 3,
            message: `Recent errors (15m): ${h.recentErrors}`,
          },
        });
      }

      // Auto-protect: disable auto-payout if errors spike
      if (h.recentErrors > 50 && h.autoPayoutEnabled) {
        await (prisma as any).systemConfig?.upsert?.({
          where: { key: "AUTO_PAYOUT_ENABLED" },
          update: { value: "false" },
          create: { key: "AUTO_PAYOUT_ENABLED", value: "false" },
        });
        await (prisma as any).eventLog?.create?.({
          data: {
            type: "OPS_SELF_HEAL",
            severity: 2,
            message:
              "Auto-payout disabled by watchdog (error spike)",
          },
        });
        await sendOpsAlert(
          "[OPS] Auto-payout DISABLED automatically due to error spike"
        );
      }
    } catch (e: any) {
      try {
        await (prisma as any).eventLog?.create?.({
          data: {
            type: "OPS_HEALTH",
            severity: 4,
            message: `Watchdog loop error: ${e?.message || String(e)}`,
          },
        });
      } catch {}
    } finally {
      await (pgAdvisoryUnlock as any)(prisma as any, LOCK_KEY as any);
      setTimeout(loop, interval);
    }
  })();
}
