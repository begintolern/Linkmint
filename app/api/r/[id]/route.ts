// app/api/r/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper: best-effort IP
function getIP(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: { id?: string } }
) {
  try {
    const short = ctx.params?.id?.trim();
    if (!short) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    // Look up the smart link by several common fields to avoid schema drift.
    // Adjust to your actual schema names later if you like.
    // @ts-ignore
    const link = await prisma.smartLink.findFirst({
      where: {
        OR: [
          { id: short as any },
          // @ts-ignore
          { code: short as any },
          // @ts-ignore
          { shortId: short as any },
        ],
      },
      // @ts-ignore
      select: { id: true, /* code: true, shortId: true, */ destinationUrl: true, url: true },
    });

    // Resolve destination from typical field names
    // @ts-ignore
    const dest = link?.destinationUrl || link?.url;
    if (!link || !dest) {
      // Optional: return a tiny HTML to avoid ugly JSON when shared
      return new NextResponse(
        `<!doctype html><meta charset="utf-8"><title>Link not found</title><p>Sorry, that link doesn’t exist.</p>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
      );
    }

    // Fire-and-forget click log (don’t block redirect if this fails)
    (async () => {
      try {
        const ua = req.headers.get("user-agent") || "";
        const ref = req.headers.get("referer") || "";
        const ip = getIP(req);
        // Common click model guess; adjust to your schema
        // @ts-ignore
        await prisma.click.create({
          data: {
            // @ts-ignore
            smartLinkId: link.id,
            userAgent: ua,
            referer: ref,
            ip,
          },
        });
      } catch {
        // swallow
      }
    })();

    // 302 to destination (fast)
    const res = NextResponse.redirect(dest, { status: 302 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("redirect /r/[id] error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
