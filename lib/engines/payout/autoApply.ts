// lib/engines/payout/autoApply.ts
import { prisma } from "@/lib/db";
import { finalizeCommission } from "@/lib/engines/payout/finalizeCommission";

/**
 * Finds eligible commissions and runs finalizeCommission on each.
 * Idempotency guard: skips if a payout already exists with details containing `commission:<id>`.
 */
export async function autoPayoutApply({
  limit = 20,
  explainSkips = false,
}: {
  limit?: number;
  explainSkips?: boolean;
}) {
  const candidates = await prisma.commission.findMany({
    where: {
      status: "APPROVED", // enum value in your schema
      // If you later add finalizedAt, include: finalizedAt: null
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: { id: true, userId: true, createdAt: true },
  });

  let scanned = 0;
  let applied = 0;
  const errors: Array<{ id: string; error: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const c of candidates) {
    scanned += 1;

    // Idempotency guard — already has a payout tied to this commission
    const existing = await prisma.payout.findFirst({
      where: { details: { contains: `commission:${c.id}` } },
      select: { id: true },
    });
    if (existing) {
      if (explainSkips) skipped.push({ id: c.id, reason: "payout_already_exists_for_commission" });
      continue;
    }

    try {
      await finalizeCommission(c.id);
      applied += 1;
    } catch (err: any) {
      errors.push({ id: c.id, error: err?.message ?? String(err) });
    }
  }

  return {
    ok: true,
    scanned,
    applied,
    errors,
    ...(explainSkips ? { skipped } : {}),
  };
}
