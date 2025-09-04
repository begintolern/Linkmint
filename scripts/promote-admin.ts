// scripts/promote-admin.ts
import { prisma } from "@/lib/db";

function randCode(n = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  // minimal safe defaults for fields that might be required/unique
  const referralCode = `r-${randCode(10)}`;

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      role: "ADMIN",
      trustScore: 0,
      referralCode, // if optional, it’s fine; if required/unique, we set it
      // add any other required fields here if your schema demands them
      // ageConfirmed: false,
    },
    select: { id: true, email: true, role: true, referralCode: true, trustScore: true },
  });

  console.log("Upserted user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
