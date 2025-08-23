// scripts/verify-smoke-user.ts
import { prisma } from "../lib/db";

async function main() {
  const email = "smoke+001@test.local"; // change if you used another email

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date() },
  });

  console.log("✅ User verified:", user.email, "at", user.emailVerifiedAt);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
