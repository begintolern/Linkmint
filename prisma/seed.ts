import { prisma } from "@/lib/db";

async function main() {
  // Example: our ShareASale account (replace with real when approved)
  const ss = await prisma.networkAccount.upsert({
    where: { network_accountId: { network: "SHAREASALE", accountId: "LM-12345" } },
    update: {},
    create: { network: "SHAREASALE", accountId: "LM-12345", note: "placeholder dev" },
  });

  await prisma.merchantRule.createMany({
    data: [
      {
        merchantName: "Generic Merchant",
        network: "SHAREASALE",
        domainPattern: "merchant.com",
        paramKey: "afftrack",
        paramValue: ss.accountId,
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
        apiBaseUrl: "https://advertising-api.amazon.com", // example
        apiAuthType: "oauth",
        notes: "API auth to be finalized post-approval",
      },
    ],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
