// scripts/seedReferralBatches.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding referral batch...");

  // Create referrer
  const referrer = await prisma.user.upsert({
    where: { email: "refbase@test.com" },
    update: {},
    create: {
      email: "refbase@test.com",
      password: await bcrypt.hash("testpass", 10),
      name: "Referrer Base",
    },
  });

  // Create 3 invited users
  const invitees = await Promise.all(
    ["invitee1@test.com", "invitee2@test.com", "invitee3@test.com"].map((email) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: "testpass",
          name: email.split("@")[0],
        },
      })
    )
  );

  // Create referral group
  const group = await prisma.referralGroup.create({
    data: {
      referrerId: referrer.id,
      users: {
        connect: invitees.map((user) => ({ id: user.id })),
      },
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  // Create referral batch
  await prisma.referralBatch.create({
    data: {
      referrerId: referrer.id,
      inviteeIds: invitees.map((u) => u.id),
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "active",
    },
  });

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
