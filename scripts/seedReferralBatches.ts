// scripts/seedReferralBatches.ts
import { prisma } from "@/lib/db";

type SeedUser = { email: string | null };
type SeedGroup = { id: string; users: SeedUser[] };

async function seedReferralBatches() {
  console.log("🌱 Starting referral batch seeding...");

  const groups: SeedGroup[] = await prisma.referralGroup.findMany({
    include: {
      users: {
        select: { email: true },
      },
    },
  });

  for (const group of groups) {
    console.log(
      "Group ID:",
      group.id,
      "users:",
      group.users.map((u: SeedUser) => u.email)
    );
  }

  console.log("✅ Referral batch seeding complete.");
}

seedReferralBatches()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
