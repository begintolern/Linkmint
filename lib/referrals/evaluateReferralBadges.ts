// lib/referrals/evaluateReferralBadges.ts
import { prisma } from "@/lib/db";

type ReferralGroupLite = {
  expiresAt: Date | null;
  users: unknown[];
};

export async function evaluateReferralBadges(referrerId: string) {
  const groups: ReferralGroupLite[] = await prisma.referralGroup.findMany({
    where: { referrerId },
    select: {
      expiresAt: true,
      users: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();

  const activeGroups = groups.filter(
    (grp: ReferralGroupLite) => !!grp.expiresAt && grp.expiresAt > now
  );

  const totalReferrals = groups.reduce(
    (sum: number, grp: ReferralGroupLite) => sum + (grp.users?.length ?? 0),
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
