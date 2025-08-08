// scripts/seedUser.ts
import { prisma } from "@/lib/db";

async function main() {
  const email = "seeduser@test.com";
  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        name: "Seed User",
        trustScore: 0,
      },
    }));

  console.log("Seeded user:", user.id, user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed user failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
