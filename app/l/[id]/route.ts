// app/l/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Extract best-effort IP behind proxies/CDNs
function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

/** Append subid/utm for generic fallback links */
function appendSubid(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    if (!u.searchParams.has("lm_subid")) u.searchParams.set("lm_subid", subid);
    if (!u.searchParams.has("utm_source"))
      u.searchParams.set("utm_source", "linkmint");
    return u.toString();
  } catch {
    return productUrl;
  }
}

/** Involve Asia wrapper (optional fallback) */
function wrapWithInvolveAsia(productUrl: string, subid: string): string | null {
  const base = (process.env.INVOLVEASIA_BASE_URL || "").trim();
  if (!base) return null;

  const deeplinkParam = (process.env.INVOLVEASIA_DEEPLINK_PARAM || "url").trim();
  const subidParam = (process.env.INVOLVEASIA_SUBID_PARAM || "aff_sub").trim();
  const affIdParam = (process.env.INVOLVEASIA_AFF_ID_PARAM || "").trim();
  const affIdValue = (process.env.INVOLVEASIA_AFF_ID_VALUE || "").trim();

  try {
    const out = new URL(base);
    out.searchParams.set(deeplinkParam, productUrl);
    out.searchParams.set(subidParam, subid);
    if (affIdParam && affIdValue) out.searchParams.set(affIdParam, affIdValue);
    out.searchParams.set("lm_subid", subid);
    out.searchParams.set("utm_source", "linkmint");
    return out.toString();
  } catch {
    return null;
  }
}

/** Shopee wrapper (optional fallback) */
function wrapWithShopee(productUrl: string, subid: string): string | null {
  const base = (process.env.SHOPEE_BASE_URL || "").trim();
  if (!base) return null;

  const deeplinkParam = (process.env.SHOPEE_DEEPLINK_PARAM || "url").trim();
  const subidParam = (process.env.SHOPEE_SUBID_PARAM || "subid").trim();
  const affIdParam = (process.env.SHOPEE_AFF_ID_PARAM || "").trim();
  const affIdValue = (process.env.SHOPEE_AFF_ID_VALUE || "").trim();

  try {
    const out = new URL(base);
    out.searchParams.set(deeplinkParam, productUrl);
    out.searchParams.set(subidParam, subid);
    if (affIdParam && affIdValue) out.searchParams.set(affIdParam, affIdValue);
    out.searchParams.set("lm_subid", subid);
    out.searchParams.set("utm_source", "linkmint");
    return out.toString();
  } catch {
    return null;
  }
}

/** Fallback builder if we don't already have a tracked shortUrl */
function buildOutboundUrl(opts: {
  productUrl: string;
  smartLinkId: string;
  merchant?: { network?: string | null; domain?: string | null; name?: string | null };
}): string {
  const { productUrl, smartLinkId, merchant } = opts;
  const network = (merchant?.network || "").trim().toLowerCase();
  const domain = (merchant?.domain || "").trim().toLowerCase();

  // If you ever store Shopee under "Involve Asia", this wrapper may still apply.
  const isIA = network === "involve asia";
  const isLazadaPH = !!domain && (domain === "lazada.com.ph" || domain.endsWith(".lazada.com.ph"));
  if (isIA && isLazadaPH) {
    const wrapped = wrapWithInvolveAsia(productUrl, smartLinkId);
    if (wrapped) return wrapped;
  }

  // If you later store Shopee as "Shopee Affiliate"
  const isShopeeAff = network === "shopee affiliate";
  const isShopeePH = !!domain && (domain === "shopee.ph" || domain.endsWith(".shopee.ph"));
  if (isShopeeAff && isShopeePH) {
    const wrapped = wrapWithShopee(productUrl, smartLinkId);
    if (wrapped) return wrapped;
  }

  // Generic fallback
  return appendSubid(productUrl, smartLinkId);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = (params?.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });

  const link = await prisma.smartLink.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      merchantRuleId: true,
      merchantName: true,
      merchantDomain: true,
      originalUrl: true,
      shortUrl: true,            // <-- pull tracked affiliate short link
      createdAt: true,
      merchantRule: { select: { network: true, domainPattern: true } },
    },
  });

  if (!link || !link.originalUrl) {
    return NextResponse.json({ ok: false, error: "LINK_NOT_FOUND" }, { status: 404 });
  }

  // ✅ Prefer the tracked affiliate link we already created in /api/smartlink
  const tracked = (link.shortUrl || "").trim();
  const outboundUrl =
    tracked ||
    buildOutboundUrl({
      productUrl: link.originalUrl,
      smartLinkId: link.id,
      merchant: {
        network: link.merchantRule?.network ?? null,
        domain: link.merchantDomain ?? link.merchantRule?.domainPattern ?? null,
        name: link.merchantName ?? null,
      },
    });

  // Request metadata
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;
  const country = req.headers.get("cf-ipcountry") || null;

  const detailPayload = {
    smartLinkId: link.id,
    merchantRuleId: link.merchantRuleId,
    merchantName: link.merchantName,
    merchantDomain: link.merchantDomain,
    network: link.merchantRule?.network ?? null,
    outboundUrl,
    ip,
    ua,
    referer,
    country,
    at: new Date().toISOString(),
  };

  // EventLog (non-blocking)
  const eventData: any = {
    type: "CLICK",
    message: "SmartLink click",
    detail: JSON.stringify(detailPayload),
    severity: 1,
  };
  if (link.userId) eventData.user = { connect: { id: link.userId } };
  prisma.eventLog.create({ data: eventData }).catch((e) =>
    console.error("[shortlink][EventLog] error:", e)
  );

  // ClickEvent (non-blocking)
  prisma.clickEvent
    .create({
      data: {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: "SHORTLINK",
        userId: link.userId ?? null,
        merchantId: link.merchantRuleId ?? null,
        ip: ip ?? null,
        userAgent: ua ?? null,
        url: outboundUrl,
        referer: referer ?? null,
        meta: { country },
        linkId: link.id,
      },
    })
    .catch((e) => console.error("[shortlink][ClickEvent] error:", e));

  return NextResponse.redirect(outboundUrl, { status: 302 });
}
