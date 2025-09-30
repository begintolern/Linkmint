// lib/ops/watchdog.ts
import { prisma } from "@/lib/db";
import { getOpsHealth } from "./health";
import { sendOpsAlert } from "./alerts";
import { pgTryAdvisoryLock, pgAdvisoryUnlock } from "./locks";
import { runSelfHeal } from "./selfHeal";

const LOCK_KEY = 771234567890; // number to support older TS targets
let started = false;

export function startWatchdog() {
  // Feature flag + singleton guard
  if (process.env.WATCHDOG_ENABLED !== "1") return;
  if (started) return;
  started = true;

  const interval = Math.max(15000, Number(process.env.WATCHDOG_INTERVAL_MS || 60000));

  (async function loop() {
    // Leader election (cast to avoid bigint typing issues)
    const isLeader = await (pgTryAdvisoryLock as any)(prisma as any, LOCK_KEY as any);
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
          data: { type: "OPS_HEALTH", severity: 3, message: `High payout queue: ${h.payoutQueue}` },
        });
      }

      if (h.recentErrors > 20) {
        await (prisma as any).eventLog?.create?.({
          data: { type: "OPS_HEALTH", severity: 3, message: `Recent errors (15m): ${h.recentErrors}` },
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
          data: { type: "OPS_SELF_HEAL", severity: 2, message: "Auto-payout disabled by watchdog (error spike)" },
        });
        await sendOpsAlert("[OPS] Auto-payout DISABLED automatically due to error spike");
      }

      // ---- Daily heartbeat + optional daily trim (NEW) ----
      if (process.env.OPS_HEARTBEAT_ENABLED === "1") {
        try {
          const now = new Date();
          const hour = now.getUTCHours();
          const minute = now.getUTCMinutes();
          const target = Number(process.env.OPS_HEARTBEAT_HOUR_UTC || 17); // default 17:00 UTC

          // Fire once within the first 5 minutes of the target hour
          if (hour === target && minute < 5) {
            const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
            const key = `OPS_HEARTBEAT_SENT_${ymd}`;
            const sent = await (prisma as any).systemConfig?.findFirst?.({ where: { key } });

            if (!sent) {
              await sendOpsAlert(`[OPS Heartbeat] ${formatHeartbeat(h)}`);

              try {
                await (prisma as any).eventLog?.create?.({
                  data: { type: "OPS_ALERT", severity: 1, message: `Heartbeat sent ${ymd}` },
                });
              } catch {}

              await (prisma as any).systemConfig?.upsert?.({
                where: { key },
                update: { value: "true" },
                create: { key, value: "true" },
              });

              // Optional: trim old logs daily
              if (process.env.OPS_AUTO_TRIM_EVENTLOG === "1") {
                try {
                  await runSelfHeal("TRIM_EVENTLOG");
                } catch {}
              }
            }
          }
        } catch {
          // ignore heartbeat errors
        }
      }
      // ---- END NEW ----
    } catch (e: any) {
      try {
        await (prisma as any).eventLog?.create?.({
          data: { type: "OPS_HEALTH", severity: 4, message: `Watchdog loop error: ${e?.message || String(e)}` },
        });
      } catch {}
    } finally {
      await (pgAdvisoryUnlock as any)(prisma as any, LOCK_KEY as any);
      setTimeout(loop, interval);
    }
  })();
}

function formatHeartbeat(h: any) {
  return `db=${h.dbOk ? "ok" : "down"}, errors15m=${h.recentErrors}, payoutQueue=${h.payoutQueue}, autoPayout=${h.autoPayoutEnabled ?? "n/a"}, rssMB=${h.rssMB ?? "n/a"}, heapMB=${h.heapMB ?? "n/a"}`;
}
