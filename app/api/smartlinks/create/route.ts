// app/r/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function appBase() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co";
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Try to resolve SmartLink by short id
    const link = await prisma.smartLink.findUnique({
      where: { id },
      select: { originalUrl: true, destinationsJson: true },
    });

    if (link) {
      let dest = link.originalUrl;
      try {
        const dj = link.destinationsJson as any;
        if (dj && typeof dj === "object" && dj.default) dest = String(dj.default);
      } catch {
        /* ignore */
      }

      // Best-effort log
      try {
        const ua = (req.headers.get("user-agent") ?? "").slice(0, 250);
        const referer = (req.headers.get("referer") ?? "").slice(0, 250);
        await prisma.eventLog.create({
          data: {
            type: "LINK_REDIRECT",
            detail: id,
            message: `-> ${dest} ua=${ua} ref=${referer}`,
          },
        });
      } catch (e) {
        console.error("r/[id] eventLog failed:", e);
      }

      return NextResponse.redirect(dest);
    }

    // Fallback: treat as referral code (legacy behavior)
    const res = NextResponse.redirect(appBase());
    res.cookies.set("lm_ref", id, { path: "/", maxAge: 60 * 60 * 24 * 60 }); // 60 days
    return res;
  } catch (e) {
    console.error("r/[id] handler error:", e);
    return NextResponse.redirect(appBase());
  }
}
