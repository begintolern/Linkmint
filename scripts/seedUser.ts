import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10);

  await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'testuser@example.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Test user seeded');
}

main()
  .then(() => process.exit(0))
  .catch((\1: any) => {
    console.error(e);
    process.exit(1);
  });
