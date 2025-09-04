// scripts/seed-test-payout.ts
import { prisma } from "@/lib/db";
import { PayoutStatus, PayoutProvider } from "@prisma/client";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "ertorig3@gmail.com" },
    select: { id: true, email: true },
  });
  if (!user) throw new Error("User not found");

  const payout = await prisma.payout.create({
    data: {
      amount: 12.34,
      status: PayoutStatus.PENDING,   // or "PENDING"
      method: PayoutProvider.PAYPAL,  // or "PAYPAL"
      userId: user.id,
    },
  });

  console.log("Created payout:", payout);
}

main().finally(() => prisma.$disconnect());
