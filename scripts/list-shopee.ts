// scripts/list-shopee.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.merchantRule.findMany({
    where: { merchantName: { contains: "Shopee" } },
    select: {
      id: true,
      merchantName: true,
      domainPattern: true,
      market: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.table(rows);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
