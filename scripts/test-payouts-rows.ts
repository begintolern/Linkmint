// scripts/test-payouts-rows.ts
import { prisma } from "@/lib/db";

async function main() {
  const rows = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, amount: true, status: true, createdAt: true, userId: true },
  });
  console.log("Recent payouts:", rows);
}
main().finally(() => prisma.$disconnect());
