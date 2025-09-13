// scripts/find-merchants.ts
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const needles = ["hotels.com", "hotels", "hotel"];
  for (const needle of needles) {
    console.log(`\n=== Searching for: ${needle} ===`);
    const rows = await prisma.merchantRule.findMany({
      where: {
        OR: [
          { merchantName:  { contains: needle, mode: "insensitive" } },
          { domainPattern: { contains: needle, mode: "insensitive" } },
        ],
      },
      select: { id: true, merchantName: true, domainPattern: true },
      take: 50,
    });
    rows.forEach(r => console.log(`- ${r.merchantName}  [${r.domainPattern ?? "no-domain"}]`));
    if (rows.length === 0) console.log("(none)");
  }
}
main().finally(() => prisma.$disconnect());
