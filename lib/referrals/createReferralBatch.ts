// lib/referrals/createReferralBatch.ts

import { prisma } from "@/lib/db";
import { createReferralGroup } from "@/lib/referrals/createReferralGroup";

export async function createReferralBatch(referrerId: string) {
  // Find users referred by this referrer who are not in any referral group
  const ungroupedReferrals = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      referralBatches: { none: {} }, // No batch assigned yet
    },
    take: 3,
  });

  if (ungroupedReferrals.length === 3) {
    const referredUserIds = ungroupedReferrals.map((user) => user.id);

    const group = await createReferralGroup(referrerId, referredUserIds);

    // ✅ Boost TrustScore by +10
    await prisma.user.update({
      where: { id: referrerId },
      data: {
        trustScore: { increment: 10 },
      },
    });

    return group;
  }

  return null;
}
