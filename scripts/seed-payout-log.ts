// scripts/seed-payout-log.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const userId = "cmfbyhwog0000qi42l55ut0wi"; // your admin user
  const amount = 4.55;
  await prisma.payoutLog.create({
    data: {
      userId,
      amount,
      status: "PAID",
      note: "Manual test payout for commission cmfexnhhi0001oi5s3hp0yaul",
    },
  });
  console.log("✅ Inserted payout log");
}

main().finally(() => prisma.$disconnect());
