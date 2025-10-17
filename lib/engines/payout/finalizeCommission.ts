// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * Called when an affiliate commission is approved and ready to record payouts.
 * Applies the 5% referral bonus (from invitee) when the 90-day window is active.
 */
export async function finalizeCommission(commissionId: string) {
  // Fetch only what we need, with multiple possible amount fields
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    select: {
      id: true,
      userId: true,
      // include possible amount fields (adjust to your schema)
      grossCents: true,
      amountCents: true,
      netCents: true,
      amount: true,
      // include user just for referredById
      user: { select: { referredById: true } },
    },
  });

  if (!commission) throw new Error("Commission not found");

  // Safely resolve gross in cents from whatever your schema actually has
  const grossCents =
    (commission as any).grossCents ??
    (commission as any).amountCents ??
    (commission as any).netCents ?? // fallback if you only stored a single cents field
    (typeof (commission as any).amount === "number"
      ? Math.round((commission as any).amount * 100)
      : null);

  if (!Number.isFinite(grossCents) || grossCents <= 0) {
    throw new Error(
      "Commission amount not found. Expected one of: grossCents, amountCents, netCents, amount"
    );
  }

  const inviteeId = commission.userId;
  const referrerId = commission.user?.referredById ?? null;

  // Check if the 90-day window is active for this pair
  const isActive = await isReferralActiveForPair({
    referrerId,
    inviteeId,
  });

  // Compute split with the pure math helper
  const split = calcSplit({
    grossCents,
    isReferralActive: isActive,
  });

  // Build payout rows
  const data: any[] = [
    {
      userId: inviteeId,
      type: "INVITEE_EARN",
      netCents: split.inviteeCents,
      statusEnum: "PENDING",
      commissionId: commission.id,
    },
  ];

  if (split.referrerCents > 0 && referrerId) {
    data.push({
      userId: referrerId,
      type: "REFERRER_BONUS",
      netCents: split.referrerCents,
      statusEnum: "PENDING",
      commissionId: commission.id,
    });
  }

  // Optional: platform row (skip if you account elsewhere)
  data.push({
    userId: null,
    type: "PLATFORM_MARGIN",
    netCents: split.platformCents,
    statusEnum: "ACCOUNTED",
    commissionId: commission.id,
  });

  await prisma.payout.createMany({ data });

  // If your Commission model has fields for status/flags, update them here.
  // Remove or adjust if you use a different status system.
  try {
    await prisma.commission.update({
      where: { id: commission.id },
      data: {
        // e.g., status: "PAID_OUT",
        // store the flag if your model has it; otherwise delete this line
        // appliedReferralBonus: split.appliedReferralBonus,
      },
    });
  } catch {
    // ignore if those fields don't exist in your schema
  }

  return {
    success: true,
    commissionId: commission.id,
    appliedReferralBonus: split.appliedReferralBonus,
  };
}
