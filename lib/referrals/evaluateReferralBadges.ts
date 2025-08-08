import { prisma } from '@/lib/prisma';

export async function evaluateReferralBadges(userId: string) {
  const groups = await prisma.referralGroup.findMany({
    where: { referrerId: userId },
    include: { users: true },
  });

  const active = groups.filter((\1: any) => g.expiresAt > new Date());
  const total = groups.length;

  let badge: string | null = null;

  if (total >= 5) {
    badge = 'Power Referrer';
  } else if (active.length >= 1) {
    badge = 'Active Referrer';
  } else if (total > 0) {
    badge = 'Inviter';
  }

  await prisma.user.update({
    where: { id: userId },
    data: { referralBadge: badge },
  });

  return badge;
}
