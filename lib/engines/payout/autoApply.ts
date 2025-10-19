// lib/engines/payout/autoApply.ts
import { prisma } from "@/lib/db";
import { finalizeCommission } from "@/lib/engines/payout/finalizeCommission";

/**
 * Finds eligible commissions and runs finalizeCommission on each.
 * Adds an idempotency guard: skip if a payout already exists for this commission.
 */
export async function autoPayoutApply({ limit = 20 }: { limit?: number }) {
  // Pull a conservative, oldest-first batch of APPROVED commissions.
  const candidates = await prisma.commission.findMany({
    where: {
      status: "APPROVED",        // <-- enum value
      // If you later add a finalized flag, add finalizedAt: null here.
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  let scanned = 0;
  let applied = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const c of candidates) {
    scanned += 1;

    // Idempotency guard: if any payout row mentions this commission, skip.
    const existing = await prisma.payout.findFirst({
      where: { details: { contains: `commission:${c.id}` } },
      select: { id: true },
    });
    if (existing) continue;

    try {
      await finalizeCommission(c.id);
      applied += 1;
    } catch (err: any) {
      errors.push({ id: c.id, error: err?.message ?? String(err) });
    }
  }

  return { ok: true, scanned, applied, errors };
}
