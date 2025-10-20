// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { calcSplit } from "@/lib/engines/payout/calcSplit";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import type { Prisma } from "@prisma/client";

export async function finalizeCommission(commissionId: string) {
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      status: true,
      amount: true,  // USD float
    },
  });

  if (!commission) throw new Error("commission_not_found");
  if (commission.status !== "APPROVED") {
    return { ok: true, skipped: true, reason: "not_approved" };
  }

  // 🔒 Normalize/validate amount
  const amt = Number(commission.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    await prisma.commission.update({
      where: { id: commission.id },
      data: { finalizedAt: new Date() } as any, // safe cast until client definitely has the field
    });
    return { ok: true, skipped: true, reason: "invalid_amount", finalized: true };
  }
  const grossCents = Math.round(amt * 100);

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

  const split = calcSplit({
    grossCents,
    isReferralActive: Boolean(isActive),
  });

  const baseDetails =
    `commission:${commission.id}` + (isActive ? " (referral 5% active)" : "");

  const rows: Prisma.PayoutCreateManyInput[] = [
    {
      userId: inviteeId,
      amount: split.inviteeCents / 100,
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

  await prisma.payout.createMany({ data: rows, skipDuplicates: true });

  await prisma.commission.update({
    where: { id: commission.id },
    data: { finalizedAt: new Date() } as any,
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
