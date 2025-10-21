// lib/referrals/maybeCreateReferralGroup.ts
import { prisma } from "@/lib/db";

/**
 * Call this AFTER a commission is approved for {inviteeId}.
 * It will:
 *  - Skip if invitee has no referrer.
 *  - Skip if invitee is already in any ReferralGroup for that referrer.
 *  - Mark invitee as "eligible" implicitly (via commission existence, no extra table).
 *  - If the referrer has 3 "eligible but ungrouped" invitees, create a new ReferralGroup
 *    with those last 3 and start a 90-day window now.
 */
export async function maybeCreateReferralGroup(inviteeId: string) {
  // Look up invitee and referrer
  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { id: true, referredById: true },
  });
  if (!invitee || !invitee.referredById) return;

  const referrerId = invitee.referredById;

  // If invitee is already in a group for this referrer, do nothing
  const alreadyInGroup = await prisma.referralGroup.findFirst({
    where: {
      referrerId,
      users: { some: { id: inviteeId } },
    },
    select: { id: true },
  });
  if (alreadyInGroup) return;

  // Define "eligible" invitees = have at least ONE approved commission
  // and NOT already in any ReferralGroup for this referrer.
  // We fetch recent eligible invitees and filter out those in groups.
  const eligibleInvitees = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      commissions: {
        some: { status: "APPROVED" }, // adjust to your approved status field/value
      },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (eligibleInvitees.length === 0) return;

  // Filter out invitees that are already grouped
  const ungrouped: string[] = [];
  for (const u of eligibleInvitees) {
    const inAnyGroup = await prisma.referralGroup.findFirst({
      where: { referrerId, users: { some: { id: u.id } } },
      select: { id: true },
    });
    if (!inAnyGroup) ungrouped.push(u.id);
  }

  // If we have at least 3 ungrouped eligible invitees, take the LAST 3 for a new batch
  if (ungrouped.length >= 3) {
    const last3 = ungrouped.slice(-3);
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

    await prisma.referralGroup.create({
      data: {
        referrerId,
        startedAt,
        expiresAt,
        users: { connect: last3.map((id) => ({ id })) },
      },
    });
  }
}
