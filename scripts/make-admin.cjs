// scripts/make-admin.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const updated = await prisma.user.update({
    where: { id: "cmfbyhwog0000qi42l55ut0wi" },
    data: { role: "ADMIN" },
  });
  console.log(`✅ Promoted ${updated.email} to ADMIN`);
  await prisma.$disconnect();
})();
