// scripts/setAdmin.ts
import "dotenv/config";                // <-- ensures DATABASE_URL, etc. are loaded
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [emailArg, passArg] = process.argv.slice(2);
  if (!emailArg || !passArg) {
    console.error("Usage: npx ts-node scripts/setAdmin.ts <email> <newPassword>");
    process.exit(1);
  }

  const email = String(emailArg).trim().toLowerCase();
  const password = String(passArg);

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      name: "Admin",
      password: hash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true, role: true, emailVerifiedAt: true },
  });

  console.log("✅ Admin ready:", user);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
