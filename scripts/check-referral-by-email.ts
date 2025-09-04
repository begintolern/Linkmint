// scripts/check-referral-by-email.ts
import { prisma } from "@/lib/db";

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Usage: npx tsx scripts/check-referral-by-email.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: emailArg },
    select: {
      id: true,
      email: true,
      referredById: true,
      referredBy: { select: { id: true, email: true } },
    },
  });

  if (!user) {
    console.log("User not found:", emailArg);
    return;
  }

  console.log("User:", user.email);
  console.log("ID:", user.id);
  console.log("Referred By ID:", user.referredById);
  console.log("Referred By:", user.referredBy?.email || null);
}

main()
  .catch((e) => {
    console.error("Error checking referral:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
