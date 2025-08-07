import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      referralCode: true,
      referredById: true,
    },
  });

  console.log('Users:');
  users.forEach((user) => {
    console.log(`- ${user.email} | ID: ${user.id} | Code: ${user.referralCode} | Referred By: ${user.referredById}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
