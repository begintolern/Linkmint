// scripts/normalize-shopee-ph.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Show BEFORE
  const before = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Shopee" } },
    select: {
      id: true, merchantName: true, domainPattern: true,
      market: true, notes: true, createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== BEFORE ===");
  console.table(before);

  // Normalize: set market to PH; set domainPattern to 'shopee.ph' if missing
  const targets = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Shopee" } },
    select: { id: true, merchantName: true, domainPattern: true, market: true },
  });

  for (const t of targets) {
    const newData: any = {};
    if (t.market !== "PH") newData.market = "PH";
    if (!t.domainPattern) newData.domainPattern = "shopee.ph";

    if (Object.keys(newData).length) {
      await prisma.merchantRule.update({ where: { id: t.id }, data: newData });
      console.log(`Updated ${t.merchantName} ->`, newData);
    } else {
      console.log(`No change: ${t.merchantName}`);
    }
  }

  // Show AFTER
  const after = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Shopee" } },
    select: {
      id: true, merchantName: true, domainPattern: true,
      market: true, notes: true, createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== AFTER ===");
  console.table(after);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
