// scripts/seed-invitee-commission.ts
import { prisma } from "@/lib/db";

/**
 * Usage:
 *   npx tsx scripts/seed-invitee-commission.ts <inviteeEmail> <amount> [status] [type]
 *
 * Examples:
 *   npx tsx scripts/seed-invitee-commission.ts seed1@example.com 10 pending referral_purchase
 *   npx tsx scripts/seed-invitee-commission.ts seed2@example.com 25 approved referral_purchase
 *   npx tsx scripts/seed-invitee-commission.ts seed3@example.com 40 paid referral_purchase
 */
async function main() {
  const email = process.argv[2];
  const amount = Number(process.argv[3]);
  const statusArg = (process.argv[4] || "pending").toLowerCase(); // pending|approved|paid (string)
  const typeArg = (process.argv[5] || "referral_purchase").toLowerCase(); // enum value

  if (!email || !amount) {
    console.error(
      "Usage: npx tsx scripts/seed-invitee-commission.ts <inviteeEmail> <amount> [status] [type]"
    );
    process.exit(1);
  }

  const allowedTypes = new Set(["referral_purchase", "override_bonus", "payout"]);
  if (!allowedTypes.has(typeArg)) {
    console.error(
      `Invalid type "${typeArg}". Allowed: referral_purchase, override_bonus, payout`
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error(`Invitee not found: ${email}`);
    process.exit(1);
  }

  // Note: Prisma requires the exact enum string; TS type-check may complain unless cast to any.
  const commission = await prisma.commission.create({
    data: {
      userId: user.id,
      amount,
      status: statusArg,                 // plain string field in your schema
      type: typeArg as any,              // Prisma enum expects exact string literal
    },
    select: { id: true, amount: true, status: true, type: true, userId: true, createdAt: true },
  });

  console.log("Created commission:", commission);
}

main()
  .catch((e) => {
    console.error("Failed to create commission:");
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
