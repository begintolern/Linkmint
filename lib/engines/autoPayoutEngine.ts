// lib/engines/autoPayoutEngine.ts
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert } from "@/lib/telegram/notify";

export async function runAutoPayoutEngine() {
  console.log("🚀 Running Auto Payout Engine...");

  // 🔒 Check if auto payouts are enabled
  const setting = await prisma.systemSetting.findUnique({
  where: { key: "autoPayoutEnabled" },
});

if (setting?.value !== "true") {
  console.log("Auto payouts are currently disabled.");
  return;
}

  const eligibleUsers = await prisma.user.findMany({
    where: {
      trustScore: { gte: 70 },
      emailVerified: true,
      payouts: {
        none: {
          status: "pending",
        },
      },
    },
    include: {
      payouts: true,
    },
  });

  let totalPaid = 0;
  let payoutsTriggered = 0;

  for (const user of eligibleUsers) {
    const approvedCommissions = await prisma.commission.findMany({
      where: {
        userId: user.id,
        status: "approved",
      },
    });

    const totalAmount = approvedCommissions.reduce((sum, c) => sum + c.amount, 0);

    if (totalAmount === 0) continue;

    // Mark commissions as paid
    await prisma.commission.updateMany({
      where: {
        userId: user.id,
        status: "approved",
      },
      data: {
        status: "paid",
      },
    });

    // Create payout entry
    await prisma.payout.create({
      data: {
        userId: user.id,
        amount: totalAmount,
        method: "paypal",
        status: "pending",
        details: null,
        approvedAt: null,
        paidAt: null,
      },
    });

    totalPaid += totalAmount;
    payoutsTriggered += 1;

    // Send Telegram alert
    await sendTelegramAlert(`💸 Auto Payout triggered for ${user.email} | $${totalAmount.toFixed(2)}`);
  }

  console.log(`✅ Auto payout engine completed. ${payoutsTriggered} payouts triggered. Total paid: $${totalPaid}`);
}
