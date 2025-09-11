// @ts-nocheck
import { PrismaClient, CommissionCalc } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.merchantRule.createMany({
    data: [
      {
        active: true,
        merchantName: "PeopleFinders",
        network: "CJ",
        domainPattern: "peoplefinders.com",
        commissionType: CommissionCalc.PERCENT,
        commissionRate: "0.65",
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
        domainPattern: "revivalanimal.com",
        commissionType: CommissionCalc.PERCENT,
        commissionRate: "0.10",
        cookieWindowDays: 30,
        payoutDelayDays: 0,
        notes: "Pet health products; ~1,500 products; AOV ~$110.",
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
        domainPattern: "unice.com",
        commissionType: CommissionCalc.PERCENT,
        commissionRate: "0.12",
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
