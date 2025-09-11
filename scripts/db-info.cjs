// scripts/db-info.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  console.log("DATABASE_URL =", process.env.DATABASE_URL || "(missing)");
  const count = await prisma.user.count();
  console.log("User count =", count);

  const sample = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("Recent users:", sample);

  await prisma.$disconnect();
})();
