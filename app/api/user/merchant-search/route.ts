// app/api/user/merchant-search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Tags = { categories: string[]; brands: string[]; keywords: string[] };

function parseTags(notes: string | null): Tags {
  const out: Tags = { categories: [], brands: [], keywords: [] };
  if (!notes) return out;

  const lines = notes.split("\n").map((l) => l.trim().toLowerCase());
  const parseList = (s: string) =>
    s.replace(/^[a-z]+=\[/, "").replace(/\]$/, "")
      .split(",").map((x) => x.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("categories=[")) out.categories = parseList(line);
    else if (line.startsWith("brands=[")) out.brands = parseList(line);
    else if (line.startsWith("keywords=[")) out.keywords = parseList(line);
  }
  return out;
}

function tokenize(q: string): { phrase?: string; terms: string[] } {
  const s = q.trim().toLowerCase();
  if (!s) return { terms: [] };
  if (s.startsWith('"') && s.endsWith('"') && s.length > 2) {
    return { phrase: s.slice(1, -1), terms: [] };
  }
  return { terms: s.split(/\s+/).filter((t) => t.length >= 3) };
}

// Heuristic fallbacks when merchants aren't tagged yet
const CAT_SYNONYMS: Record<string, string[]> = {
  apparel: ["apparel", "clothing", "fashion", "garment", "shirt", "pants", "dress", "hoodie", "t-shirt", "jeans"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "boot", "boots", "heel", "heels"],
  beauty: ["beauty", "cosmetic", "cosmetics", "makeup", "skincare", "hair", "wig", "wigs", "fragrance", "perfume"],
  accessories: ["accessor", "bag", "handbag", "backpack", "belt", "hat", "cap", "watch", "jewelry", "wallet", "glasses", "sunglass"],
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get("q") ?? "";
    const category = (url.searchParams.get("category") ?? "").toLowerCase();

    // Default: no chip and no query → no results
    if (!category && !qRaw.trim()) {
      return NextResponse.json({ merchants: [] });
    }

    const { phrase, terms } = tokenize(qRaw);
    const needle = phrase || terms.sort((a, b) => b.length - a.length)[0] || "";

    // Active-only candidates (optionally narrowed by a needle)
    const candidates = await prisma.merchantRule.findMany({
      where: {
        active: true,
        ...(needle
          ? {
              OR: [
                { merchantName: { contains: needle, mode: "insensitive" } },
                { domainPattern: { contains: needle, mode: "insensitive" } },
                { notes: { contains: needle, mode: "insensitive" } },
              ],
            }
          : undefined),
      },
      orderBy: [{ merchantName: "asc" }],
      take: 500,
    });

    const scored: { score: number; item: any }[] = [];
    for (const r of candidates) {
      const tags = parseTags(r.notes ?? "");
      const name = (r.merchantName ?? "").toLowerCase();
      const domain = (r.domainPattern ?? "").toLowerCase();
      const hayBrands = tags.brands.join(" ");
      const hayKeywords = tags.keywords.join(" ");
      const hayNotes = (r.notes ?? "").toLowerCase();

      // Category gating (prefer explicit tag, else heuristic synonyms)
      if (category) {
        const tagged = tags.categories.includes(category);
        const synonyms = CAT_SYNONYMS[category] ?? [];
        const hay = `${name} ${domain} ${hayNotes}`;
        const heuristic = synonyms.some((t) => hay.includes(t));
        if (!tagged && !heuristic) continue;
      }

      // Query gating
      if (phrase || terms.length) {
        const hay = `${hayBrands} ${hayKeywords} ${name} ${domain} ${hayNotes}`;
        const pass = phrase ? hay.includes(phrase) : terms.every((t) => hay.includes(t));
        if (!pass) continue;
      }

      // Scoring: brands(5) > keywords(3) > name(2) > domain(1) + category bonus
      let score = 0;
      const bump = (text: string, w: number) => {
        if (!text) return;
        if (phrase) {
          if (text.includes(phrase)) score += w * 3;
        } else if (terms.length) {
          for (const t of terms) if (text.includes(t)) score += w;
        }
      };
      bump(hayBrands, 5);
      bump(hayKeywords, 3);
      bump(name, 2);
      bump(domain, 1);
      if (category) score += 10;

      scored.push({
        score,
        item: {
          id: r.id,
          name: r.merchantName ?? "",
          domain: r.domainPattern ?? null,
          categories: tags.categories,
          brands: tags.brands,
          keywords: tags.keywords,
        },
      });
    }

    // If chip-only and nothing matched yet, do a pure heuristic fallback over all active
    if (category && !qRaw.trim() && scored.length === 0) {
      const rows = await prisma.merchantRule.findMany({
        where: { active: true },
        orderBy: [{ merchantName: "asc" }],
        take: 1000,
      });
      const synonyms = CAT_SYNONYMS[category] ?? [];
      for (const r of rows) {
        const tags = parseTags(r.notes ?? "");
        const name = (r.merchantName ?? "").toLowerCase();
        const domain = (r.domainPattern ?? "").toLowerCase();
        const hayNotes = (r.notes ?? "").toLowerCase();
        const hay = `${name} ${domain} ${hayNotes}`;

        if (tags.categories.includes(category) || synonyms.some((t) => hay.includes(t))) {
          scored.push({
            score: 5, // base score for heuristic result
            item: {
              id: r.id,
              name: r.merchantName ?? "",
              domain: r.domainPattern ?? null,
              categories: tags.categories,
              brands: tags.brands,
              keywords: tags.keywords,
            },
          });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const merchants = scored.slice(0, 20).map((x) => x.item);

    return NextResponse.json({ merchants });
  } catch (e) {
    console.error("[api/user/merchant-search] error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
