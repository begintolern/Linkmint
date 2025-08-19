// scripts/seed-verification-token.ts
import { prisma } from "@/lib/db";
import crypto from "crypto";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: ts-node scripts/seed-verification-token.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const verifyToken = crypto.randomUUID();
  const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken,
      verifyTokenExpiry,
      emailVerifiedAt: null, // reset verification
    },
  });

  console.log(`Seeded verification token for ${email}: ${verifyToken}`);
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
