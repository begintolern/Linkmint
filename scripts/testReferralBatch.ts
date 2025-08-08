// scripts/testReferralBatch.ts
import { prisma } from "@/lib/db";
import { createReferralBatch } from "@/lib/referrals/createReferralBatch";

async function main() {
  const referrerEmail = "referrer@test.com";
  const referrer = await prisma.user.findUnique({
    where: { email: referrerEmail },
    select: { id: true, email: true },
  });

  if (!referrer) throw new Error(`Referrer not found: ${referrerEmail}`);

  const group = await createReferralBatch(referrer.id);
  if (!group) {
    console.log("Not enough ungrouped referrals to create a batch.");
  } else {
    console.log("Created referral batch:", group.id);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("testReferralBatch failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
