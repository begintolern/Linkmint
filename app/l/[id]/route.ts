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

/**
 * Central builder for outbound URLs.
 * Today it falls back to appendSubid() for all networks.
 * Next step we’ll add real deep-link wrappers per network (Involve Asia, Shopee, CJ).
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

  // ---- Network-specific branches (placeholders for next step) ----
  // Example stubs (will be implemented next):
  // if (network === "involve asia" && domain.endsWith("lazada.com.ph")) {
  //   return wrapWithInvolveAsia(productUrl, { subid: smartLinkId, ... });
  // }
  // if (network === "shopee affiliate" && domain.endsWith("shopee.ph")) {
  //   return wrapWithShopee(productUrl, { subid: smartLinkId, ... });
  // }

  // Fallback for now: just append our universal subid
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
      // If you later store source on SmartLink, you can select it here
      // source: true,
      // Pull network for routing if needed (join via merchantRule)
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
      // source: link.source ?? null, // if/when you add it
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
          outboundUrl, // keep for reconciliation
          at: new Date().toISOString(),
        },
      },
    })
    .catch(() => { /* do not block redirect on logging issues */ });

  return NextResponse.redirect(outboundUrl, { status: 302 });
}
