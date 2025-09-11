// scripts/list-users.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(users);
  await prisma.$disconnect();
})();
