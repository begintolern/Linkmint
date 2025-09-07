// scripts/edelete-user.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const id = process.argv[2]; // pass the user ID when running

if (!id) {
  console.error("⚠️ Usage: npx tsx scripts/edelete-user.mjs <userId>");
  process.exit(1);
}

async function main() {
  try {
    await prisma.user.delete({ where: { id } });
    console.log(`✅ Deleted user ${id}`);
  } catch (err) {
    console.error(`❌ Failed to delete ${id}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
