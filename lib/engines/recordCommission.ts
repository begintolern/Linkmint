// lib/engines/recordCommission.ts
import { prisma } from "@/lib/db";
import { CommissionType } from "@prisma/client";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { sendEmail } from "@/lib/email/sendEmail"; // ✅ New import

type RecordCommissionParams = {
  userId: string;
  amount: number;
  type: CommissionType;
  status?: string;
  source?: string;
  description?: string;
  bonusAmount?: number; // ✅ Optional
};

export async function recordCommission({
  userId,
  amount,
  type,
  status = "pending",
  source = "referral",
  description,
  bonusAmount = 0,
}: RecordCommissionParams) {
  // 1. Create the commission record
  await prisma.commission.create({
    data: {
      userId,
      amount,
      type,
      status,
      source,
      description,
    },
  });

  // 2. Create the payout record
  await prisma.payout.create({
    data: {
      userId,
      amount,
      status,
      method: "simulated",
    },
  });

  // 3. Find the referrer of this user
  const referredUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referredBy: true, // ✅ This gets the referrer
    },
  });

  const referrerEmail = referredUser?.referredBy?.email;
  const referrerId = referredUser?.referredBy?.id;

  // 4. Send Telegram Alert to Admin
  if (bonusAmount > 0) {
    await sendAlert(`📦 Commission earned: $${amount.toFixed(2)} pending (referral bonus active)`);
  } else {
    await sendAlert(`📦 Commission earned: $${amount.toFixed(2)} pending (no bonus – outside 90-day window)`);
  }

  // 5. Send Email Alert to Referrer (if email found)
  if (referrerEmail) {
    const subject = `You earned a commission!`;
    const text = bonusAmount > 0
      ? `🎉 Your referred user just made a purchase!\nYou earned $${amount.toFixed(2)} — including a 5% referral bonus.\n\nCheck your dashboard for details.`
      : `🎉 Your referred user just made a purchase!\nYou earned $${amount.toFixed(2)} — the 5% bonus was not applied as the referral window has ended.\n\nKeep sharing your link to earn more.`;

    await sendEmail({
      to: referrerEmail,
      subject,
      text,
    });
  }
}
