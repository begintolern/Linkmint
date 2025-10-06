// app/api/finder/products/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { curated } from "@/lib/finder/curated";

/**
 * Provision-mode Finder API
 *
 * GET /api/finder/products?merchant=LAZADA_PH|SHOPEE_PH&maxPrice=1000&q=lamp
 * Returns: { ok: true, items: FinderItem[] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const merchant = (url.searchParams.get("merchant") ?? "").toUpperCase();
  const maxPrice = Number(url.searchParams.get("maxPrice") ?? 0);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  let items = curated.slice();

  if (merchant && merchant !== "ALL") {
    items = items.filter((i) => i.merchant.toUpperCase() === merchant);
  }

  if (maxPrice && !Number.isNaN(maxPrice) && maxPrice > 0) {
    items = items.filter((i) => i.price <= maxPrice);
  }

  if (q) {
    items = items.filter((i) => {
      const hay = `${i.title} ${(i.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // naive sort hint: higher reviews, then rating, then lower price
  items.sort((a, b) => {
    const ra = a.reviews ?? 0;
    const rb = b.reviews ?? 0;
    if (rb !== ra) return rb - ra;
    const rta = a.rating ?? 0;
    const rtb = b.rating ?? 0;
    if (rtb !== rta) return rtb - rta;
    return a.price - b.price;
    // keep stable order otherwise
  });

  // cap to a reasonable page size
  items = items.slice(0, 30);

  return NextResponse.json({ ok: true, items });
}
