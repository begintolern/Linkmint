// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * finalizeCommission()
 * --------------------------
 * Called when an affiliate commission is approved and ready to record payouts.
 * This applies the new 5% referral bonus logic:
 *   - Base: 85% invitee / 15% platform
 *   - Active referral window: 80% invitee / 5% referrer / 15% platform
 * The 5% bonus always comes from the invitee’s share.
 */
export async function finalizeCommission(commissionId: string) {
  // Fetch the commission record and its related user
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { user: true },
  });

  if (!commission) {
    throw new Error("Commission not found");
  }

  const inviteeId = commission.userId;
  const referrerId = commission.user?.referredById ?? null;

  // Step 1 — Check if referral window is active
  const isActive = await isReferralActiveForPair({
    referrerId,
    inviteeId,
  });

  // Step 2 — Calculate final split
  const split = calcSplit({
    grossCents: commission.grossCents,
    isReferralActive: isActive,
  });

  // Step 3 — Record payouts
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

  // Optional: keep platform row for accounting
  data.push({
    userId: null,
    type: "PLATFORM_MARGIN",
    netCents: split.platformCents,
    statusEnum: "ACCOUNTED",
    commissionId: commission.id,
  });

  await prisma.payout.createMany({ data });

  // Step 4 — Update commission status
  await prisma.commission.update({
    where: { id: commission.id },
    data: {
      status: "PAID_OUT", // or your equivalent status
      appliedReferralBonus: split.appliedReferralBonus,
    },
  });

  return {
    success: true,
    commissionId: commission.id,
    appliedReferralBonus: split.appliedReferralBonus,
  };
}
