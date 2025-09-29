// scripts/create-test-smartlink.ts
import { prisma } from "@/lib/db";

async function main() {
  // Pick any existing user + merchant rule
  const user = await prisma.user.findFirst({ select: { id: true, email: true } });
  if (!user) throw new Error("No users found. Seed or create a user first.");

  const merchant = await prisma.merchantRule.findFirst({
    where: { active: true },
    select: { id: true, merchantName: true, domainPattern: true },
  });
  if (!merchant) throw new Error("No active MerchantRule found. Create one in Prisma Studio.");

  // Create a SmartLink for that user + merchant
  const sl = await prisma.smartLink.create({
    data: {
      userId: user.id,
      merchantRuleId: merchant.id,
      merchantName: merchant.merchantName,
      merchantDomain: merchant.domainPattern ?? null,
      originalUrl: `https://${merchant.domainPattern ?? "example.com"}/?utm=test`,
      shortUrl: `lm-${Date.now().toString(36)}`, // simple unique slug
      label: "TEST_WEBHOOK_LINK",
    },
    select: { id: true, userId: true, merchantRuleId: true, merchantName: true, merchantDomain: true, shortUrl: true },
  });

  console.log("Created SmartLink:", sl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
