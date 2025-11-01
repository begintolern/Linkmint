// app/r/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Handles short links like /r/ABC123.
 * Looks up the SmartLink by its stored full shortUrl and redirects to originalUrl.
 * Also logs a Click row (fire-and-forget).
 */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;

  // Build the full shortUrl exactly as we stored it during creation.
  const url = new URL(req.url);
  // url.origin is http://localhost:3000 (dev) or your prod domain.
  const fullShort = `${url.origin}/r/${id}`;

  // Find the SmartLink by its shortUrl
  const link = await prisma.smartLink.findFirst({
    where: { shortUrl: fullShort },
    select: { id: true, originalUrl: true },
  });

  if (!link) {
    return new NextResponse("Smart link not found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // Log click (do not block redirect)
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);
  const ref = req.headers.get("referer") ?? undefined;
  prisma.click.create({
    data: { linkId: link.id, ua, referrer: ref },
  }).catch(() => { /* ignore logging errors */ });

  // Redirect to the original product page
  return NextResponse.redirect(link.originalUrl, 302);
}
