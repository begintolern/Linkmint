// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { calcSplit } from "@/lib/engines/payout/calcSplit";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import type { Prisma } from "@prisma/client";

/**
 * Finalizes a single commission:
 * - loads minimal commission data
 * - checks referral window for (referrer, invitee) if applicable
 * - calculates split
 * - creates payout rows (invitee + optional referrer)
 * - marks commission.finalizedAt so it won't be processed again
 */
export async function finalizeCommission(commissionId: string) {
  // 1) Load the commission
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      status: true,
      // TODO: include your real amount fields if present:
      // grossCents: true,
      // amountCents: true,
      // netCents: true,
    },
  });

  if (!commission) {
    throw new Error("commission_not_found");
  }
  if (commission.status !== "APPROVED") {
    return { ok: true, skipped: true, reason: "not_approved" };
  }

  // 2) Resolve amounts — replace this with your real field(s) if you have them
  // If you store cents on the commission, prefer those. Keeping 0 here no-ops safely.
  const grossCents = 0; // ← TODO: set to commission.grossCents (or equivalent) when available

  if (grossCents <= 0) {
    // No amount to split — mark finalized to avoid repeated attempts
    await prisma.commission.update({
      where: { id: commission.id },
      data: { finalizedAt: new Date() },
    });
    return { ok: true, skipped: true, reason: "zero_gross", finalized: true };
  }

  // 3) Referral window check (if user has a referrer)
  const inviteeId = commission.userId;
  const user = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { referredById: true },
  });
  const referrerId = user?.referredById ?? null;

  let isActive = false;
  if (referrerId) {
    // FIX: function expects a single object argument
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

  // FIX: use Prisma type for createMany inputs
  const rows: Prisma.PayoutCreateManyInput[] = [
    {
      userId: inviteeId,
      amount: split.inviteeCents / 100, // Float dollars
      method: "EARNINGS",
      status: "PENDING",
      details: baseDetails,
    },
  ];

  if (referrerId && split.referrerCents > 0) {
    rows.push({
      userId: referrerId,
      amount: split.referrerCents / 100,
      method: "EARNINGS",
      status: "PENDING",
      details: baseDetails,
    });
  }

  // Insert payouts
  await prisma.payout.createMany({
    data: rows,
    skipDuplicates: true,
  });

  // 6) Mark the commission as finalized to guarantee idempotency
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
