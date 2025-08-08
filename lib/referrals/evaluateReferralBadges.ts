// lib/referrals/evaluateReferralBadges.ts
import { prisma } from "@/lib/db";

/**
 * Evaluate referral badge status for a referrer.
 * Rules (tweak as needed):
 *  - 3+ total referrals  => "Inviter"
 *  - 6+ total referrals  => "Active Referrer"
 *  - 9+ total referrals  => "Power Referrer"
 */
export async function evaluateReferralBadges(referrerId: string) {
  const groups = await prisma.referralGroup.findMany({
    where: { referrerId },
    include: { users: true },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();

  const activeGroups = groups.filter(
    (grp) => !!grp.expiresAt && grp.expiresAt > now
  );

  const totalReferrals = groups.reduce(
    (sum: number, grp: { users: unknown[] }) => sum + (grp.users?.length ?? 0),
    0
  );

  let badge: string | null = null;
  if (totalReferrals >= 9) badge = "Power Referrer";
  else if (totalReferrals >= 6) badge = "Active Referrer";
  else if (totalReferrals >= 3) badge = "Inviter";

  return {
    totalGroups: groups.length,
    activeGroups: activeGroups.length,
    totalReferrals,
    badge,
  };
}

export default evaluateReferralBadges;
