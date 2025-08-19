// scripts/forceDeleteUser.ts
import { prisma } from "@/lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: ts-node scripts/forceDeleteUser.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    // Delete dependent/related data — adjust relations as needed for your schema
    await tx.overrideCommission.deleteMany({ where: { referrerId: user.id } });
    await tx.overrideCommission.deleteMany({ where: { inviteeId: user.id } });
    await tx.commission.deleteMany({ where: { userId: user.id } });
    await tx.payout.deleteMany({ where: { userId: user.id } });
    await tx.eventLog.deleteMany({ where: { userId: user.id } });
    await tx.verificationToken.deleteMany({ where: { userId: user.id } }).catch(() => {});

    // Finally, delete the user
    await tx.user.delete({ where: { id: user.id } });
  });

  console.log(`Deleted user ${user.email} (${user.id}) and related data.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
