// lib/referrals/getReferralStats.ts
import { prisma } from "@/lib/db";

/**
 * Returns referral stats for a given referrer.
 * Aggregates groups, active groups, total invitees, and invitee emails.
 */
export async function getReferralStats(referrerId: string) {
  const groups = await prisma.referralGroup.findMany({
    where: { referrerId },
    select: {
      id: true,
      startedAt: true,
      expiresAt: true,
      users: { select: { email: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();
  const activeGroups = groups.filter((g) => g.expiresAt && g.expiresAt > now);
  const totalInvitees = groups.reduce((sum, g) => sum + (g.users?.length ?? 0), 0);
  const inviteeEmails = groups.flatMap((batch) =>
    (batch.users ?? []).map((u) => u.email)
  );

  return {
    totalGroups: groups.length,
    activeGroups: activeGroups.length,
    totalInvitees,
    inviteeEmails,
    groups,
  };
}
