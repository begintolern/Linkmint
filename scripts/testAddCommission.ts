// scripts/testAddCommission.ts
import { prisma } from "@/lib/db";

async function main() {
  const email = "seeduser@test.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  // Add a test payout/commission record
  const payout = await prisma.payout.create({
    data: {
      userId: user.id,
      amount: 4.55,
      status: "Pending", // or "pending" depending on your enum/string
      source: "TEST_AMAZON", // optional field if exists
    } as any,
  });

  console.log("Created test payout:", payout.id, payout.amount, payout.status);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("testAddCommission failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
