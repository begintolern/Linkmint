// lib/engines/payout/autoApply.ts
import { prisma } from "@/lib/db";
import { finalizeCommission } from "@/lib/engines/payout/finalizeCommission"; // ← named import

/**
 * Finds eligible commissions and runs finalizeCommission on each.
 * Safe in DRY RUN: your system won’t disburse unless the disburse flag is ON.
 */
export async function autoPayoutApply({
  limit = 20,
}: {
  limit?: number;
}) {
  const candidates = await prisma.commission.findMany({
    where: {
      status: "APPROVED",
      // If you track a finalized marker/payout link, exclude already-processed ones here.
      // finalizedAt: null,
      // payouts: { none: {} },
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  let applied = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const c of candidates) {
    try {
      await finalizeCommission(c.id); // ← call the named export
      applied += 1;
    } catch (err: any) {
      errors.push({ id: c.id, error: err?.message ?? String(err) });
    }
  }

  return {
    ok: true,
    scanned: candidates.length,
    applied,
    errors,
  };
}
