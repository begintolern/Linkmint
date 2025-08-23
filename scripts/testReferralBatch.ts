// scripts/testReferralBatch.ts
import { prisma } from "@/lib/db";
import { createReferralBatch } from "@/lib/referrals/createReferralBatch";

async function main() {
  const referrerEmail = "referrer@test.com";

  const referrer = await prisma.user.findUnique({
    where: { email: referrerEmail },
    select: { id: true, email: true },
  });

  if (!referrer) {
    throw new Error(`Referrer not found: ${referrerEmail}`);
  }

  const res = await createReferralBatch(referrer.id);

  if (!res.created) {
    console.log(
      "Not enough ungrouped referrals to create a batch. Available:",
      res.available
    );
    if (res.reason) console.log("Reason:", res.reason);
  } else {
    console.log("Created referral batch:", res.groupId);
    console.log("Attached users:", res.userIds.join(", "));
    console.log("Starts:", res.startedAt.toISOString());
    console.log("Expires:", res.expiresAt.toISOString());
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
