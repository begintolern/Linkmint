// scripts/check-clicks.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    // Grab the 15 most recent logs of any type
    const rows = await prisma.eventLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
