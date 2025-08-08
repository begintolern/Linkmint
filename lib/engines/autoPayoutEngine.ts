// lib/engines/autoPayoutEngine.ts
import { prisma } from "@/lib/db";

/**
 * Auto Payout Engine
 * - Finds users with APPROVED commissions
 * - Sums them
 * - Creates a payout
 * - Marks those commissions as Paid
 *
 * If your Commission.status enum uses different casing (e.g., APPROVED/PAID),
 * change the strings below to match.
 */
export async function autoPayoutEngine() {
  // Users who have at least one APPROVED commission
  const usersWithApproved = await prisma.commission.findMany({
    where: { status: "Approved" as any },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (usersWithApproved.length === 0) {
    return { success: true, processed: 0 };
  }

  let processed = 0;

  for (const { userId } of usersWithApproved) {
    // Pull the APPROVED commissions for this user
    const approvedCommissions = await prisma.commission.findMany({
      where: { userId, status: "Approved" as any },
      select: { id: true, amount: true },
    });

    if (!approvedCommissions.length) continue;

    // Sum amounts (Decimal-safe)
    const totalAmount = approvedCommissions.reduce((sum: number, c: any) => {
      const amt =
        typeof c?.amount?.toNumber === "function"
          ? c.amount.toNumber()
          : Number(c?.amount ?? 0);
      return sum + amt;
    }, 0);

    if (totalAmount <= 0) continue;

    // Create payout and mark commissions Paid in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.payout.create({
        data: {
          userId,
          amount: totalAmount,
          status: "Approved" as any, // or "Pending" if your flow requires review
          source: "AUTO_PAYOUT",
        } as any,
      });

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
