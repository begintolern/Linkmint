// scripts/check-referral.ts
import { prisma } from "@/lib/db";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "epo78741@gmail.com" },
    select: {
      id: true,
      email: true,
      referredById: true,
      referredBy: { select: { id: true, email: true } },
    },
  });

  if (!user) {
    console.log("User not found.");
  } else {
    console.log("User:", user.email);
    console.log("ID:", user.id);
    console.log("Referred By ID:", user.referredById);
    console.log("Referred By:", user.referredBy?.email || null);
  }
}

main()
  .catch((e) => {
    console.error("Error checking referral:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
