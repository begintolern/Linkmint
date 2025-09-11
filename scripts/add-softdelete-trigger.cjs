const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION soft_delete_user()
      RETURNS trigger AS $$
      BEGIN
        UPDATE "User"
          SET "deletedAt" = NOW()
          WHERE id = OLD.id;
        RETURN NULL; -- cancel physical delete
      END;
      $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS user_soft_delete ON "User";`);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER user_soft_delete
      BEFORE DELETE ON "User"
      FOR EACH ROW EXECUTE FUNCTION soft_delete_user();
    `);

    console.log("✅ Soft-delete trigger installed on User table");
  } catch (e) {
    console.error("❌ Failed installing trigger:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
