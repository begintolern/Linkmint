// scripts/prod-db-guard.cjs
// Blocks destructive Prisma commands on production (Railway) DB.

const url = process.env.DATABASE_URL || "";
const isProdRailway =
  /maglev\.proxy\.rlwy\.net/i.test(url) || /railway\?sslmode=require/i.test(url);

const cmd = (process.env.npm_lifecycle_event || "").toLowerCase();
const dangerous =
  cmd.includes("prisma:db-push") ||
  cmd.includes("prisma:reset") ||
  cmd.includes("prisma:seed");

if (isProdRailway && dangerous) {
  console.error(
    `\n❌ Blocked "${cmd}" on production DB.\n` +
      `Use "npm run prisma:migrate:deploy" for schema changes in production.\n`
  );
  process.exit(1);
}
