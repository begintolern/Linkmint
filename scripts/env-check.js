// scripts/env-check.js
/* Fail fast if required env vars are missing or empty */

const required = [
  // Core
  'NODE_ENV',
  'DATABASE_URL',

  // NextAuth
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',

  // App-specific (adjust to your project)
  'ADMIN_EMAIL',
  'ADMIN_KEY',

  // If you use these, keep them; if not, remove them
  'SENDGRID_API_KEY',
  'SENDGRID_FROM',
  'SENDGRID_REPLY_TO',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_ENV', // e.g. 'sandbox' or 'production'
];

const missing = [];
const empty = [];

for (const key of required) {
  const val = process.env[key];
  if (val === undefined) missing.push(key);
  else if (String(val).trim() === '') empty.push(key);
}

const fmt = (arr) => arr.map((k) => `  - ${k}`).join('\n');

if (missing.length || empty.length) {
  console.error('❌ Environment check failed.\n');

  if (missing.length) {
    console.error('Missing variables (not defined at all):');
    console.error(fmt(missing) || '  (none)');
    console.error('');
  }

  if (empty.length) {
    console.error('Empty variables (defined but blank):');
    console.error(fmt(empty) || '  (none)');
    console.error('');
  }

  console.error(
    'Tip: Set these in Railway → Service → Variables. ' +
    'If you use Shared Variables, ensure they’re inherited by this service.'
  );
  process.exit(1);
}

console.log('✅ Environment check passed. All required variables are present.');
