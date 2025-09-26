// app/api/go/[code]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateGeoAccess } from "@/lib/geo/market";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  // Look up by shortUrl; include rule + owner
  const link = await prisma.smartLink.findFirst({
    where: { shortUrl: code },
    include: { merchantRule: true, user: true },
  });

  if (!link) {
    return NextResponse.json(
      { ok: false, error: "Smart link not found." },
      { status: 404 }
    );
  }

  const dest: string | null = link.originalUrl ?? null;
  if (!dest) {
    return NextResponse.json(
      { ok: false, error: "No originalUrl set on smart link." },
      { status: 422 }
    );
  }

  // Build minimal shapes for geo evaluation
  const userForGeo = {
    homeCountry: link.user?.homeCountry ?? link.user?.countryCode ?? null,
    currentMarket: link.user?.currentMarket ?? null,
    currentMarketAt: link.user?.currentMarketAt ?? null,
  };

  const rule: any = link.merchantRule || {};
const ruleForGeo = {
  allowedCountries: rule.allowedCountries ?? null,
  blockedCountries: rule.blockedCountries ?? null,
  merchantName: rule.merchantName ?? link.merchantName ?? null,
};

  // Evaluate from headers (x-vercel-ip-country / cf-ipcountry, etc.)
  const decision = evaluateGeoAccess(req, userForGeo, ruleForGeo);

  // Audit log (minimal fields only; tolerate JSON typing)
  try {
    await prisma.eventLog.create({
      data: {
        type: "GEO_CHECK",
        message: decision.allowed ? "Geo allowed" : "Geo blocked",
        userId: link.userId ?? null,
        meta: {
          ipCountry: decision.ipCountry,
          market: decision.market,
          allowed: decision.allowed,
          reason: decision.reason ?? null,
          shortUrl: link.shortUrl,
          merchantRuleId: link.merchantRuleId ?? null,
          destinationHost: safeHost(dest),
        } as any,
      } as any,
    });
  } catch {
    // ignore log failures
  }

  if (!decision.allowed) {
    const html = blockedHtml({
      ipCountry: decision.ipCountry,
      merchantName: ruleForGeo.merchantName ?? "this merchant",
      reason: decision.reason ?? "geo_restricted",
    });
    return new NextResponse(html, {
      status: 451,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // ✅ Redirect
  return NextResponse.redirect(dest, { status: 302 });
}

// ---- helpers ----
function safeHost(url: string | null | undefined) {
  try {
    if (!url) return null;
    return new URL(url).host;
  } catch {
    return null;
  }
}

function blockedHtml(opts: {
  ipCountry: string | null;
  merchantName: string;
  reason: string;
}) {
  const { ipCountry, merchantName, reason } = opts;
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
          c
        ]!
        )
    );
  return `
<!doctype html>
<meta charset="utf-8">
<title>Not available in your location</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: light dark; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 32px; max-width: 720px; margin: 0 auto; line-height: 1.55; }
  .card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px; }
  .tag { display:inline-block; padding:2px 8px; border-radius:9999px; background:#f3f4f6; font-size:12px; margin-left:8px; }
  a.button { display:inline-block; padding:10px 14px; border-radius:10px; text-decoration:none; border:1px solid #e5e7eb; margin-right:8px; }
</style>
<div class="card">
  <h1>Not available in your location <span class="tag">${ipCountry ?? "Unknown"}</span></h1>
  <p>The offer <strong>${esc(merchantName)}</strong> isn’t available for your current market.</p>
  <p>Reason: <code>${esc(reason)}</code></p>
  <p style="margin-top:16px">
    <a class="button" href="/dashboard/merchants">See allowed merchants</a>
    <a class="button" href="/">Back to home</a>
  </p>
</div>`;
}
