import { prisma } from "@/lib/db";

const ID = "cmfbyhwog0000qi42l55ut0wi"; // <- your SmartLink id

async function main() {
  const sl = await prisma.smartLink.findUnique({
    where: { id: ID },
    select: { id: true, userId: true, merchantRuleId: true, merchantName: true, merchantDomain: true },
  });
  console.log("SmartLink:", sl);
}

main().finally(() => prisma.$disconnect());
