// lib/engines/autoPayoutEngine.ts
import { prisma } from "@/lib/db";

/**
 * Auto Payout Engine
 * - Finds users with APPROVED, unpaid commissions (by status)
 * - Sums them up
 * - Creates a payout
 * - Marks those commissions as Paid
 *
 * If your Commission.status is an enum with different casing, adjust the strings below.
 */
export async function autoPayoutEngine() {
  // Pull distinct users who have at least one APPROVED commission
  const usersWithApproved = await prisma.commission.findMany({
    where: {
      status: "Approved" as any, // adjust casing if your enum differs
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (usersWithApproved.length === 0) {
    return { success: true, processed: 0 };
  }

  let processed = 0;

  for (const { userId } of usersWithApproved) {
    // Get the list we’re going to aggregate & pay out
    const approvedCommissions = await prisma.commission.findMany({
      where: {
        userId,
        status: "Approved" as any,
      },
      select: {
        id: true,
        amount: true, // Prisma.Decimal | number
      },
    });

    if (!approvedCommissions.length) continue;

    // Typed reducer (handles Prisma.Decimal or number)
    const totalAmount = approvedCommissions.reduce((sum: number, c: any) => {
      const amt =
        typeof c?.amount?.toNumber === "function"
          ? c.amount.toNumber()
          : Number(c?.amount ?? 0);
      return sum + amt;
    }, 0);

    if (totalAmount <= 0) continue;

    // Do the payout + mark commissions Paid in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the payout record
      await tx.payout.create({
        data: {
          userId,
          amount: totalAmount,
          status: "Approved" as any, // or "Pending" depending on your payout flow
          source: "AUTO_PAYOUT",
        } as any,
      });

      // Mark all those commissions as Paid
      const commissionIds = approvedCommissions.map((c) => c.id);
      await tx.commission.updateMany({
        where: { id: { in: commissionIds } },
        data: { status: "Paid" as any },
      });
    });

    processed += 1;
  }

  return { success: true, processed };
}

export default autoPayoutEngine;
