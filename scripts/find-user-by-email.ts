import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const q = (process.argv[2] ?? "").trim();
  if (!q) {
    console.error('Usage: npx ts-node scripts/find-user-by-email.ts "email-fragment-or-full"');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    select: { id: true, email: true, createdAt: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  if (users.length === 0) {
    console.log("No users matched.");
  } else {
    console.table(users);
  }
}

main().finally(async () => { await prisma.$disconnect(); });
