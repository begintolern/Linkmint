// lib/referrals/createReferralGroup.ts
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

/**
 * Create a referral group (batch of 3) for a referrer and connect the referred users.
 * Assumes model:
 *   model ReferralGroup {
 *     id          String   @id @default(cuid())
 *     referrerId  String
 *     startedAt   DateTime @default(now())
 *     expiresAt   DateTime
 *     users       User[]   // relation
 *   }
 */
export async function createReferralGroup(
  referrerId: string,
  referredUserIds: string[]
) {
  const startedAt = new Date();
  const expiresAt = addDays(startedAt, 90);

  const group = await prisma.referralGroup.create({
    data: {
      referrerId,
      startedAt,
      expiresAt,
      users: {
        connect: referredUserIds.map((id) => ({ id })),
      },
    },
    include: {
      users: { select: { id: true, email: true } },
    },
  });

  return group;
}
