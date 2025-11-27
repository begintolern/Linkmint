// lib/engines/autoPayoutEngine.ts

import { prisma } from "@/lib/db";
import { sendPaypalPayout } from "@/lib/payments/sendPaypalPayout";

export type PayTarget = {
  id: string;
  userId: string;
  amount: number;
};

export type PayoutEngineResult = {
  success: boolean;
  paid: number;
  items: PayTarget[];
  error?: string;
};

// Founder override list – add more emails later if needed
const FOUNDER_EMAILS = ["ertorig3@gmail.com", "fluterby_25@yahoo.com"];

const FLOAT_KEY = "FLOAT_BALANCE"; // PHP float balance

/**
 * Centralized engine for paying approved commissions via PayPal.
 * For now this mirrors the logic in app/api/admin/payouts/route.ts
 * (TrustScore gate + float guard for EARLY payouts).
 */
export async function payApprovedCommissionsViaPaypal(
  targets: PayTarget[],
  opts?: { early?: boolean }
): Promise<PayoutEngineResult> {
  if (!targets.length) {
    return { success: true, paid: 0, items: [] };
  }

  const isEarly = opts?.early === true;

  // Batch-level float guard for EARLY payouts
  if (isEarly) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: FLOAT_KEY },
    });

    // default 5000 PHP if not set yet
    const currentFloat =
      setting && setting.value ? parseFloat(setting.value) : 5000;

    const totalRequested = targets.reduce((sum, t) => sum + t.amount, 0);

    if (totalRequested > currentFloat) {
      return {
        success: false,
        paid: 0,
        items: targets,
        error: `Not enough float. Requested ${totalRequested.toFixed(
          2
        )} PHP, available ${currentFloat.toFixed(2)} PHP.`,
      };
    }
  }

  let paid = 0;

  for (const t of targets) {
    const user = await prisma.user.findUnique({
      where: { id: t.userId },
      select: { email: true, trustScore: true, createdAt: true },
    });

    if (!user?.email) {
      await prisma.eventLog.create({
        data: {
          userId: t.userId,
          type: "payout_error",
          message: `Missing email for ${t.userId}`,
          detail: t.id,
        },
      });
      continue;
    }

    const emailLower = user.email.toLowerCase();
    const isFounder = FOUNDER_EMAILS.includes(emailLower);

    // TrustScore gate for EARLY payouts only, founders bypass but still respect float
    if (isEarly && !isFounder) {
      const MIN_TRUST_SCORE = 50;
      const MIN_ACCOUNT_AGE_DAYS = 30;

      const ageMs = Date.now() - user.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (user.trustScore < MIN_TRUST_SCORE || ageDays < MIN_ACCOUNT_AGE_DAYS) {
        await prisma.eventLog.create({
          data: {
            userId: t.userId,
            type: "payout_blocked",
            message: `Early payout blocked by TrustScore/age for commission ${t.id}`,
            detail: `trustScore=${user.trustScore}; ageDays=${ageDays.toFixed(
              1
            )}`,
          },
        });
        continue;
      }
    }

    const res = await sendPaypalPayout({
      userId: t.userId,
      email: user.email,
      amount: t.amount,
      note: `Commission ${t.id}`,
    });

    if (res.success) {
      try {
        await prisma.$transaction(async (tx) => {
          // Per-payout float decrement for EARLY payouts
          if (isEarly) {
            const setting = await tx.systemSetting.findUnique({
              where: { key: FLOAT_KEY },
            });

            const currentFloat =
              setting && setting.value ? parseFloat(setting.value) : 5000;

            if (currentFloat < t.amount) {
              throw new Error(
                `Insufficient float for payout of ${t.amount.toFixed(
                  2
                )} PHP. Current float: ${currentFloat.toFixed(2)} PHP.`
              );
            }

            const newFloat = currentFloat - t.amount;

            await tx.systemSetting.upsert({
              where: { key: FLOAT_KEY },
              update: { value: newFloat.toString() },
              create: { key: FLOAT_KEY, value: newFloat.toString() },
            });
          }

          await tx.commission.update({
            where: { id: t.id },
            data: { status: "PAID", paidOut: true },
          });

          await tx.eventLog.create({
            data: {
              userId: t.userId,
              type: "payout",
              message: `Commission ${t.id} paid`,
              detail: `Amount ${t.amount}; txn=${res.id}`,
            },
          });
        });

        paid++;
      } catch (err: any) {
        await prisma.eventLog.create({
          data: {
            userId: t.userId,
            type: "payout_error",
            message: `Payout float/commit FAILED for ${t.id}`,
            detail: err?.message || "Unknown error",
          },
        });
      }
    } else {
      await prisma.eventLog.create({
        data: {
          userId: t.userId,
          type: "payout_error",
          message: `Payout FAILED for ${t.id}`,
          detail: res.error || "Unknown error",
        },
      });
    }
  }

  return { success: true, paid, items: targets };
}
