// scripts/testReferralBatch.ts
import { createReferralBatch } from "@/lib/referrals/createReferralBatch";
import { prisma } from "@/lib/db";

async function main() {
  const referrerEmail = "refbase@test.com";
  const referrer = await prisma.user.findUnique({
    where: { email: referrerEmail },
  });

  if (!referrer) {
    console.error("❌ Referrer not found");
    return;
  }

  const result = await createReferralBatch(referrer.id);

  if (result) {
    console.log("✅ Referral batch created and trustScore updated");
  } else {
    console.log("⚠️ Not enough referrals to create batch, or batch already exists");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit());
