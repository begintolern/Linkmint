import { prisma } from "@/lib/db";
import { calcSplit } from "@/lib/engines/payout/calcSplit";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import type { Prisma } from "@prisma/client";

/**
 * Finalizes a single commission:
 * - Only processes APPROVED commissions
 * - Uses Commission.amount (USD float) -> cents for split math
 * - Creates payout rows (invitee + optional referrer)
 * - Sets commission.finalizedAt to guarantee idempotency
 */
export async function finalizeCommission(commissionId: string) {
  // 1) Load commission
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      status: true,   // CommissionStatus enum; expect "APPROVED" for processable items
      amount: true,   // USD float
    },
  });

  if (!commission) throw new Error("commission_not_found");
  if (commission.status !== "APPROVED") {
    return { ok: true, skipped: true, reason: "not_approved" };
  }

  // 2) Convert amount (USD float) -> cents int
  const grossCents = Math.max(0, Math.round((commission.amount ?? 0) * 100));

  if (grossCents <= 0) {
    // No amount to split — mark finalized to avoid repeated attempts
    await prisma.commission.update({
      where: { id: commission.id },
      data: { finalizedAt: new Date() },
    });
    return { ok: true, skipped: true, reason: "zero_gross", finalized: true };
  }

  // 3) Referral window check
  const inviteeId = commission.userId;
  const user = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { referredById: true },
  });
  const referrerId = user?.referredById ?? null;

  let isActive = false;
  if (referrerId) {
    isActive = await isReferralActiveForPair({ referrerId, inviteeId });
  }

  // 4) Split math
  const split = calcSplit({
    grossCents,
    isReferralActive: Boolean(isActive),
  });

  // 5) Create payout rows
  const baseDetails =
    `commission:${commission.id}` + (isActive ? " (referral 5% active)" : "");

  const rows: Prisma.PayoutCreateManyInput[] = [
    {
      userId: inviteeId,
      amount: split.inviteeCents / 100, // dollars
      method: "EARNINGS",
      status: "PENDING",
      details: baseDetails,
    },
  ];

  if (referrerId && split.referrerCents > 0) {
    rows.push({
      userId: referrerId,
      amount: split.referrerCents / 100, // dollars
      method: "EARNINGS",
      status: "PENDING",
      details: baseDetails,
    });
  }

  await prisma.payout.createMany({ data: rows, skipDuplicates: true });

  // 6) Mark commission finalized (prevents re-processing)
  await prisma.commission.update({
    where: { id: commission.id },
    data: { finalizedAt: new Date() },
  });

  return {
    ok: true,
    commissionId: commission.id,
    inviteeId,
    referrerId: referrerId ?? null,
    split,
    finalized: true,
  };
}
