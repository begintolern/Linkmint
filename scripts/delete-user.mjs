// scripts/delete-user.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/delete-user.mjs <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`No user found for ${email}`);
    return;
  }
  const uid = user.id;

  // Build ops only for models that exist in your client
  const ops = [];

  if (prisma.session)           ops.push(prisma.session.deleteMany({ where: { userId: uid } }));
  if (prisma.account)           ops.push(prisma.account.deleteMany({ where: { userId: uid } }));
  if (prisma.verificationToken) ops.push(prisma.verificationToken.deleteMany({ where: { identifier: email } }));
  if (prisma.payout)            ops.push(prisma.payout.deleteMany({ where: { userId: uid } }));
  if (prisma.referral) {
    ops.push(prisma.referral.deleteMany({ where: { referrerId: uid } }));
    ops.push(prisma.referral.deleteMany({ where: { refereeId: uid } }));
  }
  if (prisma.commission)        ops.push(prisma.commission.deleteMany({ where: { userId: uid } }));
  // add more tables that reference userId here if your schema has them

  if (ops.length) await prisma.$transaction(ops);
  await prisma.user.delete({ where: { id: uid } });

  console.log(`Deleted user ${email} (${uid})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
