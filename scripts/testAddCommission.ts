// scripts/testAddCommission.ts
import { prisma } from "@/lib/db";
import { createPayoutEntry } from "@/lib/payouts/createPayoutEntry";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "refbase@test.com" },
  });

  if (!user) {
    console.error("❌ User not found");
    return;
  }

  // Simulate commission amount
  const amount = 4.55;

  // Create payout entry
  await createPayoutEntry(user.id, amount);

  console.log(`✅ Simulated $${amount} commission and payout for ${user.email}`);
}

main().catch((\1: any) => {
  console.error("❌ Error in testAddCommission:", e);
});
