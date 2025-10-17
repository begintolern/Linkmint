// lib/engines/payout/finalizeCommission.ts
import { prisma } from "@/lib/db";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { calcSplit } from "@/lib/engines/payout/calcSplit";

/**
 * finalizeCommission()
 * - Applies 5% referral bonus from invitee when referrer’s 90-day window is active.
 * - Uses only fields that exist on your Payout model.
 * - Stores commission id in `details` string for traceability (since no commissionId column).
 */
export async function finalizeCommission(commissionId: string) {
  // Load commission and minimal user info
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: { user: { select: { id: true, referredById: true } } },
  });
  if (!commission) throw new Error("Commission not found");

  // Resolve gross cents from whatever you store
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

  // Check 90-day window
  const isActive = await isReferralActiveForPair({ referrerId, inviteeId });

  // Compute split
  const split = calcSplit({
    grossCents: grossCents as number,
    isReferralActive: isActive,
  });

  // Build payouts using ONLY fields your Payout model has
  const baseDetails = `commission:${commission.id}${isActive ? " (referral 5% active)" : ""}`;

  const payoutRows: Array<Parameters<typeof prisma.payout.createMany>[0]["data"][number]> = [
    {
      userId: inviteeId,
      amount: split.inviteeCents / 100, // Float dollars
      method: "EARNINGS",               // required String
      status: "PENDING",                // required String
      details: baseDetails,
      // feeCents/netCents have defaults; provider/statusEnum optional
    },
  ];

  if (split.referrerCents > 0 && referrerId) {
    payoutRows.push({
      userId: referrerId,
      amount: split.referrerCents / 100,
      method: "REFERRAL",
      status: "PENDING",
      details: baseDetails,
    });
  }

  await prisma.payout.createMany({ data: payoutRows });

  // Inline: auto-create referral group after approvals (3 ungrouped eligible invitees)
  await maybeCreateReferralGroupInline(inviteeId);

  return {
    success: true,
    commissionId: commission.id,
    appliedReferralBonus: split.appliedReferralBonus,
  };
}

async function maybeCreateReferralGroupInline(inviteeId: string) {
  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { id: true, referredById: true },
  });
  if (!invitee?.referredById) return;
  const referrerId = invitee.referredById;

  // Already grouped?
  const alreadyInGroup = await prisma.referralGroup.findFirst({
    where: { referrerId, users: { some: { id: inviteeId } } },
    select: { id: true },
  });
  if (alreadyInGroup) return;

  // Eligible = has at least one APPROVED commission (adjust status if needed)
  const eligibleInvitees = await prisma.user.findMany({
    where: {
      referredById: referrerId,
      commissions: { some: { status: "APPROVED" } },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (eligibleInvitees.length === 0) return;

  // Filter out already grouped
  const ungrouped: string[] = [];
  for (const u of eligibleInvitees) {
    const inAnyGroup = await prisma.referralGroup.findFirst({
      where: { referrerId, users: { some: { id: u.id } } },
      select: { id: true },
    });
    if (!inAnyGroup) ungrouped.push(u.id);
  }

  // Create batch with latest 3
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
