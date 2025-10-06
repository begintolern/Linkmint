// app/api/merchants/identify/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { matchMerchantFromUrl } from "@/lib/merchants/registry";

/**
 * GET /api/merchants/identify?url=<product_or_store_url>
 * → { ok, match? { key,label,country,ready,missingEnv,note,normalizedUrl,host } }
 */
export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const target = u.searchParams.get("url");

  if (!target) {
    return NextResponse.json(
      { ok: false, error: "Missing ?url parameter" },
      { status: 400 }
    );
  }

  const match = matchMerchantFromUrl(target);

  if (!match) {
    return NextResponse.json({
      ok: true,
      match: null,
      message: "No supported merchant detected from URL.",
    });
  }

  return NextResponse.json({ ok: true, match });
}
