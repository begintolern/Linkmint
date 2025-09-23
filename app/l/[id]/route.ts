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

  // Capture lightweight click telemetry into your existing EventLog
  // (avoids creating a new ClickEvent model/migration)
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;
  const country = req.headers.get("cf-ipcountry") || null; // if behind Cloudflare later

  // Fire-and-forget; don't block the redirect if logging fails
  prisma.eventLog
    .create({
      data: {
        userId: link.userId,
        // adapt to your EventLog shape (type/level/message/metadata)
        type: "CLICK",
        message: "SmartLink click",
        // @ts-ignore - if metadata is Json
        metadata: {
          smartLinkId: link.id,
          merchantRuleId: link.merchantRuleId,
          merchantName: link.merchantName,
          merchantDomain: link.merchantDomain,
          ip,
          ua,
          referer,
          country,
          at: new Date().toISOString(),
        },
      },
    })
    .catch(() => { /* noop */ });

  // 302 → merchant destination
  return NextResponse.redirect(link.originalUrl, { status: 302 });
}
