// lib/payouts/autoPayoutEngine.ts
import { prisma } from "@/lib/db";
import { sendAlert } from "@/lib/telegram/sendAlert";
import type { Prisma } from "@prisma/client";

// Float limit: $1000 for early payouts
const FLOAT_LIMIT = 1000;

export async function runAutoPayoutEngine() {
  try {
    // Use `select` so TS knows the shape includes `Commissions`
    const eligibleUsers = await prisma.user.findMany({
      where: {
        Commissions: {
          some: {
            status: "Approved" as any, // match your enum/literals
            paidOut: false,
          },
        },
        // honeymoonOver: true, // ❌ your schema doesn't have this — removing
        trustScore: { gte: 80 },
      },
      select: {
        id: true,
        email: true,
        Commissions: {
          where: { status: "Approved" as any, paidOut: false },
          select: { id: true, amount: true },
        },
      },
    });

    let currentFloatUsage = await getCurrentFloatUsage();

    for (const user of eligibleUsers) {
      const approvedPayouts = user.Commissions as Array<{ id: string; amount: unknown }>;

      const totalApproved = approvedPayouts.reduce(
        (sum: number, p: { amount: unknown }) => {
          const amt =
            typeof (p as any)?.amount?.toNumber === "function"
              ? (p as any).amount.toNumber()
              : Number((p as any)?.amount ?? 0);
          return sum + amt;
        },
        0
      );

      if (totalApproved > 0 && currentFloatUsage + totalApproved <= FLOAT_LIMIT) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.payout.create({
            data: {
              userId: user.id,
              amount: totalApproved,
              status: "Paid" as any, // or "Approved"/"Pending" per your flow
            } as any,
          });

          await tx.commission.updateMany({
            where: { id: { in: approvedPayouts.map((c: { id: string }) => c.id) } }, // ✅ typed `c`
            data: { paidOut: true, status: "Paid" as any },
          });

          await tx.floatLog.create({
            data: {
              type: "payout",
              amount: totalApproved,
              note: `Auto payout to ${user.email ?? user.id}`,
            } as any,
          });
        });

        currentFloatUsage += totalApproved;

        await sendAlert(
          `✅ Auto payout sent to ${user.email ?? user.id} — $${totalApproved.toFixed(2)}`
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Auto payout engine failed:", error);
    await sendAlert(`❌ Auto payout engine failed: ${error}`);
    return { success: false, error };
  }
}

async function getCurrentFloatUsage(): Promise<number> {
  const all = await prisma.floatLog.findMany();
  return all.reduce((sum: number, log: { amount: unknown }) => {
    const amt =
      typeof (log as any)?.amount?.toNumber === "function"
        ? (log as any).amount.toNumber()
        : Number((log as any)?.amount ?? 0);
    return sum + amt;
  }, 0);
}
