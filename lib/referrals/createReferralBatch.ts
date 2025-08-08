// lib/referrals/createReferralBatch.ts
import { prisma } from "@/lib/db";
import { createReferralGroup } from "@/lib/referrals/createReferralGroup";

/**
 * Create a referral group when a referrer has 3 ungrouped referrals.
 * Returns the created group or null if fewer than 3 are available.
 */
export async function createReferralBatch(referrerId: string) {
  // Find users referred by this referrer who are not in any referral batch yet
  const ungroupedReferrals = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      referralBatches: { none: {} }, // adjust relation name if your schema differs
    },
    select: { id: true }, // <-- ensures TS knows the shape
    take: 3,
  });

  if (ungroupedReferrals.length === 3) {
    const referredUserIds = ungroupedReferrals.map((u) => u.id);

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
