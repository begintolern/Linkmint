// scripts/seedReferralGroup.ts
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

async function main() {
  const referrerId = "cmdghk6aj0001wn34b317nl6z"; // refbase@test.com
  const now = new Date();
  const expiresAt = addDays(now, 90);

  const group = await prisma.referralGroup.create({
    data: {
      referrerId,
      createdAt: now,
      expiresAt,
      status: "active",
      referredUsers: {
        connect: [
          { id: "cmdghxr6m0003wn34xjoomrqp" }, // friend1@test.com
          { id: "cmdgi2ibw0005wn34sxypok5h" }, // friend2@test.com
          { id: "cmdgi3nyg0007wn34x7oz6mjt" }, // friend3@test.com
        ],
      },
    },
  });

  console.log("Referral group created:", group.id);
}

main()
  .catch((\1: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
