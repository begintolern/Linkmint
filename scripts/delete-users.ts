// scripts/cascade-delete-users.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Deduped list of user IDs to remove
  const ids = [
    "cmf8tppxm000kqk42wpz0f6k3",
    "cmf8tmpgw000fqk42qh6axha6",
    "cmf8suepe000aqk42tcorqpoo",
    "cmf8sotii0005qk42g8g3o14x",
    "cmf7tn2vi0000oiagzutjycnh",
  ];

  // 1) Delete dependents (best-guess common tables). We call dynamically to avoid TS errors if a model doesn't exist.
  const byUser = { userId: { in: ids } };

  // Models that commonly reference userId in many apps; delete if present
  const modelsToTry = [
    "verificationToken",
    "session",
    "account",
    "commission",
    "referral",
    "invite",
    "passwordReset",
    "apiKey",
    "merchantLink",
    "emailLog",
    "loginToken",
    "userLogin",
    "profile",
  ];

  for (const m of modelsToTry) {
    const model = (prisma as any)[m];
    if (model?.deleteMany) {
      try {
        const res = await model.deleteMany({ where: byUser });
        console.log(`- ${m}.deleteMany -> count=${res.count ?? 0}`);
      } catch (err: any) {
        console.warn(`! Skipped ${m}:`, err?.message || err);
      }
    }
  }

  // 2) Finally delete the users
  const resUsers = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`✅ Users deleted: ${resUsers.count}`);

  // Done
}

main()
  .catch((e) => {
    console.error("❌ Cascade delete failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
