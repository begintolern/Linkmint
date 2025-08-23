// lib/engines/recordCommission.ts
import { prisma } from "@/lib/db";
import { CommissionType } from "@prisma/client";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { sendEmail } from "@/lib/email/sendEmail";

/**
 * Split policy (simple, transparent):
 * - Base invitee %: 80% of gross commission
 * - Referrer override: +5% of gross (only if invitee has referredById and within 90 days of invitee signup)
 * - Platform margin: remainder (>= 15%)
 * Notes:
 * - We store TWO rows:
 *    1) invitee's commission: type=referral_purchase
 *    2) referrer's override:  type=override_bonus   (only if window valid)
 * - Both rows: status="Pending", paidOut=false
 * - Platform margin is not stored as a Commission row.
 */
const INVITEE_PERCENT = 0.80;
const OVERRIDE_PERCENT = 0.05;
const REFERRAL_WINDOW_DAYS = 90;

export type RecordCommissionInput = {
  userId: string;              // invitee (the buyer / earner)
  amount: number;              // gross commission from network (USD)
  source?: string;             // e.g. "AMAZON" | "CJ" | "IMPACT" | "MANUAL"
  note?: string | null;
  description?: string | null;
  // Optionally override the type; default = referral_purchase
  type?: CommissionType;
};

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export async function recordCommission(input: RecordCommissionInput) {
  const {
    userId,
    amount,
    source = "MANUAL",
    note = null,
    description = null,
    type = CommissionType.referral_purchase,
  } = input;

  if (!userId) throw new Error("recordCommission: userId is required");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("recordCommission: amount must be a positive number");
  }

  // Load invitee and potential inviter
  const invitee = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      referredById: true,
      referredBy: { select: { id: true, email: true, name: true } },
    },
  });
  if (!invitee) throw new Error(`recordCommission: user not found: ${userId}`);

  // Determine if override applies (inviter exists AND within 90 days since invitee signup)
  const now = new Date();
  const withinWindow =
    !!invitee.createdAt && daysBetween(invitee.createdAt, now) <= REFERRAL_WINDOW_DAYS;
  const hasInviter = !!invitee.referredById && !!invitee.referredBy?.id;
  const applyOverride = hasInviter && withinWindow;

  // Compute splits
  const inviteeShare = roundMoney(amount * INVITEE_PERCENT);
  const overrideShare = applyOverride ? roundMoney(amount * OVERRIDE_PERCENT) : 0;
  const platformMargin = roundMoney(amount - inviteeShare - overrideShare);
  // Safety: never let platform margin go negative
  const safePlatformMargin = Math.max(platformMargin, 0);

  // 1) Create the main commission for the invitee
  const mainCommission = await prisma.commission.create({
    data: {
      userId: invitee.id,
      amount: inviteeShare,
      type,                         // CommissionType.referral_purchase by default
      status: "Pending",
      paidOut: false,
      source,
      description: description ?? "Invitee commission",
      // if your schema has a "note" field on Commission, you can add it:
      // note,
    } as any,
  });

  // 2) Optionally create the override for the inviter
  let overrideCommission = null as null | { id: string; userId: string; amount: number };
  if (applyOverride && overrideShare > 0) {
    overrideCommission = await prisma.commission.create({
      data: {
        userId: invitee.referredBy!.id,
        amount: overrideShare,
        type: CommissionType.override_bonus,
        status: "Pending",
        paidOut: false,
        source: "OVERRIDE",
        description: `Override from invitee ${invitee.email ?? invitee.id} purchase`,
      } as any,
    });
  }

  // 3) Event logs (audit)
  try {
    await prisma.eventLog.create({
      data: {
        userId: invitee.id,
        type: "commission",
        message: `Commission created for invitee (${inviteeShare.toFixed(2)})`,
        detail: JSON.stringify({
          gross: amount,
          inviteeShare,
          overrideShare: overrideShare || 0,
          platformMargin: safePlatformMargin,
          inviterId: invitee.referredBy?.id ?? null,
          inviterEmail: invitee.referredBy?.email ?? null,
          commissionId: mainCommission.id,
          source,
          note,
        }),
      },
    });

    if (overrideCommission) {
      await prisma.eventLog.create({
        data: {
          userId: invitee.referredBy!.id,
          type: "commission",
          message: `Override commission created for inviter (${overrideShare.toFixed(2)})`,
          detail: JSON.stringify({
            gross: amount,
            inviteeId: invitee.id,
            inviteeEmail: invitee.email,
            overrideShare,
            commissionId: overrideCommission.id,
            source: "OVERRIDE",
          }),
        },
      });
    }
  } catch (e) {
    console.warn("eventLog write failed (non-blocking):", e);
  }

  // 4) Best‑effort notifications (non‑blocking)
  try {
    await sendAlert(
      `🧾 Commission split\nGross: $${amount.toFixed(2)}\nInvitee: $${inviteeShare.toFixed(
        2
      )}\nOverride: $${overrideShare.toFixed(2)}\nPlatform: $${safePlatformMargin.toFixed(
        2
      )}\nInvitee: ${invitee.email ?? invitee.id}${
        invitee.referredBy?.email ? `\nInviter: ${invitee.referredBy.email}` : ""
      }`
    );
  } catch (e) {
    // ignore
  }

  try {
    await sendEmail({
      to: process.env.OP_ALERT_EMAIL || "ops@linkmint.co",
      subject: "Commission recorded (split)",
      text: [
        `Gross: $${amount.toFixed(2)}`,
        `Invitee: $${inviteeShare.toFixed(2)}`,
        `Override: $${overrideShare.toFixed(2)}`,
        `Platform: $${safePlatformMargin.toFixed(2)}`,
        `Invitee: ${invitee.email ?? invitee.id}`,
        `Inviter: ${invitee.referredBy?.email ?? "N/A"}`,
        `Source: ${source}`,
      ].join("\n"),
    });
  } catch (e) {
    // ignore
  }

  return {
    commission: mainCommission,
    override: overrideCommission,
    splits: {
      gross: amount,
      invitee: inviteeShare,
      override: overrideShare,
      platform: safePlatformMargin,
      appliedOverride: applyOverride,
      windowDays: REFERRAL_WINDOW_DAYS,
    },
  };
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export default recordCommission;
