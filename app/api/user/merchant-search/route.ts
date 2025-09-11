// app/api/user/merchant-search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseTags(notes: string | null) {
  const result: { categories: string[]; brands: string[]; keywords: string[] } = {
    categories: [],
    brands: [],
    keywords: [],
  };
  if (!notes) return result;

  const lines = notes.split("\n").map((l) => l.trim().toLowerCase());
  for (const line of lines) {
    if (line.startsWith("categories=[")) {
      result.categories = line
        .replace("categories=[", "")
        .replace("]", "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (line.startsWith("brands=[")) {
      result.brands = line
        .replace("brands=[", "")
        .replace("]", "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (line.startsWith("keywords=[")) {
      result.keywords = line
        .replace("keywords=[", "")
        .replace("]", "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return result;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qRaw = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const q = qRaw.trim().toLowerCase();

  // Fetch candidates (active only)
  const rows = await prisma.merchantRule.findMany({
    where: { active: true },
    orderBy: [{ merchantName: "asc" }],
    take: 200,
  });

  const results = [];
  for (const r of rows) {
    const tags = parseTags(r.notes ?? "");
    let score = 0;

    // Category filter
    if (category) {
      if (!tags.categories.includes(category.toLowerCase())) continue;
      score += 10;
    }

    // Text query filter
    if (q) {
      const terms = q.startsWith('"') && q.endsWith('"')
        ? [q.slice(1, -1)]
        : q.split(/\s+/).filter((t) => t.length >= 3);

      const haystack = [
        ...tags.brands,
        ...tags.keywords,
        r.merchantName?.toLowerCase() ?? "",
        r.domainPattern?.toLowerCase() ?? "",
        r.notes?.toLowerCase() ?? "",
      ].join(" ");

      // Require all terms
      if (!terms.every((t) => haystack.includes(t))) continue;

      // Scoring
      for (const t of terms) {
        if (tags.brands.some((b) => b.includes(t))) score += 5;
        if (tags.keywords.some((k) => k.includes(t))) score += 3;
        if ((r.merchantName ?? "").toLowerCase().includes(t)) score += 2;
        if ((r.domainPattern ?? "").toLowerCase().includes(t)) score += 1;
      }
    }

    results.push({
      id: r.id,
      name: r.merchantName,
      domain: r.domainPattern,
      categories: tags.categories,
      brands: tags.brands,
      keywords: tags.keywords,
      notes: r.notes,
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({ merchants: results.slice(0, 20) });
}
