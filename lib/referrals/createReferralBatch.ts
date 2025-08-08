// lib/referrals/createReferralBatch.ts
import { prisma } from "@/lib/db";
import { createReferralGroup } from "@/lib/referrals/createReferralGroup";

/**
 * Create a referral batch (group of 3) for a referrer if there are at least 3
 * referred users who aren't already in any referral group.
 *
 * Returns the created group, or null if fewer than 3 ungrouped referrals exist.
 */
export async function createReferralBatch(referrerId: string) {
  try {
    // Find up to 3 users referred by this referrer who are not in any referral group yet
    const ungroupedReferrals = await prisma.user.findMany({
      where: {
        referredById: referrerId,
        referralGroupId: null, // user not yet in a referral group
      },
      select: { id: true },
      orderBy: { createdAt: "asc" }, // deterministic selection
      take: 3,
    });

    if (ungroupedReferrals.length < 3) {
      return null;
    }

    const referredUserIds = ungroupedReferrals.map((u) => u.id);

    // Create the referral group (this should set startedAt and connect users internally)
    const group = await createReferralGroup(referrerId, referredUserIds);

    // TrustScore bump for forming a complete batch of 3
    await prisma.user.update({
      where: { id: referrerId },
      data: { trustScore: { increment: 10 } },
    });

    return group;
  } catch (error) {
    console.error("createReferralBatch error:", error);
    throw error;
  }
}
