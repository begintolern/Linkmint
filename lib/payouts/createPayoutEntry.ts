// lib/payouts/createPayoutEntry.ts
import { prisma } from "@/lib/db";

export async function createPayoutEntry(userId: string, amount: number) {
  const payout = await prisma.payout.create({
    data: {
      userId,
      amount,
      status: "Pending",
      method: "PayPal", // ✅ default test method
    },
  });

  console.log("✅ Payout entry created:", payout.id);
  return payout;
}
