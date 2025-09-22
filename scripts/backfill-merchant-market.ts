import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const before = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*)::bigint AS cnt FROM "MerchantRule" WHERE "market" IS NULL OR "market" = '';
  `;
  console.log("Rows needing backfill (before):", before[0]?.cnt?.toString?.() ?? before[0]?.cnt);

  // Backfill NULL/empty to 'US'
  await prisma.$executeRawUnsafe(`
    UPDATE "MerchantRule" SET "market" = 'US'
    WHERE "market" IS NULL OR "market" = '';
  `);

  const after = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*)::bigint AS cnt FROM "MerchantRule" WHERE "market" IS NULL OR "market" = '';
  `;
  console.log("Rows needing backfill (after):", after[0]?.cnt?.toString?.() ?? after[0]?.cnt);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
