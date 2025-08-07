import { prisma } from "@/lib/db";
import { addDays, isAfter, isBefore } from "date-fns";

/**
 * Checks if the given user has an active referral bonus window (within 90 days of batch start).
 * Returns true if the user has at least one active batch.
 */
export async function checkReferralBonus(referrerId: string): Promise<{
  hasActiveBonus: boolean;
  activeBatchExpiresAt?: Date;
}> {
  const now = new Date();

  const activeBatch = await prisma.referralBatch.findFirst({
    where: {
      referrerId,
      status: "active",
      startedAt: {
        not: null,
      },
      expiresAt: {
        not: null,
        gt: now,
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (activeBatch) {
    return {
      hasActiveBonus: true,
      activeBatchExpiresAt: activeBatch.expiresAt!,
    };
  }

  return {
    hasActiveBonus: false,
  };
}
