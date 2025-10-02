// scripts/fix-market-ph.ts
// One-off: set market = 'PH' for Lazada + Shopee PH.
// Run against PRODUCTION DB (ensure DATABASE_URL points to prod).

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const targets = [
    { domainPattern: "lazada.com.ph", merchantName: "Lazada PH" },
    { domainPattern: "shopee.ph",     merchantName: "Shopee PH"  },
  ];

  for (const t of targets) {
    const res = await prisma.merchantRule.updateMany({
      where: {
        OR: [
          { domainPattern: t.domainPattern },
          { merchantName: t.merchantName },
        ],
      },
      data: { market: "PH" },
    });
    console.log(`Updated ${res.count} row(s) for ${t.merchantName}`);
  }

  // sanity check output
  const rows = await prisma.merchantRule.findMany({
    where: { domainPattern: { in: targets.map(x => x.domainPattern) } },
    select: { id: true, merchantName: true, domainPattern: true, market: true },
  });
  console.table(rows);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
