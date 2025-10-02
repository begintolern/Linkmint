// scripts/delete-shopee-duplicate.ts
// Deletes the extra Shopee (PH Test) merchant by ID, then verifies remaining Shopee rows.
// Run with DATABASE_URL pointing to your production DB.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ID of the duplicate row to delete (from your listing)
const DUPLICATE_ID = "cmgzncon00004mx4bd4fhspg";

async function main() {
  console.log("Target duplicate id:", DUPLICATE_ID);

  // 1) Show the target row before deletion (if exists)
  const before = await prisma.merchantRule.findUnique({
    where: { id: DUPLICATE_ID },
    select: {
      id: true,
      merchantName: true,
      domainPattern: true,
      market: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  console.log("\n=== BEFORE (target) ===");
  console.table(before ? [before] : []);

  if (!before) {
    console.log("Nothing to delete — target id not found.");
  } else {
    // 2) Delete the target
    const deleted = await prisma.merchantRule.delete({
      where: { id: DUPLICATE_ID },
    });
    console.log("\nDeleted duplicate:", {
      id: deleted.id,
      merchantName: deleted.merchantName,
      domainPattern: deleted.domainPattern,
      market: (deleted as any).market,
    });
  }

  // 3) Re-list all Shopee rows for sanity
  const remaining = await prisma.merchantRule.findMany({
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

  console.log("\n=== AFTER (remaining Shopee rows) ===");
  console.table(remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
