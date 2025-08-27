// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "testuser@example.com";

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: null,
      role: "ADMIN",            // so you can access admin pages
      trustScore: 80,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true },
  });

  // Create a few approved, unpaid commissions (available to cash out)
  const rows = [
    { amount: 3.50, type: "referral_purchase" as const, status: "approved" },
    { amount: 4.25, type: "referral_purchase" as const, status: "approved" },
    { amount: 2.00, type: "referral_purchase" as const, status: "pending"  }, // not counted yet
  ];

  // Insert only if there are no approved+unpaid commissions yet
  const existing = await prisma.commission.count({
    where: { userId: user.id, status: "approved", paidOut: false },
  });

  if (existing === 0) {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.commission.create({
          data: {
            userId: user.id,
            amount: r.amount,
            type: r.type,
            status: r.status,
            paidOut: false,
            description: "Seed commission",
            source: "seed",
          },
        })
      )
    );
  }

  console.log("Seeded commissions for:", user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
