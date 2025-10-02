import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Show BEFORE
  const before = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Lazada" } },
    select: { id: true, merchantName: true, domainPattern: true, market: true, notes: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== BEFORE ===");
  console.table(before);

  // Delete any Lazada rows explicitly tagged US
  const toDelete = await prisma.merchantRule.findMany({
    where: {
      merchantName: { contains: "Lazada" },
      market: "US",
    },
    select: { id: true, merchantName: true, domainPattern: true, market: true },
  });

  for (const row of toDelete) {
    const del = await prisma.merchantRule.delete({ where: { id: row.id } });
    console.log("Deleted:", { id: del.id, merchantName: del.merchantName, market: (del as any).market });
  }

  // Show AFTER
  const after = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Lazada" } },
    select: { id: true, merchantName: true, domainPattern: true, market: true, notes: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== AFTER ===");
  console.table(after);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
