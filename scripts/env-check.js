// scripts/env-check.js
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Pick .env.local if present, else .env
const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const envFile = fs.existsSync(envLocal) ? envLocal : path.join(root, ".env");

// Load env vars explicitly
import("dotenv").then(({ config }) => {
  config({ path: envFile });
  run();
});

function run() {
  const required = [
    "NODE_ENV",
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_KEY",
    "SENDGRID_API_KEY",
    "SENDGRID_FROM",
    "SENDGRID_REPLY_TO",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_ENV",
  ];

  const missing = required.filter((k) => !process.env[k] || process.env[k] === "");  
  if (missing.length) {
    console.error("\n✗ Environment check failed.\n");
    console.error("Missing variables (not defined at all):");
    for (const k of missing) console.error(" -", k);
    console.error(
      "\nTip: set these in Railway → Service → Variables. If you use Shared Variables, ensure the service inherits them."
    );
    process.exit(1);
  }

  console.log("✓ Environment check OK");
}
