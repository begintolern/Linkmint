// lib/referrals/getReferralStats.ts
import { prisma } from "@/lib/db";

type ReferralUserLite = { email: string | null };
type ReferralGroupLite = {
  expiresAt: Date | null;
  users: ReferralUserLite[] | null;
};

export async function getReferralStats(referrerId: string) {
  const groups: ReferralGroupLite[] = await prisma.referralGroup.findMany({
    where: { referrerId },
    select: {
      expiresAt: true,
      users: { select: { email: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();

  const activeGroups = groups.filter(
    (g: ReferralGroupLite) => !!g.expiresAt && g.expiresAt > now
  );

  const totalInvitees = groups.reduce(
    (sum: number, g: ReferralGroupLite) => sum + (g.users?.length ?? 0),
    0
  );

  const inviteeEmails = groups.flatMap((batch: ReferralGroupLite) =>
    (batch.users ?? []).map((u: ReferralUserLite) => u.email).filter(Boolean) as string[]
  );

  return {
    totalGroups: groups.length,
    activeGroups: activeGroups.length,
    totalInvitees,
    inviteeEmails,
  };
}

export default getReferralStats;
