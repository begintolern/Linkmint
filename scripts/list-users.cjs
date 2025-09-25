// scripts/list-users.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (users.length === 0) {
      console.log("No users found.");
    } else {
      console.log("Latest 5 users:");
      for (const u of users) {
        console.log(`${u.createdAt.toISOString()}  ${u.id}  ${u.email}`);
      }
    }
  } catch (err) {
    console.error("Error listing users:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
