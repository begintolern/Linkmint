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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get("q") ?? "";
    const category = (url.searchParams.get("category") ?? "").toLowerCase();

    const { phrase, terms } = tokenize(qRaw);

    // choose a cheap "needle" to narrow DB scan (if any)
    const needle = phrase || terms.sort((a, b) => b.length - a.length)[0] || "";

    // active-only candidate set
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
      take: 300,
    });

    // score & filter in app layer
    const scored: { score: number; item: any }[] = [];
    for (const r of candidates) {
      const tags = parseTags(r.notes ?? "");
      if (category && !tags.categories.includes(category)) continue;

      const name = (r.merchantName ?? "").toLowerCase();
      const domain = (r.domainPattern ?? "").toLowerCase();
      const hayBrands = tags.brands.join(" ");
      const hayKeywords = tags.keywords.join(" ");
      const hayNotes = (r.notes ?? "").toLowerCase();

      // strict match rule
      let pass = true;
      if (phrase) {
        const hay = `${hayBrands} ${hayKeywords} ${name} ${domain} ${hayNotes}`;
        pass = hay.includes(phrase);
      } else if (terms.length) {
        const hay = `${hayBrands} ${hayKeywords} ${name} ${domain} ${hayNotes}`;
        pass = terms.every((t) => hay.includes(t));
      }
      if (!pass) continue;

      // score: brands(5) > keywords(3) > name(2) > domain(1)
      let score = 0;
      const bump = (text: string, w: number) => {
        if (!text) return;
        if (phrase) {
          if (text.includes(phrase)) score += w * 3;
        } else {
          for (const t of terms) if (text.includes(t)) score += w;
        }
      };
      bump(hayBrands, 5);
      bump(hayKeywords, 3);
      bump(name, 2);
      bump(domain, 1);

      // slight bonus for explicit category match
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

    scored.sort((a, b) => b.score - a.score);
    const merchants = scored.slice(0, 20).map((x) => x.item);

    // If user clicked a category with no query, allow zero-needle fetch:
    if (!needle && (category || qRaw.trim() === "")) {
      // return top 20 by name for that category if empty from scoring pass
      if (merchants.length === 0 && category) {
        const rows = await prisma.merchantRule.findMany({
          where: { active: true },
          orderBy: [{ merchantName: "asc" }],
          take: 500,
        });
        const fallback = rows
          .map((r) => ({
            r,
            tags: parseTags(r.notes ?? ""),
          }))
          .filter(({ tags }) => tags.categories.includes(category))
          .slice(0, 20)
          .map(({ r, tags }) => ({
            id: r.id,
            name: r.merchantName ?? "",
            domain: r.domainPattern ?? null,
            categories: tags.categories,
            brands: tags.brands,
            keywords: tags.keywords,
          }));
        return NextResponse.json({ merchants: fallback });
      }
    }

    return NextResponse.json({ merchants });
  } catch (e) {
    console.error("[api/user/merchant-search] error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
