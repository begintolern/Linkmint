// lib/referrals/createReferralBatch.ts
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const BONUS_WINDOW_DAYS = 90;

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/**
 * Removes any referral groups for this inviter that have zero users.
 * Safe to run every time before creating a new group.
 */
async function purgeEmptyGroups(inviterId: string) {
  // Find empty groups (no users) for this inviter
  const empties = await prisma.referralGroup.findMany({
    where: {
      referrer: { id: inviterId },
      users: { none: {} },
    },
    select: { id: true },
  });

  if (empties.length === 0) return { deleted: 0 };

  await prisma.referralGroup.deleteMany({
    where: { id: { in: empties.map((g) => g.id) } },
  });
  return { deleted: empties.length };
}

/**
 * Creates ONE batch-of-3 for inviter (if possible) in a single transaction.
 * If fewer than 3 users are attached, the transaction throws to avoid empty groups.
 */
export async function createReferralBatch(inviterId: string) {
  // Make sure no zombie/empty groups linger
  await purgeEmptyGroups(inviterId);

  // Invitees referred by inviter that are NOT yet in any group
  const ungroupedInvitees = await prisma.user.findMany({
    where: {
      referredById: inviterId,
      referralGroupId: null,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  if (ungroupedInvitees.length < 3) {
    return {
      created: false as const,
      reason: "NEED_THREE" as const,
      available: ungroupedInvitees.length,
    };
  }

  const batchUsers = ungroupedInvitees.slice(0, 3);
  const now = new Date();
  const expiresAt = addDays(now, BONUS_WINDOW_DAYS);

  // Atomic create + attach
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create group with required referrer relation
    const group = await tx.referralGroup.create({
      data: {
        referrer: { connect: { id: inviterId } },
        startedAt: now,
        expiresAt,
      },
      select: { id: true },
    });

    // Attach exactly 3 users
    const updateRes = await tx.user.updateMany({
      where: { id: { in: batchUsers.map((u) => u.id) } },
      data: { referralGroupId: group.id },
    });

    // If for any reason fewer than 3 rows were updated, abort (prevents empty groups)
    if (updateRes.count !== 3) {
      // Throwing inside $transaction will roll back the created group
      throw new Error(
        `attach-users-failed: expected=3 updated=${updateRes.count} groupId=${group.id}`
      );
    }

    return {
      groupId: group.id,
      userIds: batchUsers.map((u) => u.id),
      startedAt: now,
      expiresAt,
    };
  });

  return { created: true as const, ...result };
}

/**
 * Ensure all possible complete batches (multiples of 3) exist for this inviter.
 * Also returns current groups + ungrouped count for UI.
 */
export async function ensureBatchesFor(inviterId: string) {
  // Clean empties first
  await purgeEmptyGroups(inviterId);

  // Try to form as many full groups as possible (e.g., 3, 6, 9…)
  for (let i = 0; i < 10; i++) {
    const res = await createReferralBatch(inviterId);
    if (!res.created) break;
  }

  // Fetch current groups for this inviter
  const groups = await prisma.referralGroup.findMany({
    where: { referrer: { id: inviterId } },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      expiresAt: true,
      users: { select: { id: true, email: true } },
    },
  });

  const ungroupedCount = await prisma.user.count({
    where: { referredById: inviterId, referralGroupId: null },
  });

  return { groups, ungroupedCount };
}
