// scripts/verify-and-fix-ph-market.ts
// Purpose: show current market for Lazada/Shopee, force-update to PH, then show again.
// Run with the *same DATABASE_URL* your production app uses.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function maskDbUrl(url?: string) {
  if (!url) return "unset";
  try {
    const u = new URL(url);
    const host = u.host;
    const db = u.pathname.replace("/", "");
    return `${u.protocol}//***:***@${host}/${db}`;
  } catch {
    return "invalid";
  }
}

async function logRows(label: string) {
  const rows = await prisma.merchantRule.findMany({
    where: {
      OR: [
        { domainPattern: { in: ["lazada.com.ph", "shopee.ph"] } },
        { merchantName: { in: ["Lazada PH", "Shopee PH"] } },
      ],
    },
    select: {
      id: true,
      merchantName: true,
      domainPattern: true,
      market: true,
      notes: true,
      active: true,
      updatedAt: true,
    },
    orderBy: [{ merchantName: "asc" }],
  });
  console.log(`\n=== ${label} (${rows.length}) ===`);
  console.table(rows);
  return rows;
}

async function main() {
  console.log("DATABASE_URL:", maskDbUrl(process.env.DATABASE_URL));

  await logRows("BEFORE");

  // Force both to PH by id (more reliable than updateMany filters)
  const targets = await prisma.merchantRule.findMany({
    where: {
      OR: [
        { domainPattern: { in: ["lazada.com.ph", "shopee.ph"] } },
        { merchantName: { in: ["Lazada PH", "Shopee PH"] } },
      ],
    },
    select: { id: true, merchantName: true, market: true },
  });

  for (const t of targets) {
    if (t.market !== "PH") {
      await prisma.merchantRule.update({
        where: { id: t.id },
        data: { market: "PH" },
      });
      console.log(`Updated ${t.merchantName} -> market=PH`);
    } else {
      console.log(`No change: ${t.merchantName} already PH`);
    }
  }

  await logRows("AFTER");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
