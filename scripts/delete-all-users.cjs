// scripts/delete-all-users.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const deleted = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} users from the database.`);

    const remaining = await prisma.user.count();
    console.log(`Remaining users: ${remaining}`);
  } catch (err) {
    console.error("❌ Error deleting users:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
