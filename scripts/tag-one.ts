// scripts/tag-one.ts
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function mergeTags(
  notes: string | null,
  updates: { categories?: string[]; brands?: string[]; keywords?: string[] }
) {
  const base = notes ?? "";
  const lines = base.split("\n").map((l) => l.trim());
  const idx = {
    categories: lines.findIndex((l) =>
      l.toLowerCase().startsWith("categories=[")
    ),
    brands: lines.findIndex((l) =>
      l.toLowerCase().startsWith("brands=[")
    ),
    keywords: lines.findIndex((l) =>
      l.toLowerCase().startsWith("keywords=[")
    ),
  };
  const up = (k: "categories" | "brands" | "keywords", vals?: string[]) => {
    if (!vals || !vals.length) return;
    const line = `${k}=[${vals
      .map((v) => v.toLowerCase().trim())
      .filter(Boolean)
      .join(", ")}]`;
    if (idx[k] >= 0) lines[idx[k]] = line;
    else lines.push(line);
  };
  up("categories", updates.categories);
  up("brands", updates.brands);
  up("keywords", updates.keywords);
  return lines.filter(Boolean).join("\n");
}

async function main() {
  // ✅ Adjust this needle if needed (exact merchantName/domain from DB)
  const needle = "hotels.com";

  const m = await prisma.merchantRule.findFirst({
    where: {
      OR: [
        { merchantName: { contains: needle, mode: "insensitive" } },
        { domainPattern: { contains: needle, mode: "insensitive" } },
      ],
    },
  });

  if (!m) {
    console.log("⚠️  Not found by name/domain containing:", needle);
    const all = await prisma.merchantRule.findMany({
      select: { id: true, merchantName: true, domainPattern: true },
    });
    console.log("Here are some merchants to check:", all.slice(0, 20));
    return;
  }

  const notes = mergeTags(m.notes ?? "", {
    categories: ["travel"],
    brands: ["hotels.com"],
    keywords: ["hotels", "accommodation", "stays"],
  });

  await prisma.merchantRule.update({
    where: { id: m.id },
    data: { notes },
  });

  console.log(
    `✅ Tagged: ${m.merchantName} (${m.domainPattern ?? "no-domain"}) as Travel`
  );
}

main().finally(() => prisma.$disconnect());
