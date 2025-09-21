'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // delete SmartLinks that point to test emails we created
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: 'test+' } },
    select: { id: true, email: true },
  });

  const userIds = testUsers.map(u => u.id);

  const delLinks = await prisma.smartLink.deleteMany({
    where: { userId: { in: userIds } },
  });

  // (Optional) delete MerchantRules named 'SmokeShop'
  const delMerchants = await prisma.merchantRule.deleteMany({
    where: { merchantName: 'SmokeShop' },
  });

  // finally delete the test users
  const delUsers = await prisma.user.deleteMany({
    where: { email: { contains: 'test+' } },
  });

  console.log('Deleted:', { links: delLinks.count, merchants: delMerchants.count, users: delUsers.count });
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error('Cleanup failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
