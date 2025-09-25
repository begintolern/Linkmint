// scripts/seed-invitee-commission.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Seeds a test commission for a given invitee.
 * Usage:
 *   ts-node scripts/seed-invitee-commission.ts --email someone@example.com --amount 4.55
 */
async function main() {
  const email = arg("--email");
  const amountStr = arg("--amount");
  if (!email || !amountStr) {
    throw new Error("Usage: seed-invitee-commission.ts --email <email> --amount <number>");
  }

  const amount = Number(amountStr);
  if (!isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const commission = await prisma.commission.create({
    data: {
      userId: user.id,
      amount,
      type: "referral_purchase",  // plain string instead of CommissionType
      status: "PENDING",          // plain string instead of CommissionStatus
      description: "Seed invitee commission",
      source: "seed",
    },
    select: { id: true, amount: true, status: true, type: true, createdAt: true },
  });

  console.log("✅ Seeded commission for invitee:", user.email, commission);
}

function arg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
