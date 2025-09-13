// scripts/tag-travel.ts
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
    const cleaned = (vals || []).map(v => v.toLowerCase().trim()).filter(Boolean);
    const line = `${k}=[${cleaned.join(", ")}]`;
    if (idx[k] >= 0) lines[idx[k]] = line; else lines.push(line);
  };
  up("categories", updates.categories);
  up("brands", updates.brands);
  up("keywords", updates.keywords);
  return lines.filter(Boolean).join("\n");
}

async function tagByNeedle(needle: string, updates: { categories?: string[], brands?: string[], keywords?: string[] }) {
  const m = await prisma.merchantRule.findFirst({
    where: {
      OR: [
        { merchantName: { contains: needle, mode: "insensitive" } },
        { domainPattern: { contains: needle, mode: "insensitive" } },
      ],
    },
  });
  if (!m) {
    console.log("⚠️  Not found:", needle);
    return;
  }
  const notes = mergeTags(m.notes ?? "", updates);
  await prisma.merchantRule.update({ where: { id: m.id }, data: { notes } });
  console.log(`✅ Tagged ${m.merchantName} with categories=[${updates.categories?.join(", ") || ""}]`);
}

async function main() {
  // VRBO → travel only (keeps it off primary retail chips)
  await tagByNeedle("vrbo", {
    categories: ["travel"],
    brands: ["vrbo"],
    keywords: ["vacation rental", "travel", "accommodation"],
  });

  // (Optional) add more travel brands here:
  // await tagByNeedle("expedia", { categories: ["travel"], brands: ["expedia"], keywords: ["flights", "hotels"] });
  // await tagByNeedle("booking", { categories: ["travel"], brands: ["booking.com"], keywords: ["hotels"] });
}

main().finally(() => prisma.$disconnect());
