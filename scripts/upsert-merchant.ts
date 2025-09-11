// scripts/upsert-merchant.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Usage:
 *   tsx scripts/upsert-merchant.ts [network] [pidEnv] [deepLinkBase] [sidParam] [cookieDays] [active]
 *
 * Notes:
 * - No select clauses (avoids type mismatches with your model fields).
 * - No where filters on unknown columns; we update the first rule if it exists, else create.
 * - Adjust the data keys to match your schema if needed.
 */
async function main() {
  const [
    , ,
    networkArg = "CJ",
    pidEnvArg = "CJ_PID",
    deepLinkBaseArg = "",
    sidParamArg = "sid",
    cookieDaysArg = "30",
    activeArg = "true",
  ] = process.argv;

  const cookieDays = Number(cookieDaysArg) || 30;
  const active = String(activeArg).toLowerCase() === "true";

  const existing = await prisma.merchantRule.findFirst({}); // no where filter

  // Adjust these keys to match your schema. If some keys don't exist, remove them.
  const data: any = {
    network: networkArg,
    pidEnv: pidEnvArg,
    deepLinkBase: deepLinkBaseArg || null,
    sidParam: sidParamArg || "sid",
    cookieDays,
    active,
  };

  if (existing) {
    const updated = await prisma.merchantRule.update({
      where: { id: existing.id },
      data: data as any,
    });
    console.log("✅ Updated merchant rule:", updated.id);
  } else {
    const created = await prisma.merchantRule.create({
      data: data as any,
    });
    console.log("✅ Created merchant rule:", created.id);
  }
}

main()
  .catch((e) => {
    console.error("❌ upsert-merchant failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
