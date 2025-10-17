// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * Called when an affiliate commission is approved and ready to record payouts.
 * Applies the 5% referral bonus (from invitee) when the 90-day window is active.
 *
 * NOTE: We avoid selecting unknown amount fields. We include user for referredById,
 * then dynamically resolve the commission amount (in cents) from whatever field exists.
 */
export async function finalizeCommission(commissionId: string) {
  // Include user (for referredById); fetch other fields generically
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { user: { select: { referredById: true } } },
  });

  if (!commission) throw new Error("Commission not found");

  // Resolve a cents amount from possible fields without relying on TS compile-time keys
  const cAny = commission as any;

  // Candidate keys in order of preference; adjust if you store differently
  const candidates = [
    cAny.grossCents,
    cAny.amountCents,
    cAny.netCents,
    typeof cAny.amount === "number" ? Math.round(cAny.amount * 100) : undefined,
  ];

  const grossCents = candidates.find(
    (v) => Number.isFinite(v) && (v as number) > 0
  );

  if (!Number.isFinite(grossCents)) {
    throw new Error(
      "Commission amount not found on record. Expected one of: grossCents, amountCents, netCents, amount"
    );
  }

  const inviteeId: string = commission.userId as any;
  const referrerId: string | null = commission.user?.referredById ?? null;

  // Check if the 90-day window is active for this pair
  const isActive = await isReferralActiveForPair({
    referrerId,
    inviteeId,
  });

  // Compute split with the pure math helper
  const split = calcSplit({
    grossCents: grossCents as number,
    isReferralActive: isActive,
  });

  // Build payout rows – keep fields minimal to match your schema
  const data: any[] = [
    {
      userId: inviteeId,
      netCents: split.inviteeCents,
      commissionId: commission.id,
      // optional typed fields if your Payout model has them:
      // type: "INVITEE_EARN",
      // statusEnum: "PENDING",
    },
  ];

  if (split.referrerCents > 0 && referrerId) {
    data.push({
      userId: referrerId,
      netCents: split.referrerCents,
      commissionId: commission.id,
      // type: "REFERRER_BONUS",
      // statusEnum: "PENDING",
    });
  }

  // Optional: platform row (uncomment if you store it as a payout entry)
  // data.push({
  //   userId: null,
  //   netCents: split.platformCents,
  //   commissionId: commission.id,
  //   // type: "PLATFORM_MARGIN",
  //   // statusEnum: "ACCOUNTED",
  // });

  await prisma.payout.createMany({ data });

  // Optional: mark flags on commission if such fields exist
  // try {
  //   await prisma.commission.update({
  //     where: { id: commission.id },
  //     data: {
  //       // status: "PAID_OUT",
  //       // appliedReferralBonus: split.appliedReferralBonus,
  //     },
  //   });
  // } catch {}

  return {
    success: true,
    commissionId: commission.id,
    appliedReferralBonus: split.appliedReferralBonus,
  };
}
