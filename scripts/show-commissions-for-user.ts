import { PrismaClient } from "@prisma/client";

function mask(url?: string) {
  if (!url) return "DATABASE_URL not set";
  try {
    const u = new URL(url);
    return `${u.protocol}//***:***@${u.hostname}:${u.port}${u.pathname}${u.search ?? ""}`;
  } catch {
    return "Invalid DATABASE_URL";
  }
}

async function main() {
  const userId = (process.argv[2] ?? "").trim();
  const dbUrl  = (process.argv[3] ?? process.env.DATABASE_URL ?? "").trim();

  if (!userId) {
    console.error('Usage: npx ts-node scripts/show-commissions-for-user.ts "USER_ID" "POSTGRES_URL"');
    process.exit(1);
  }
  if (!dbUrl) {
    console.error("Please provide the Postgres URL as the 2nd argument or set DATABASE_URL.");
    process.exit(1);
  }

  console.log("DB:", mask(dbUrl));

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Commission" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
      userId
    );

    if (rows.length === 0) {
      console.log("No commissions found for this user.");
      return;
    }

    console.log("Columns:", Object.keys(rows[0]));
    const compact = rows.map((r) => ({
      id: r.id ?? null,
      status: r.status ?? null,
      amount: r.amount ?? null,
      createdAt: r.createdAt ?? null,
      merchantLike: r.merchant ?? r.merchantId ?? r.merchantRuleId ?? null,
    }));
    console.table(compact);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
