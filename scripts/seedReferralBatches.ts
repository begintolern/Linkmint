// scripts/seedReferralBatches.ts
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

async function main() {
  // Change this to your real referrer/admin email
  const referrerEmail = "referrer@test.com";

  const inviter = await prisma.user.findUnique({
    where: { email: referrerEmail },
    select: { id: true, email: true },
  });

  if (!inviter) {
    throw new Error(`Referrer not found: ${referrerEmail}`);
  }

  // Seed three invitees (change emails as needed)
  const inviteeEmails = [
    "invitee1@test.com",
    "invitee2@test.com",
    "invitee3@test.com",
  ].map((e) => e.toLowerCase());

  // Ensure invitees exist (and are linked to referrer)
  const invitees = [];
  for (const email of inviteeEmails) {
    const existing =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: { email, name: email.split("@")[0], referredById: inviter.id },
      }));
    invitees.push(existing);
  }

  const startedAt = new Date();
  const expiresAt = addDays(startedAt, 90);

  // Create referral group and connect users
  const group = await prisma.referralGroup.create({
    data: {
      referrerId: inviter.id,
      startedAt,
      expiresAt,
      users: { connect: invitees.map((user) => ({ id: user.id })) },
    },
    include: { users: { select: { id: true, email: true } } },
  });

  console.log(
    "Seeded referral group:",
    group.id,
    "users:",
    group.users.map((u) => u.email)
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed referral batches failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
