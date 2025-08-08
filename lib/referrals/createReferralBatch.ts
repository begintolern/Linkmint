// lib/referrals/createReferralBatch.ts
import { prisma } from "@/lib/db";
import { createReferralGroup } from "@/lib/referrals/createReferralGroup";

/**
 * Create a referral group when a referrer has 3 ungrouped referrals.
 * Returns the created group or null if fewer than 3 are available.
 */
export async function createReferralBatch(referrerId: string) {
  // Explicitly type the result so TS knows each item has { id: string }
  const ungroupedReferrals: { id: string }[] = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      referralBatches: { none: {} }, // adjust relation name if your schema differs
    },
    select: { id: true },
    take: 3,
  });

  if (ungroupedReferrals.length === 3) {
    const referredUserIds = ungroupedReferrals.map((u: { id: string }) => u.id);

    const group = await createReferralGroup(referrerId, referredUserIds);

    // Boost TrustScore by +10
    await prisma.user.update({
      where: { id: referrerId },
      data: { trustScore: { increment: 10 } },
    });

    return group;
  }

  return null;
}

export default createReferralBatch;
