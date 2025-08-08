import { prisma } from "@/lib/db";
import { differenceInDays, isAfter } from "date-fns";

export interface ReferralStats {
  activeBatch: {
    isComplete: boolean;
    isExpired: boolean;
    daysLeft: number;
    inviteeEmails: string[];
  } | null;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const referralGroups = await prisma.referralGroup.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      users: {
        select: { email: true },
      },
    },
  });

  const batch = referralGroups[0];

  if (!batch) {
    return { activeBatch: null };
  }

  const isComplete = batch.users.length >= 3;
  const now = new Date();
  const isExpired = isAfter(now, batch.expiresAt);
  const daysLeft = Math.max(0, differenceInDays(batch.expiresAt, now));
  const inviteeEmails = batch.users.map((\1: any) => u.email);

  return {
    activeBatch: {
      isComplete,
      isExpired,
      daysLeft,
      inviteeEmails,
    },
  };
}
