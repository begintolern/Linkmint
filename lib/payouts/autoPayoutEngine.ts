import { prisma } from "@/lib/prisma";
import { sendTelegramAlert } from "@/lib/telegram/notify";

// Config
const FLOAT_CAP = 1000; // Max $1000 allowed for early float payouts

export async function runAutoPayoutEngine() {
  const floatUsage = await getCurrentFloatUsage();
  if (floatUsage >= FLOAT_CAP) {
    await sendTelegramAlert(`🛑 Auto Payouts Paused: Float cap ($${FLOAT_CAP}) reached.`);
    return;
  }

  const eligibleUsers = await prisma.user.findMany({
    where: {
      trustScore: { gte: 80 },
      emailVerified: true,
      payouts: {
        none: { status: "pending" },
      },
    },
    include: {
      payouts: true,
    },
  });

  for (const user of eligibleUsers) {
    const approvedPayouts = await prisma.payout.findMany({
      where: {
        userId: user.id,
        status: "approved",
      },
    });

    const totalApproved = approvedPayouts.reduce((sum, p) => sum + p.amount, 0);

    if (totalApproved > 0 && floatUsage + totalApproved <= FLOAT_CAP) {
      try {
        // Mark all approved payouts as "paid"
        await prisma.payout.updateMany({
          where: {
            userId: user.id,
            status: "approved",
          },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        // Log
        await prisma.eventLogs.create({
          data: {
            userId: user.id,
            type: "payout",
            detail: `Auto payout executed`,
            message: `Auto-payout of $${totalApproved} sent.`,
          },
        });

        // Update float log
        await prisma.floatLog.create({
          data: {
            amount: totalApproved,
            source: "AutoPayoutEngine",
            note: `Auto payout for user ${user.email}`,
          },
        });

        await sendTelegramAlert(
          `✅ Auto payout sent: $${totalApproved.toFixed(2)} to ${user.email}`
        );
      } catch (err) {
        console.error("Auto payout error:", err);
        await sendTelegramAlert(`❌ Auto payout FAILED for ${user.email}`);
      }
    }
  }
}

async function getCurrentFloatUsage(): Promise<number> {
  const all = await prisma.floatLog.findMany();
  return all.reduce((sum, log) => sum + log.amount, 0);
}
