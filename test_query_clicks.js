// test_query_clicks.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Replace with your merchantId if needed
  const merchantId = "cmfbizdzp000boigksxauehag";

  const clicks = await prisma.clickEvent.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`Found ${clicks.length} ClickEvent(s) for merchant ${merchantId}:`);
  clicks.forEach(c => {
    console.log({
      id: c.id,
      createdAt: c.createdAt,
      source: c.source,
      url: c.url,
      referer: c.referer,
      ip: c.ip,
      userAgent: c.userAgent,
      meta: c.meta,
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
