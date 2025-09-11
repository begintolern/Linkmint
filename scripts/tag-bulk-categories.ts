// scripts/tag-bulk-categories.ts
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function mergeTags(notes: string | null, updates: {
  categories?: string[], brands?: string[], keywords?: string[]
}) {
  const base = notes ?? "";
  const lines = base.split("\n").map(l => l.trim());
  const idx = {
    categories: lines.findIndex(l => l.toLowerCase().startsWith("categories=[")),
    brands:     lines.findIndex(l => l.toLowerCase().startsWith("brands=[")),
    keywords:   lines.findIndex(l => l.toLowerCase().startsWith("keywords=[")),
  };
  const up = (k: "categories"|"brands"|"keywords", vals?: string[]) => {
    if (!vals) return;
    const cleaned = vals.map(v => v.toLowerCase().trim()).filter(Boolean);
    const line = `${k}=[${cleaned.join(", ")}]`;
    if (idx[k] >= 0) lines[idx[k]] = line; else lines.push(line);
  };
  up("categories", updates.categories);
  up("brands", updates.brands);
  up("keywords", updates.keywords);
  return lines.filter(Boolean).join("\n");
}

async function tagByNeedle(needle: string, updates: {
  categories?: string[], brands?: string[], keywords?: string[]
}) {
  const m = await prisma.merchantRule.findFirst({
    where: {
      OR: [
        { merchantName:  { contains: needle, mode: "insensitive" } },
        { domainPattern: { contains: needle, mode: "insensitive" } },
      ],
    },
  });
  if (!m) { console.log("⚠️ Not found:", needle); return; }
  const notes = mergeTags(m.notes ?? "", updates);
  await prisma.merchantRule.update({ where: { id: m.id }, data: { notes } });
  console.log(`✅ Tagged ${m.merchantName} → categories=[${updates.categories?.join(", ") || ""}]`);
}

async function main() {
  // Travel (already started)
  await tagByNeedle("expedia",   { categories: ["travel"], brands: ["expedia"],   keywords: ["flights","hotels","vacation"] });
  await tagByNeedle("hotels",    { categories: ["travel"], brands: ["hotels.com"], keywords: ["hotels","accommodation","stays"] });
  await tagByNeedle("vrbo",      { categories: ["travel"], brands: ["vrbo"],      keywords: ["vacation rental","travel"] });

  // Beauty / Accessories
  await tagByNeedle("unice",     { categories: ["beauty","accessories"], brands: ["unice"], keywords: ["wigs","human hair","lace front","bundles"] });

  // Pets
  await tagByNeedle("revival",   { categories: ["pets"], brands: ["revival"], keywords: ["pet","animal health","veterinary","pet supplies"] });

  // Electronics (or Auto — choose one; using Electronics per your chips)
  await tagByNeedle("oedro",     { categories: ["electronics"], brands: ["oedro"], keywords: ["auto parts","truck accessories","floor mats"] });

  // Software
  await tagByNeedle("nordvpn",   { categories: ["software"], brands: ["nordvpn"], keywords: ["vpn","security","privacy"] });
  await tagByNeedle("iolo",      { categories: ["software"], brands: ["iolo"],    keywords: ["system mechanic","pc optimization"] });

  // Broad retail (if desired on all 4 retail chips)
  await tagByNeedle("amazon",    { categories: ["apparel","shoes","beauty","accessories"], brands: ["amazon"], keywords: ["clothing","sneakers","makeup","bags"] });

  // Leave PeopleFinders untagged (search-only)
  await tagByNeedle("peoplefinders", { categories: [], brands: ["peoplefinders"], keywords: ["background check","public records","reverse phone"] });
}

main().finally(() => prisma.$disconnect());
