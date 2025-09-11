const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const rows = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'fluterby' } },
          { email: 'fluterby_yahoo.com' },
          { email: 'fluterby_25@yahoo.com' },
        ],
      },
      select: { id: true, email: true, updatedAt: true },
      take: 10,
    });
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
