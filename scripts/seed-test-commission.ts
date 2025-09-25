// scripts/seed-test-commission.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Seed a few test commissions for a user.
 * Usage:
 *   ts-node scripts/seed-test-commission.ts --email you@example.com
 */
async function main() {
  const email = arg("--email");
  if (!email) {
    throw new Error("Usage: seed-test-commission.ts --email <email>");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const rows = [
    { amount: 3.5,  type: "referral_purchase", status: "APPROVED" },
    { amount: 4.25, type: "referral_purchase", status: "APPROVED" },
    { amount: 2.0,  type: "referral_purchase", status: "PENDING"  },
  ] as const;

  await prisma.$transaction(
    rows.map((r) =>
      prisma.commission.create({
        data: {
          userId: user.id,
          amount: r.amount,
          type: r.type,            // string (no enum)
          status: r.status,        // string (no enum)
          paidOut: false,
          description: "Seed commission",
          source: "seed",
        },
        select: { id: true },
      })
    )
  );

  console.log(`✅ Seeded ${rows.length} commissions for ${user.email}`);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
