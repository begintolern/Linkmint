// lib/referrals/evaluateReferralBadges.ts
import { prisma } from "@/lib/db";

type ReferralGroupLite = {
  expiresAt: Date | null;
  users: unknown[];
};

export async function evaluateReferralBadges(referrerId: string) {
  const groups: ReferralGroupLite[] = await prisma.referralGroup.findMany({
    where: { referrerId },
    select: { expiresAt: true, users: true },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();
  const activeGroups = groups.filter((g) => !!g.expiresAt && g.expiresAt > now);
  const totalReferrals = groups.reduce((sum, g) => sum + (g.users?.length ?? 0), 0);

  let badge: string | null = null;
  if (totalReferrals >= 9) badge = "Power Referrer";
  else if (totalReferrals >= 6) badge = "Active Referrer";
  else if (totalReferrals >= 3) badge = "Inviter";

  // Persist badge on the user record (idempotent)
  const prev = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { referralBadge: true },
  });

  let updated = false;
  if (prev?.referralBadge !== badge) {
    await prisma.user.update({
      where: { id: referrerId },
      data: { referralBadge: badge },
    });
    updated = true;
  }

  return {
    totalGroups: groups.length,
    activeGroups: activeGroups.length,
    totalReferrals,
    badge,
    updated,
  };
}

export default evaluateReferralBadges;
