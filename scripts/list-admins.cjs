// scripts/list-admins.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(admins);
  await prisma.$disconnect();
})();
