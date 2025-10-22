import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.clickEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      source: true,
      linkId: true,
      url: true,
      referer: true,
      ip: true,
      userAgent: true,
    },
  });

  if (!rows.length) {
    console.log("No ClickEvent rows found.");
    return;
  }

  console.log("Latest ClickEvent rows:");
  console.table(
    rows.map(r => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      source: r.source,
      linkId: r.linkId || "—",
      url: r.url || "—",
      referer: r.referer || "—",
      ip: r.ip || "—",
    }))
  );
}

main()
  .catch(e => {
    console.error("ERROR:", e?.message || e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
