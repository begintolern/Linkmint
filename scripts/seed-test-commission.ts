// scripts/seed-test-commission.ts
import { PrismaClient, CommissionStatus, CommissionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "ertorig3@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const commission = await prisma.commission.create({
    data: {
      userId: user.id,
      amount: 4.55,
      type: CommissionType.referral_purchase,
      status: CommissionStatus.PENDING,
      description: "Test commission",
      source: "manual-seed",
      paidOut: false,
    },
    select: { id: true, amount: true, status: true, userId: true, createdAt: true },
  });

  console.log("✅ Created test commission:", commission);
}

main()
  .catch((e) => {
    console.error("Error seeding commission:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
