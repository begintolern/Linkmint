// scripts/test-payouts.ts
import { prisma } from "@/lib/db";

async function main() {
  const logs = await prisma.payoutLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, amount: true, status: true, createdAt: true },
  });
  console.log("Recent payout logs:", logs);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
