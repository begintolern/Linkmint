// lib/engines/autoPayoutEngine.ts
import { prisma } from "@/lib/db";
import { sendPayoutAlert } from "@/lib/alerts/sendPayoutAlert";
import type { Prisma } from "@prisma/client";

export async function runAutoPayoutEngine() {
  console.log("🚀 Auto payout engine starting...");

  // Find users who have any unpaid commissions (paidOut = false)
  const eligibleUsers = await prisma.user.findMany({
    where: {
      commissions: {
        some: { paidOut: false },
      },
    },
    include: {
      commissions: {
        where: { paidOut: false }, // narrow at DB level
        select: { id: true, amount: true, status: true },
      },
    },
  });

  console.log(`Found ${eligibleUsers.length} users with unpaid commissions.`);

  for (const user of eligibleUsers) {
    // Prisma include gives us `commissions` (lowercase)
    const unpaid = user.commissions as Array<{
      id: string;
      amount: any;   // Prisma.Decimal | number
      status: string;
    }>;

    // Only pay out those that are actually "approved" (case-insensitive)
    const approvedCommissions = unpaid.filter(
      (c) => String(c.status).toLowerCase() === "approved"
    );

    if (approvedCommissions.length === 0) continue;

    // Sum amounts (Decimal-safe)
    const totalAmount = approvedCommissions.reduce((sum: number, c) => {
      const amt =
        typeof (c as any)?.amount?.toNumber === "function"
          ? (c as any).amount.toNumber()
          : Number((c as any)?.amount ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);

    if (totalAmount <= 0) continue;

    console.log(
      `Processing payout for ${user.email ?? user.id} — $${totalAmount.toFixed(2)}`
    );

    // Create payout + mark commissions as paid in a single transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payout.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          status: "approved" as any, // cast to your enum/string; adjust if your enum uses "Approved"
          source: "AUTO_PAYOUT",
        } as any,
      });

      await tx.commission.updateMany({
        where: { id: { in: approvedCommissions.map((c) => c.id) } },
        data: {
          status: "paid" as any, // cast to your enum/string; adjust if your enum uses "Paid"
          paidOut: true,
        },
      });
    });

    // Non-blocking alert (safe no-op if env not set)
    try {
      await sendPayoutAlert(String(user.email ?? user.id), totalAmount);
    } catch (e) {
      console.warn("sendPayoutAlert failed (non-blocking):", e);
    }
  }

  console.log("🏁 Auto payout engine finished.");
}

export default runAutoPayoutEngine;
