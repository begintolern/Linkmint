import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.merchantRule.findMany({
    where: { merchantName: "Shopee" },
    orderBy: { createdAt: "asc" },
    select: { id: true, merchantName: true, market: true, createdAt: true },
  });

  if (!rows.length) {
    console.log("No Shopee rows found.");
    return;
  }

  console.log(`Found ${rows.length} Shopee row(s):`);
  for (const r of rows) {
    console.log(`${r.createdAt} | ${r.market} | ${r.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
