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

/**
 * Minimal, network-agnostic fallback:
 * Append our click id as lm_subid to the destination URL.
 * (We’ll swap to network-specific deep links later.)
 */
function appendSubid(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    u.searchParams.set("lm_subid", subid);      // primary click id you’ll get back in webhook/reports
    u.searchParams.set("utm_source", "linkmint"); // optional: helpful for analytics
    return u.toString();
  } catch {
    // If parsing fails, just return the original URL
    return productUrl;
  }
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
    },
  });

  if (!link || !link.originalUrl) {
    return NextResponse.json({ ok: false, error: "LINK_NOT_FOUND" }, { status: 404 });
  }

  // Build outbound URL with our click id
  const outboundUrl = appendSubid(link.originalUrl, link.id);

  // Capture lightweight click telemetry into EventLog (fire-and-forget)
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;
  const country = req.headers.get("cf-ipcountry") || null; // if behind Cloudflare later

  prisma.eventLog
    .create({
      data: {
        userId: link.userId,
        // Adapt to your EventLog schema
        type: "CLICK",
        message: "SmartLink click",
        // @ts-ignore if metadata is Json
        metadata: {
          smartLinkId: link.id,
          merchantRuleId: link.merchantRuleId,
          merchantName: link.merchantName,
          merchantDomain: link.merchantDomain,
          ip,
          ua,
          referer,
          country,
          outboundUrl, // helpful for reconciliation/debugging
          at: new Date().toISOString(),
        },
      },
    })
    .catch(() => { /* do not block redirect on logging issues */ });

  // Redirect to destination with lm_subid
  return NextResponse.redirect(outboundUrl, { status: 302 });
}
