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
    try {
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

      // 🔧 Simulated failure switch (SystemSetting key: simulatePayoutFail)
      const sim = await prisma.systemSetting.findUnique({
        where: { key: "simulatePayoutFail" },
      });
      if (sim?.value === "true") {
        throw new Error("SIMULATED_PAYOUT_FAILURE");
      }

      console.log(
        `Processing auto-payout for ${user.email ?? user.id} — $${totalAmount.toFixed(2)}`
      );

      // Transaction: create payout, mark commissions as PAID, log
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.payout.create({
          data: {
            userId: user.id,
            amount: totalAmount,

            // Legacy required fields
            method: "PAYPAL",
            status: "PAID",

            // New fields
            provider: "PAYPAL" as any,
            statusEnum: "PAID" as any,
            paidAt: new Date(),

            externalPayoutId: null,
            paypalBatchId: null,
            transactionId: null,
            receiverEmail: user.email ?? null,
          } as any,
        });

        await tx.commission.updateMany({
          where: { id: { in: approved.map((c) => c.id) } },
          data: { status: "PAID" as any, paidOut: true },
        });

        await tx.eventLog.create({
          data: {
            type: "payout",
            message: `Auto-payout: ${approved.length} commission(s) paid for ${
              user.email ?? user.id
            } — total $${totalAmount.toFixed(2)} (ids: ${approved
              .map((c) => c.id)
              .join(", ")})`,
          },
        });
      });

      try {
        await sendPayoutAlert(String(user.email ?? user.id), totalAmount);
      } catch {
        /* non-blocking */
      }
    } catch (e: any) {
      // ✅ Failure path: commissions remain APPROVED, log the error
      await prisma.eventLog.create({
        data: {
          type: "error",
          message: `Auto-payout failed for ${
            user.email ?? user.id
          }: ${e?.message ?? String(e)}`,
        },
      });
      console.error("Auto-payout failed:", e);
    }
  }

  console.log("🏁 Auto payout engine finished.");
}

export default runAutoPayoutEngine;
