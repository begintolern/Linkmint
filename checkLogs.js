import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  const count = await prisma.policyCheckLog.count();
  console.log("PolicyCheckLog rows:", count);
  await prisma.$disconnect();
})();
