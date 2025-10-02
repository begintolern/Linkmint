import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Lazada" } },
    select: {
      id: true,
      merchantName: true,
      domainPattern: true,
      market: true,
      notes: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== LAZADA ROWS ===");
  console.table(rows);
}

main().catch(console.error).finally(() => prisma.$disconnect());
