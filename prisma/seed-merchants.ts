// prisma/seed-merchants.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.merchantRule.createMany({
    data: [
      {
        active: true,
        merchantName: "PeopleFinders",
        network: "CJ",
        status: "ACTIVE",                 // matches your String status
        domainPattern: "peoplefinders.com",
        commissionType: "PERCENT",        // CommissionCalc enum value
        commissionRate: 0.65,             // Decimal? → number is fine
        cookieWindowDays: 45,
        notes: "65% revenue share per sale; 45-day cookie.",
        allowedSources: [
          "Content blogs",
          "Text links",
          "Banner ads (desktop & mobile)",
          "CJ banners/links",
        ],
        disallowed: [],
      },
      {
        active: true,
        merchantName: "Revival Animal Health",
        network: "CJ",
        status: "ACTIVE",
        domainPattern: "revivalanimal.com",
        commissionType: "PERCENT",
        commissionRate: 0.10,
        cookieWindowDays: 30,
        payoutDelayDays: 0,
        notes:
          "Pet health products; ~1,500 products; AOV ~$110. Monthly newsletter.",
        allowedSources: [
          "Content blogs",
          "Text links",
          "Banner ads (desktop & mobile)",
          "Product datafeed",
        ],
        disallowed: [
          "No trademark or domain bidding",
          "No brand/domain in paid-search display URLs",
        ],
      },
      {
        active: true,
        merchantName: "UNice",
        network: "CJ",
        status: "PENDING",
        domainPattern: "unice.com",
        commissionType: "PERCENT",
        commissionRate: 0.12,
        cookieWindowDays: 30,
        notes: "Pending approval. Hair products and wigs.",
        allowedSources: [],
        disallowed: [],
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
