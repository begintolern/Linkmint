// lib/engines/autoPayoutEngine.ts
import { prisma } from "@/lib/db";
import { sendPayoutAlert } from "@/lib/alerts/sendPayoutAlert";
import type { Prisma } from "@prisma/client";

export async function runAutoPayoutEngine() {
  console.log("🚀 Auto payout engine starting...");

  // Find users who have APPROVED, unpaid commissions
  const users = await prisma.user.findMany({
    where: {
      commissions: {
        some: { paidOut: false, status: "APPROVED" as any },
      },
    },
    include: {
      commissions: {
        where: { paidOut: false, status: "APPROVED" as any },
        select: { id: true, amount: true },
      },
    },
  });

  console.log(`Found ${users.length} users with APPROVED commissions.`);

  for (const user of users) {
    const approved = user.commissions as Array<{ id: string; amount: any }>;
    if (!approved.length) continue;

    // Sum amounts (Decimal-safe)
    const totalAmount = approved.reduce((sum, c) => {
      const toNum =
        typeof (c as any)?.amount?.toNumber === "function"
          ? (c as any).amount.toNumber()
          : Number((c as any)?.amount ?? 0);
      return sum + (Number.isFinite(toNum) ? toNum : 0);
    }, 0);

    if (totalAmount <= 0) continue;

    console.log(
      `Processing auto-payout for ${user.email ?? user.id} — $${totalAmount.toFixed(2)}`
    );

    // In a single transaction: create payout, mark commissions as PAID, log event
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payout.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          status: "PAID" as any, // Use your enum value exactly
          source: "AUTO_PAYOUT",
          // Optional: store a placeholder tx id if you later wire PayPal
          // paypalTransactionId: null
        } as any,
      });

      await tx.commission.updateMany({
        where: { id: { in: approved.map((c) => c.id) } },
        data: {
          status: "PAID" as any, // exact enum value
          paidOut: true,
        },
      });

      await tx.eventLog.create({
        data: {
          type: "payout",
          message: `Auto-payout: ${approved.length} commission(s) paid for ${user.email ?? user.id} — total $${totalAmount.toFixed(
            2
          )} (ids: ${approved.map((c) => c.id).join(", ")})`,
        },
      });
    });

    // Non-blocking alert (safe no-op if not configured)
    try {
      await sendPayoutAlert(String(user.email ?? user.id), totalAmount);
    } catch (e) {
      console.warn("sendPayoutAlert failed (non-blocking):", e);
    }
  }

  console.log("🏁 Auto payout engine finished.");
}

export default runAutoPayoutEngine;
