// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * finalizeCommission()
 * Applies the 5% referral bonus (from invitee) when a referrer’s 90-day window
 * is active for this invitee. Also inlines auto-creation of a ReferralGroup
 * when a referrer reaches 3 eligible (approved) invitees.
 *
 * Notes:
 * - Commission amount is resolved dynamically (grossCents/amountCents/netCents/amount).
 * - Payout rows use `amount` (decimal dollars) to match your Payout schema.
 */
export async function finalizeCommission(commissionId: string) {
  // 0) Load commission + minimal user info
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { user: { select: { id: true, referredById: true } } },
  });
  if (!commission) throw new Error("Commission not found");

  // 1) Resolve gross cents from whatever your schema stores
  const cAny = commission as any;
  const candidates = [
    cAny.grossCents,
    cAny.amountCents,
    cAny.netCents,
    typeof cAny.amount === "number" ? Math.round(cAny.amount * 100) : undefined,
  ];
  const grossCents = candidates.find((v) => Number.isFinite(v) && (v as number) > 0);
  if (!Number.isFinite(grossCents)) {
    throw new Error(
      "Commission amount not found. Expected one of: grossCents, amountCents, netCents, amount"
    );
  }

  const inviteeId: string = commission.userId;
  const referrerId: string | null = commission.user?.referredById ?? null;

  // 2) Check if 90-day referral window is active for this pair
  const isActive = await isReferralActiveForPair({ referrerId, inviteeId });

  // 3) Compute split (pure math)
  const split = calcSplit({
    grossCents: grossCents as number,
    isReferralActive: isActive,
  });

  // 4) Persist payouts
  // Your Payout schema expects `amount` (decimal dollars). Keep payload minimal.
  const payoutRows: any[] = [
    {
      userId: inviteeId,
      commissionId: commission.id,
      amount: split.inviteeCents / 100, // dollars
      // type: "INVITEE_EARN",
      // statusEnum: "PENDING",
    },
  ];

  if (split.referrerCents > 0 && referrerId) {
    payoutRows.push({
      userId: referrerId,
      commissionId: commission.id,
      amount: split.referrerCents / 100, // dollars
      // type: "REFERRER_BONUS",
      // statusEnum: "PENDING",
    });
  }

  // If you also store platform margin as a payout row, uncomment:
  // payoutRows.push({
  //   userId: null,
  //   commissionId: commission.id,
  //   amount: split.platformCents / 100, // dollars
  //   // type: "PLATFORM_MARGIN",
  //   // statusEnum: "ACCOUNTED",
  // });

  await prisma.payout.createMany({ data: payoutRows });

  // 5) (Optional) update commission flags if your schema has them
  // try {
  //   await prisma.commission.update({
  //     where: { id: commission.id },
  //     data: {
  //       // status: "PAID_OUT",
  //       // appliedReferralBonus: split.appliedReferralBonus,
  //     },
  //   });
  // } catch {}

  // 6) Inline auto-create ReferralGroup if referrer now has 3 eligible, ungrouped invitees
  await maybeCreateReferralGroupInline(inviteeId);

  return {
    success: true,
    commissionId: commission.id,
    appliedReferralBonus: split.appliedReferralBonus,
  };
}

/**
 * INLINE helper (kept in this file to avoid extra files).
 * Called AFTER a commission approval for inviteeId.
 * If the referrer has >= 3 eligible & ungrouped invitees, create a new 90-day ReferralGroup.
 *
 * Eligible = user has at least one commission with status "APPROVED".
 * Adjust the status string if your schema differs.
 */
async function maybeCreateReferralGroupInline(inviteeId: string) {
  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { id: true, referredById: true },
  });
  if (!invitee?.referredById) return;
  const referrerId = invitee.referredById;

  // If this invitee is already in a group for that referrer, do nothing
  const alreadyInGroup = await prisma.referralGroup.findFirst({
    where: { referrerId, users: { some: { id: inviteeId } } },
    select: { id: true },
  });
  if (alreadyInGroup) return;

  // Find eligible invitees for this referrer (at least one approved commission)
  const eligibleInvitees = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      commissions: { some: { status: "APPROVED" } }, // adjust if needed
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (eligibleInvitees.length === 0) return;

  // Exclude those already in any group by this referrer
  const ungrouped: string[] = [];
  for (const u of eligibleInvitees) {
    const inAnyGroup = await prisma.referralGroup.findFirst({
      where: { referrerId, users: { some: { id: u.id } } },
      select: { id: true },
    });
    if (!inAnyGroup) ungrouped.push(u.id);
  }

  // Create a batch when we have 3 or more ungrouped
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
