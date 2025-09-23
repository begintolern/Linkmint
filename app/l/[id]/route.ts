// app/l/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Best-effort IP extraction behind proxies
function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || null;
}

/** Append our click id to any URL (fallback) */
function appendSubid(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    u.searchParams.set("lm_subid", subid);        // our universal subid
    u.searchParams.set("utm_source", "linkmint"); // optional analytics
    return u.toString();
  } catch {
    return productUrl;
  }
}

/** Involve Asia wrapper (configurable via env). Returns null if misconfigured. */
function wrapWithInvolveAsia(productUrl: string, subid: string): string | null {
  const base = (process.env.INVOLVEASIA_BASE_URL || "").trim(); // e.g. https://invol.co/aff_m
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

    // backup for reconciliation
    out.searchParams.set("lm_subid", subid);
    out.searchParams.set("utm_source", "linkmint");
    return out.toString();
  } catch {
    return null;
  }
}

/** Shopee Affiliate wrapper (configurable via env). Returns null if misconfigured. */
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

    // backup for reconciliation
    out.searchParams.set("lm_subid", subid);
    out.searchParams.set("utm_source", "linkmint");
    return out.toString();
  } catch {
    return null;
  }
}

/**
 * Central builder for outbound URLs.
 * - Lazada PH via Involve Asia
 * - Shopee PH via Shopee Affiliate
 * - Fallback: ?lm_subid=...
 */
function buildOutboundUrl(opts: {
  productUrl: string;
  smartLinkId: string;
  merchant?: { network?: string | null; domain?: string | null; name?: string | null };
  context?: { userId?: string | null; source?: string | null };
}): string {
  const { productUrl, smartLinkId, merchant } = opts;
  const network = (merchant?.network || "").trim().toLowerCase();
  const domain  = (merchant?.domain  || "").trim().toLowerCase();

  // Involve Asia → Lazada PH
  const isIA = network === "involve asia";
  const isLazadaPH =
    !!domain && (domain === "lazada.com.ph" || domain.endsWith(".lazada.com.ph"));
  if (isIA && isLazadaPH) {
    const wrapped = wrapWithInvolveAsia(productUrl, smartLinkId);
    if (wrapped) return wrapped;
  }

  // Shopee Affiliate → Shopee PH
  const isShopee = network === "shopee affiliate";
  const isShopeePH =
    !!domain && (domain === "shopee.ph" || domain.endsWith(".shopee.ph"));
  if (isShopee && isShopeePH) {
    const wrapped = wrapWithShopee(productUrl, smartLinkId);
    if (wrapped) return wrapped;
  }

  // Fallback
  return appendSubid(productUrl, smartLinkId);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = (params?.id || "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  }

  const link = await prisma.smartLink.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      merchantRuleId: true,
      merchantName: true,
      merchantDomain: true,
      originalUrl: true,
      createdAt: true,
      merchantRule: {
        select: {
          network: true,
          domainPattern: true,
        },
      },
    },
  });

  if (!link || !link.originalUrl) {
    return NextResponse.json({ ok: false, error: "LINK_NOT_FOUND" }, { status: 404 });
  }

  const outboundUrl = buildOutboundUrl({
    productUrl: link.originalUrl,
    smartLinkId: link.id,
    merchant: {
      network: link.merchantRule?.network ?? null,
      domain: link.merchantDomain ?? link.merchantRule?.domainPattern ?? null,
      name: link.merchantName ?? null,
    },
    context: {
      userId: link.userId,
    },
  });

  // Capture lightweight click telemetry into EventLog (fire-and-forget)
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;
  const country = req.headers.get("cf-ipcountry") || null; // if behind Cloudflare later

  prisma.eventLog
    .create({
      data: {
        userId: link.userId,
        type: "CLICK",
        message: "SmartLink click",
        // @ts-ignore if metadata is Json
        metadata: {
          smartLinkId: link.id,
          merchantRuleId: link.merchantRuleId,
          merchantName: link.merchantName,
          merchantDomain: link.merchantDomain,
          network: link.merchantRule?.network ?? null,
          ip,
          ua,
          referer,
          country,
          outboundUrl,
          at: new Date().toISOString(),
        },
      },
    })
    .catch(() => { /* do not block redirect on logging issues */ });

  return NextResponse.redirect(outboundUrl, { status: 302 });
}
