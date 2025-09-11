import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function maskDbUrl(url?: string) {
  if (!url) return "DATABASE_URL not set";
  try {
    const u = new URL(url);
    // mask user/pass; keep host/db so we know which DB we're hitting
    return `${u.protocol}//***:***@${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return "Invalid DATABASE_URL format";
  }
}

async function main() {
  const q = (process.argv[2] ?? "").trim();
  if (!q) {
    console.error('Usage: npx ts-node scripts/check-user.ts "full-or-partial-email"');
    process.exit(1);
  }

  console.log("DB:", maskDbUrl(process.env.DATABASE_URL));

  const total = await prisma.user.count();
  console.log("Total users in this DB:", total);

  const found = await prisma.user.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true },
  });

  if (found.length === 0) {
    console.log("No users matched your query.");
  } else {
    console.table(found);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
