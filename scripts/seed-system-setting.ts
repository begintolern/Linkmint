// scripts/seed-system-setting.ts
import { prisma } from "../lib/db";

async function main() {
  // Your schema has: model SystemSetting { key String @id; value String }
  // Seed a default: autoPayoutEnabled = "false"
  await prisma.systemSetting.upsert({
    where: { key: "autoPayoutEnabled" },
    create: { key: "autoPayoutEnabled", value: "false" },
    update: {},
  });

  console.log("✅ Seeded: autoPayoutEnabled=false");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
