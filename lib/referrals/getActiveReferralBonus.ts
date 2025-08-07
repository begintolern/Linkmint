import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fetch all active referral batches for a specific user
 */
export async function getActiveReferralBonus(userId: string) {
  const now = new Date();

  const activeBatches = await prisma.referralBatch.findMany({
    where: {
      referrerId: userId,
      expiresAt: {
        gt: now,
      },
      status: "active",
    },
  });

  return activeBatches;
}
