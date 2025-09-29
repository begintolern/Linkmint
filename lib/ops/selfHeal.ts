// lib/ops/selfHeal.ts
import { prisma } from "@/lib/db";
import { sendOpsAlert } from "./alerts";

export type SelfHealAction =
  | "DISABLE_AUTO_PAYOUT"
  | "ENABLE_AUTO_PAYOUT"
  | "RETRY_STUCK_PAYOUTS"
  | "CLEAR_ZOMBIE_TOKENS"
  | "TRIM_EVENTLOG";

export async function runSelfHeal(action: SelfHealAction) {
  try {
    switch (action) {
      case "DISABLE_AUTO_PAYOUT": {
        await (prisma as any).systemConfig?.upsert?.({
          where: { key: "AUTO_PAYOUT_ENABLED" },
          update: { value: "false" },
          create: { key: "AUTO_PAYOUT_ENABLED", value: "false" },
        });
        await log("Disabled auto-payout (self-heal).");
        await sendOpsAlert("[OPS] Auto-payout disabled (self-heal)");
        return { ok: true };
      }

      case "ENABLE_AUTO_PAYOUT": {
        await (prisma as any).systemConfig?.upsert?.({
          where: { key: "AUTO_PAYOUT_ENABLED" },
          update: { value: "true" },
          create: { key: "AUTO_PAYOUT_ENABLED", value: "true" },
        });
        await log("Enabled auto-payout (ops action).");
        await sendOpsAlert("[OPS] Auto-payout enabled (manual)");
        return { ok: true };
      }

      case "RETRY_STUCK_PAYOUTS": {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);
        const stuck =
          (await (prisma as any).payout?.findMany?.({
            where: { statusEnum: "PENDING", createdAt: { lt: cutoff } },
            take: 50,
          })) ?? [];
        let retried = 0;
        for (const p of stuck) {
          await (prisma as any).payout.update({
            where: { id: (p as any).id },
            data: { updatedAt: new Date() },
          });
          retried++;
        }
        await log(`Retried ${retried} stuck payouts.`);
        if (retried) await sendOpsAlert(`[OPS] Retried ${retried} stuck payouts`);
        return { ok: true, retried };
      }

      case "CLEAR_ZOMBIE_TOKENS": {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const r =
          (await (prisma as any).verificationToken?.deleteMany?.({
            where: { expires: { lt: cutoff } },
          })) ?? { count: 0 };
        await log(`Cleared ${r.count} expired verification tokens.`);
        return { ok: true, cleared: r.count };
      }

          case "TRIM_EVENTLOG": {
      const maxDays = 14;
      const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
      // Only trim older OPS logs; keep user/dev logs intact
      const r =
        (await (prisma as any).eventLog?.deleteMany?.({
          where: {
            createdAt: { lt: cutoff },
            type: { in: ["OPS_HEALTH", "OPS_SELF_HEAL"] },
          },
        })) ?? { count: 0 };
      await log(`Trimmed ${r.count} old OPS logs (> ${maxDays}d).`);
      return { ok: true, trimmed: r.count };
    }


      default:
        return { ok: false, error: "Unknown action" };
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    await log(`Self-heal error: ${msg}`, 4);
    return { ok: false, error: msg };
  }
}

async function log(message: string, severity = 2) {
  try {
    await (prisma as any).eventLog?.create?.({
      data: { type: "OPS_SELF_HEAL", severity, message },
    });
  } catch {
    // ignore
  }
}
