// scripts/delete-merchant-rule.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Replace with your test merchant's ID
const MERCHANT_ID = "cmfzskkio0000oink1mn8d962";

async function main() {
  // Remove dependents first (FK restriction)
  await prisma.smartLink.deleteMany({ where: { merchantRuleId: MERCHANT_ID } });
  await prisma.commission.deleteMany({ where: { merchantRuleId: MERCHANT_ID } });

  // Now delete the merchant rule
  await prisma.merchantRule.delete({ where: { id: MERCHANT_ID } });
  console.log(`Deleted MerchantRule ${MERCHANT_ID}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
