// app/api/pixel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// 1x1 transparent GIF (classic tracking pixel)
const GIF_1x1 = Uint8Array.from([
  71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,1,0,44,0,
  0,0,0,1,0,1,0,0,2,2,68,1,0,59
]);

function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const smartLinkId = (url.searchParams.get("s") || "").trim(); // ?s=<smartLinkId>

  // Always return a pixel (don’t break renders), but log when possible
  if (smartLinkId) {
    try {
      const link = await prisma.smartLink.findUnique({
        where: { id: smartLinkId },
        select: {
          id: true,
          userId: true,
          merchantRuleId: true,
          merchantName: true,
          merchantDomain: true
        }
      });

      if (link) {
        const ip = getClientIp(req);
        const ua = req.headers.get("user-agent") || null;
        const referer = req.headers.get("referer") || null;
        const country = req.headers.get("cf-ipcountry") || null;

        // Fire-and-forget; pixel must return fast
        prisma.eventLog.create({
          data: {
            userId: link.userId,
            type: "CLICK_PIXEL",
            message: "SmartLink pixel hit",
            // @ts-ignore if metadata is Json
            metadata: {
              smartLinkId: link.id,
              merchantRuleId: link.merchantRuleId,
              merchantName: link.merchantName,
              merchantDomain: link.merchantDomain,
              ip, ua, referer, country,
              at: new Date().toISOString()
            }
          }
        }).catch(() => {});
      }
    } catch {
      // Swallow errors; still return the pixel
    }
  }

  return new NextResponse(GIF_1x1, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}
