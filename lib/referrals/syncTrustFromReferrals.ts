// lib/referrals/syncTrustFromReferrals.ts
import { prisma } from "@/lib/db";

/**
 * Bumps inviter's trustScore once they have at least 1 referral group (batch-of-3).
 * Idempotent: never lowers trustScore, only raises to a floor.
 * Logs what happened so you can confirm during dev.
 */
export async function syncTrustFromReferrals(inviterId: string) {
  const batchCount = await prisma.referralGroup.count({
    where: { referrer: { id: inviterId } },
  });

  if (batchCount <= 0) {
    console.log(`[trust-sync] inviter=${inviterId} has 0 batches → no change`);
    return { updated: false, batchCount: 0 };
  }

  const me = await prisma.user.findUnique({
    where: { id: inviterId },
    select: { trustScore: true, email: true },
  });
  if (!me) {
    console.log(`[trust-sync] inviter not found: ${inviterId}`);
    return { updated: false, batchCount };
  }

  // Floors per milestone (simple v1 logic)
  // 1+ batches -> 60, 2+ -> 70, 3+ -> 80
  const floors = [0, 60, 70, 80];
  const desiredFloor = floors[Math.min(batchCount, floors.length - 1)];
  const current = typeof me.trustScore === "number" ? me.trustScore : 0;

  if (current >= desiredFloor) {
    console.log(
      `[trust-sync] inviter=${inviterId} (${me.email}) batches=${batchCount} currentScore=${current} >= floor=${desiredFloor} → no change`
    );
    return { updated: false, batchCount, trustScore: current };
  }

  const updated = await prisma.user.update({
    where: { id: inviterId },
    data: { trustScore: desiredFloor },
    select: { trustScore: true },
  });

  console.log(
    `[trust-sync] inviter=${inviterId} (${me.email}) batches=${batchCount} score: ${current} -> ${updated.trustScore}`
  );

  return { updated: true, batchCount, trustScore: updated.trustScore };
}
