// scripts/update-commission.ts
import { prisma } from "@/lib/db";

/**
 * Usage:
 *   npx tsx scripts/update-commission.ts <commissionId> <status>
 * Examples:
 *   npx tsx scripts/update-commission.ts cmf4hwgls0001oi2ci1ot1rq5 approved
 *   npx tsx scripts/update-commission.ts <id> paid
 */
async function main() {
  const id = process.argv[2];
  const statusArg = (process.argv[3] || "").toLowerCase(); // pending | approved | paid

  if (!id || !statusArg) {
    console.error("Usage: npx tsx scripts/update-commission.ts <commissionId> <status>");
    process.exit(1);
  }

  const allowed = new Set(["pending", "approved", "paid"]);
  if (!allowed.has(statusArg)) {
    console.error(`Invalid status "${statusArg}". Allowed: pending, approved, paid`);
    process.exit(1);
  }

  const updated = await prisma.commission.update({
    where: { id },
    data: { status: statusArg },
    select: { id: true, amount: true, status: true, userId: true, createdAt: true },
  });

  console.log("Updated commission:", updated);
}

main()
  .catch((e) => {
    console.error("Failed to update commission:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
