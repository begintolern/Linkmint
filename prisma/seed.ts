// prisma/seed.ts
import { prisma } from "../lib/db";

async function main() {
  // 1) Example network account (placeholder until real creds)
  await prisma.networkAccount.upsert({
    where: { network_accountId: { network: "SHAREASALE", accountId: "LM-12345" } },
    update: { note: "placeholder dev" },
    create: {
      network: "SHAREASALE",
      accountId: "LM-12345",
      note: "placeholder dev",
    },
  });

  // 2) Seed a couple of merchant rules
  await prisma.merchantRule.createMany({
    data: [
      {
        merchantName: "Generic Merchant",
        network: "SHAREASALE",
        domainPattern: "merchant.com",
        paramKey: "afftrack",
        paramValue: "LM-12345",
        cookieWindowDays: 30,
        payoutDelayDays: 30,
        commissionType: "PERCENT",
        commissionRate: "0.08",
        importMethod: "CSV",
        notes: "CSV import until API creds approved",
      },
      {
        merchantName: "Amazon (US)",
        network: "AMAZON",
        domainPattern: "amazon.com",
        paramKey: "tag",
        paramValue: "linkmint-20", // placeholder
        cookieWindowDays: 24,
        payoutDelayDays: 35,
        commissionType: "PERCENT",
        commissionRate: "0.03",
        importMethod: "API",
        apiBaseUrl: "https://advertising-api.amazon.com",
        apiAuthType: "oauth",
        notes: "API auth to be finalized post-approval",
      },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
