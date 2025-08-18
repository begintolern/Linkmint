// scripts/seed-verification-token.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const [email, token] = process.argv.slice(2);
  if (!email || !token) {
    console.error("Usage: npx ts-node scripts/seed-verification-token.ts <email> <token>");
    process.exit(1);
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  console.log("Seeded VerificationToken for", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
