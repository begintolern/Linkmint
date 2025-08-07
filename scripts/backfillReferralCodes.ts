import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const generateCode = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

async function main() {
  const users = await prisma.user.findMany({
    where: { referralCode: null },
  });

  for (const user of users) {
    const code = generateCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code },
    });
  }

  console.log(`✅ Backfilled ${users.length} referral codes.`);
}

main().finally(() => prisma.$disconnect());
