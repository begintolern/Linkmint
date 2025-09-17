// scripts/grant-bonus.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "ertorig3@gmail.com"; // change if needed
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      bonusCents: 500, // $5.00
      bonusEligibleUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      bonusTier: 1,
    },
  });

  console.log("Bonus granted:", {
    id: updated.id,
    email: updated.email,
    bonusCents: updated.bonusCents,
    bonusTier: updated.bonusTier,
    bonusEligibleUntil: updated.bonusEligibleUntil,
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
