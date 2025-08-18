// scripts/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "founder@example.com";
  const password = "Passw0rd!"; // change later in UI if you want
  const referralCode = "FOUND1"; // must be unique per your schema

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      // keep verified + code if re-running
      emailVerified: true,
      emailVerifiedAt: new Date(),
      referralCode,
      role: "ADMIN",
    },
    create: {
      email,
      name: "Founder",
      password: passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      referralCode,
      role: "ADMIN",
      trustScore: 10,
    },
  });

  console.log("Seeded founder/admin:", { id: user.id, email: user.email, referralCode: user.referralCode });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
