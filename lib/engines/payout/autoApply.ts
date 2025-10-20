// lib/engines/payout/autoApply.ts
import { prisma } from "@/lib/db";
import { finalizeCommission } from "@/lib/engines/payout/finalizeCommission";
import { getAutoAllowlist } from "@/lib/config/flags";

export async function autoPayoutApply({
  limit = 20,
  explainSkips = false,
}: {
  limit?: number;
  explainSkips?: boolean;
}) {
  const allow = getAutoAllowlist();

  // ⚠️ Do NOT filter by finalizedAt here (prod client may not have the field yet).
  const where: any = { status: "APPROVED" };
  if (allow.size > 0) where.userId = { in: Array.from(allow) };

  const candidates = await prisma.commission.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: { id: true, userId: true, createdAt: true }, // no finalizedAt in select either
  });

  let scanned = 0;
  let applied = 0;
  const errors: Array<{ id: string; error: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const c of candidates) {
    scanned += 1;

    // Idempotency guard: if any payout already references this commission, skip.
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

  return { ok: true, scanned, applied, errors, ...(explainSkips ? { skipped } : {}) };
}
