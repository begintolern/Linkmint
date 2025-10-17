// lib/referrals/isReferralActiveForPair.ts
import { prisma } from "@/lib/db";

/**
 * True if invitee is in a referrer's group whose window is currently active:
 * startedAt <= now <= expiresAt.
 * Matches your current Prisma model (no `status` or `active` field).
 */
export async function isReferralActiveForPair(opts: {
  referrerId: string | null;
  inviteeId: string | null;
  now?: Date;
}): Promise<boolean> {
  const { referrerId, inviteeId } = opts;
  const now = opts.now ?? new Date();
  if (!referrerId || !inviteeId) return false;

  const group = await prisma.referralGroup.findFirst({
    where: {
      referrerId,
      startedAt: { lte: now },
      expiresAt: { gte: now },
      // many-to-many relation filter: your model uses `users: User[] @relation("UsersInGroup")`
      users: { some: { id: inviteeId } },
    },
    select: { id: true },
  });

  return !!group;
}
