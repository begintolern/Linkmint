import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const row = await prisma.policyCheckLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });
  console.log("LATEST_ID:", row?.id || "NONE");
  await prisma.$disconnect();
})();
