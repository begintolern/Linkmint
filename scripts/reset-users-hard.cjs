// scripts/reset-users-hard.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function safeDelete(modelCall, label) {
  if (!modelCall) return;
  try {
    const res = await modelCall;
    const count = typeof res?.count === "number" ? res.count : "ok";
    console.log(`- ${label}: ${count}`);
  } catch (e) {
    console.log(`- ${label}: skipped (${e.code || e.message || e})`);
  }
}

(async () => {
  try {
    console.log("Dropping soft-delete trigger…");
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS user_soft_delete ON "User";`);

    console.log("Deleting dependent rows… (order matters)");
    await safeDelete(prisma.verificationToken?.deleteMany?.({}), "verificationToken");
    await safeDelete(prisma.passwordResetToken?.deleteMany?.({}), "passwordResetToken");

    await safeDelete(prisma.payoutLog?.deleteMany?.({}), "payoutLog");
    await safeDelete(prisma.payout?.deleteMany?.({}), "payout");
    await safeDelete(prisma.payoutAccount?.deleteMany?.({}), "payoutAccount");

    await safeDelete(prisma.commissionsFromInvites?.deleteMany?.({}), "commissionsFromInvites");
    await safeDelete(prisma.overrideEarnings?.deleteMany?.({}), "overrideEarnings");
    await safeDelete(prisma.commission?.deleteMany?.({}), "commission");

    await safeDelete(prisma.referralBatch?.deleteMany?.({}), "referralBatch");
    await safeDelete(prisma.referral?.deleteMany?.({}), "referral");
    await safeDelete(prisma.referralGroup?.deleteMany?.({}), "referralGroup");

    await safeDelete(prisma.eventLog?.deleteMany?.({}), "eventLog");

    console.log("Hard-deleting all users…");
    const delUsers = await prisma.user.deleteMany({});
    console.log(`✅ Hard-deleted ${delUsers.count} users.`);

    console.log("Recreating soft-delete trigger…");
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION soft_delete_user()
      RETURNS trigger AS $$
      BEGIN
        UPDATE "User" SET "deletedAt" = NOW() WHERE id = OLD.id;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER user_soft_delete
      BEFORE DELETE ON "User"
      FOR EACH ROW EXECUTE FUNCTION soft_delete_user();
    `);

    const remaining = await prisma.user.count();
    console.log(`Remaining users: ${remaining}`);
  } catch (e) {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
