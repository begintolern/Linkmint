// scripts/test-prisma.ts
import { prisma } from "@/lib/db";

async function main() {
  // find one user
  const user = await prisma.user.findFirst({
    select: { id: true, email: true, trustScore: true },
  });
  console.log("User record:", user);

  // bump trustScore by +1 for test user
  const updated = await prisma.user.update({
    where: { email: "ertorig3@gmail.com" },
    data: { trustScore: { increment: 1 } },
    select: { id: true, email: true, trustScore: true },
  });
  console.log("Updated record:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
