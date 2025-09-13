// scripts/tag-primary-cats.ts
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
    if (!vals || !vals.length) return;
    const line = `${k}=[${vals.map(v => v.toLowerCase().trim()).filter(Boolean).join(", ")}]`;
    if (idx[k] >= 0) lines[idx[k]] = line; else lines.push(line);
  };
  up("categories", updates.categories);
  up("brands", updates.brands);
  up("keywords", updates.keywords);
  return lines.filter(Boolean).join("\n");
}

async function tag(name: string, updates: { categories?: string[], brands?: string[], keywords?: string[] }) {
  const m = await prisma.merchantRule.findFirst({ where: { merchantName: name } });
  if (!m) { console.log(`⚠️  Not found: ${name}`); return; }
  const notes = mergeTags(m.notes ?? "", updates);
  await prisma.merchantRule.update({ where: { id: m.id }, data: { notes } });
  console.log(`✅ Tagged: ${name}`);
}

async function main() {
  // UNice → beauty + accessories
  await tag("UNice", {
    categories: ["beauty", "accessories"],
    brands: ["unice"],
    keywords: ["wigs", "human hair", "lace front", "bundles"]
  });

  // Amazon Associates → broad primary categories (shows under those chips)
  await tag("Amazon Associates", {
    categories: ["apparel", "shoes", "beauty", "accessories"],
    brands: ["amazon"],
    keywords: ["clothing", "sneakers", "makeup", "bags"]
  });

  // VRBO → do NOT tag with primary chips so it won’t appear there
  // If you want it searchable only, give keywords but no primary categories:
  await tag("VRBO", {
    categories: [], // keep empty so it doesn't show under primary chips
    brands: ["vrbo"],
    keywords: ["vacation rental", "travel", "accommodation"]
  });
}

main().finally(() => prisma.$disconnect());
