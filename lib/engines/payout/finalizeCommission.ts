// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * Called when an affiliate commission is approved and ready to record payouts.
 * Applies the 5% referral bonus (from invitee) when the 90-day window is active.
 * Also (inline) auto-creates a ReferralGroup once a referrer has 3 eligible invitees.
 */
export async function finalizeCommission(commissionId: string) {
  // Fetch commission + user(referredById)
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { user: { select: { id: true, referredById: true } } },
  });
  if (!commission) throw new Error("Commission not found");

  // Resolve gross cents from whatever amount field your schema actually has
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

  const inviteeId = commission.userId;
  const referrerId = commission.user?.referredById ?? null;

  // 1) Check referral window
  const isActive = await isReferralActiveForPair({
    referrerId,
    inviteeId,
  });

  // 2) Compute split
  const split = calcSplit({
    grossCents: grossCents as number,
    isReferralActive: isActive,
  });

  // 3) Persist payouts (minimal fields; add your own type/status if you have them)
  const data: any[] = [
    {
      userId: inviteeId,
      netCents: split.inviteeCents,
      commissionId: commission.id,
      // type: "INVITEE_EARN",
      // statusEnum: "PENDING",
    },
  ];
  if (split.referrerCents > 0 && referrerId) {
    data.push({
      userId: referrerId,
      netCents: split.referrerCents,
      commissionId: commission.id,
      // type: "REFERRER_BONUS",
      // statusEnum: "PENDING",
    });
  }
  await prisma.payout.createMany({ data });

  // 4) (Optional) mark flags/status on commission if your model supports it
  // try {
  //   await prisma.commission.update({
  //     where: { id: commission.id },
  //     data: { appliedReferralBonus: split.appliedReferralBonus, status: "PAID_OUT" },
  //   });
  // } catch {}

  // 5) INLINE: maybe create a ReferralGroup if referrer now has 3 eligible invitees
  //    "Eligible" = invitee has at least one APPROVED commission.
  //    Adjust status value if your schema uses a different string/enum.
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
 */
async function maybeCreateReferralGroupInline(inviteeId: string) {
  // Look up invitee + referrer
  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { id: true, referredById: true },
  });
  if (!invitee?.referredById) return;
  const referrerId = invitee.referredById;

  // If this invitee is already in a group for that referrer, stop
  const alreadyInGroup = await prisma.referralGroup.findFirst({
    where: { referrerId, users: { some: { id: inviteeId } } },
    select: { id: true },
  });
  if (alreadyInGroup) return;

  // Eligible invitees = referredById matches + have at least one APPROVED commission
  // NOTE: If your approved status name differs, change "APPROVED" below.
  const eligibleInvitees = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      commissions: { some: { status: "APPROVED" } }, // <-- adjust if needed
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (eligibleInvitees.length === 0) return;

  // Exclude those already in any ReferralGroup by this referrer
  const ungrouped: string[] = [];
  for (const u of eligibleInvitees) {
    const inAnyGroup = await prisma.referralGroup.findFirst({
      where: { referrerId, users: { some: { id: u.id } } },
      select: { id: true },
    });
    if (!inAnyGroup) ungrouped.push(u.id);
  }

  // If 3 or more ungrouped eligible invitees exist, create a new batch with the latest 3
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
