// scripts/dedupe-shopee.ts
import { prisma } from "@/lib/db";

async function main() {
  console.log("🔍 Looking for duplicate Shopee conversions...");

  // Find all conversions from Shopee
  const rows = await prisma.conversion.findMany({
    where: { source: "shopee" },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderId: true, createdAt: true },
  });

  // Group by orderId
  const byOrder: Record<string, { id: string; createdAt: Date }[]> = {};
  for (const row of rows) {
    if (!row.orderId) continue;
    if (!byOrder[row.orderId]) byOrder[row.orderId] = [];
    byOrder[row.orderId].push(row);
  }

  // Delete duplicates (keep the first)
  let deleteCount = 0;
  for (const orderId of Object.keys(byOrder)) {
    const group = byOrder[orderId];
    if (group.length > 1) {
      const deleteIds = group.slice(1).map((r: { id: string }) => r.id);
      await prisma.conversion.deleteMany({ where: { id: { in: deleteIds } } });
      deleteCount += deleteIds.length;
      console.log(`🗑️ Removed ${deleteIds.length} duplicates for orderId=${orderId}`);
    }
  }

  console.log(`✅ Done. Removed ${deleteCount} duplicates total.`);
}

main()
  .catch((e) => {
    console.error("❌ Error in dedupe-shopee:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
