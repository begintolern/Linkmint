// prisma/seed.ts
import { prisma } from "../lib/db";
import { CommissionType } from "@prisma/client";

async function main() {
  console.log("🌱 Seeding database…");

  // 1) Ensure a test user exists (use upsert to avoid unique email errors)
  const email = "testuser@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {}, // nothing to update for now
    create: {
      email,
      name: "Test User",
      role: "USER",
      trustScore: 0,
    },
  });
  console.log("✅ User ready:", user.id, user.email);

  // 2) Create a Commission that MATCHES your schema (must include `type`)
  const commission = await prisma.commission.create({
    data: {
      userId: user.id,
      amount: 45.5,
      type: CommissionType.referral_purchase, // ← REQUIRED enum per your schema
      status: "Pending",
      paidOut: false,
      source: "SEED",
      description: "Seeded commission",
    },
  });
  console.log("✅ Commission created:", commission.id);

  // 3) Create a PayoutLog using fields that EXIST on your current model
  //    (receiverEmail / amount / paypalBatchId / transactionId / note / status)
  const payoutLog = await prisma.payoutLog.create({
    data: {
      userId: user.id,
      receiverEmail: "sandbox-recipient@example.com",
      amount: 12.34,
      paypalBatchId: "SEEDBATCH123",
      transactionId: "SEEDTXN123",
      note: "This is a test payout log entry from seed.ts",
      status: "CREATED",
    },
  });
  console.log("✅ PayoutLog created:", payoutLog.id);

  console.log("🌱 Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
