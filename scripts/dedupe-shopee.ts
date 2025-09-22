import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.merchantRule.findMany({
    where: { merchantName: "Shopee", market: "PH" },
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true },
  });

  if (rows.length <= 1) {
    console.log("Nothing to dedupe.");
    return;
  }

  const keepId = rows[0].id; // keep the oldest
  const deleteIds = rows.slice(1).map(r => r.id);

  const res = await prisma.merchantRule.deleteMany({
    where: { id: { in: deleteIds } },
  });

  console.log(`Keeping: ${keepId}`);
  console.log(`Deleted ${res.count} duplicate(s):`, deleteIds);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
