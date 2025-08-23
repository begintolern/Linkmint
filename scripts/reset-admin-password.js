// scripts/reset-admin-password.js
// Usage:
//   node scripts/reset-admin-password.js --email=admin@linkmint.co --password="NewSecurePassword123!"
//   node scripts/reset-admin-password.js --id=clxxxxx... --password="NewPass!23"
//   node scripts/reset-admin-password.js --email=admin@linkmint.co   (auto-generates password)

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = new PrismaClient();

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((arg) => arg.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function genPassword(len = 16) {
  const raw = crypto.randomBytes(len).toString("base64url");
  const symbols = "!@#$%^&*()-_=+[]{}";
  return (
    raw.slice(0, len - 2) +
    symbols[Math.floor(Math.random() * symbols.length)] +
    symbols[Math.floor(Math.random() * symbols.length)]
  );
}

(async () => {
  const email = parseArg("email");
  const id = parseArg("id");
  let newPassword = parseArg("password");

  if (!email && !id) {
    console.error("ERROR: Provide either --email=<email> or --id=<userId>");
    process.exit(1);
  }

  if (!newPassword) {
    newPassword = genPassword(18);
    console.log("No --password provided. Generated a strong password:");
    console.log("NEW PASSWORD:", newPassword);
  }

  const user = await prisma.user.findFirst({
    where: {
      ...(email ? { email } : {}),
      ...(id ? { id } : {}),
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error("ERROR: ADMIN user not found with the given identifier.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  console.log("SUCCESS: ADMIN password updated.");
  console.log(`Admin ID: ${user.id}`);
  console.log(`Admin Email: ${user.email}`);
  console.log(`Login Password: ${newPassword}`);
})()
  .catch((e) => {
    console.error("Unexpected error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
