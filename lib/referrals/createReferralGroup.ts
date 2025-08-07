// lib/referrals/createReferralGroup.ts

import { prisma } from "@/lib/db";

export async function createReferralGroup(referrerId: string, referredUserIds: string[]) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(now.getDate() + 90); // 90-day window

  const group = await prisma.referralGroup.create({
    data: {
      referrerId,
      expiresAt,
      users: {
        connect: referredUserIds.map((id) => ({ id })), // ✅ Correct relation field
      },
    },
  });

  return group;
}
