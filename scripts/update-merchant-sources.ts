// scripts/update-merchant-sources.ts
// Usage:
//   npx tsx scripts/update-merchant-sources.ts write
//   npx tsx scripts/update-merchant-sources.ts clear
//
// Set MERCHANT_NAME below to the merchant you want to update.

import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

// TODO: change this to an existing merchant name in your DB (e.g., "Amazon")
const MERCHANT_NAME = "TEST_MERCHANT_SOURCES";

// Example values for the "write" action — adjust as needed
const NEW_ALLOWED = ["TIKTOK", "REDDIT"];
const NEW_DISALLOWED = ["FACEBOOK"];

const mode = (process.argv[2] ?? "write").toLowerCase(); // 'write' or 'clear'

async function main() {
  const m = await prisma.merchantRule.findFirst({
    where: { merchantName: MERCHANT_NAME },
    select: { id: true, merchantName: true, allowedSources: true, disallowed: true },
  });

  if (!m) {
    console.error(`Merchant not found: ${MERCHANT_NAME}`);
    process.exit(1);
  }

  if (mode === "write") {
    await prisma.merchantRule.update({
      where: { id: m.id },
      data: {
        allowedSources: NEW_ALLOWED,
        disallowed: NEW_DISALLOWED,
      },
    });
    console.log(
      `WROTE allowedSources=${JSON.stringify(NEW_ALLOWED)} disallowed=${JSON.stringify(
        NEW_DISALLOWED
      )} for ${m.merchantName} (${m.id})`
    );
  } else if (mode === "clear") {
    await prisma.merchantRule.update({
      where: { id: m.id },
      data: {
        allowedSources: Prisma.DbNull, // set JSON to NULL
        disallowed: Prisma.DbNull,     // set JSON to NULL
      },
    });
    console.log(`CLEARED allowedSources & disallowed for ${m.merchantName} (${m.id})`);
  } else {
    console.error(`Unknown mode: ${mode}. Use "write" or "clear".`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
