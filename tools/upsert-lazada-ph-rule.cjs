// tools/upsert-lazada-ph-rule.cjs
// Upsert Lazada PH rule JSON into a safe table: merchant_rules (snake_case)

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

(async () => {
  const prisma = new PrismaClient();
  try {
    const jsonPath = path.resolve(__dirname, "..", "prisma", "merchant-lazada-ph.json");
    const text = fs.readFileSync(jsonPath, "utf8");
    const rule = JSON.parse(text);

    const merchant_key = String(rule.merchantKey || "lazada-ph");
    const display_name = String(rule.displayName || "Lazada PH (App)");
    const rules_json = JSON.stringify(rule);

    // Create an isolated table that won't conflict with any legacy schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS merchant_rules (
        merchant_key TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        rules_json   JSONB NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Upsert row
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO merchant_rules (merchant_key, display_name, rules_json, updated_at)
      VALUES ($1, $2, CAST($3 AS JSONB), NOW())
      ON CONFLICT (merchant_key)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        rules_json   = EXCLUDED.rules_json,
        updated_at   = NOW();
      `,
      merchant_key,
      display_name,
      rules_json
    );

    console.log(`[OK] Upserted merchant_rules '${merchant_key}' (${display_name}).`);
  } catch (err) {
    console.error("[FAIL] Upsert error:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
