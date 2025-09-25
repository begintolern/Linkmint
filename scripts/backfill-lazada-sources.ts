// scripts/backfill-lazada-sources.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await prisma.merchantRule.updateMany({
    where: { domainPattern: "lazada.com.ph" },
    data: {
      // backfill a simple default; tweak as you like
      allowedSources: ["Content blogs", "Text links", "Banner ads"],
      // set to an array if you want disallows; leaving null is fine
      disallowed: null,
    } as any, // tolerate JSON typed field differences across schemas
  });

  console.log(`Backfilled Lazada allowedSources on ${res.count} row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
