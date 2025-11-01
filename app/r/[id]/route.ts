// app/r/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // 1) Look up SmartLink by short id
    const link = await prisma.smartLink.findUnique({
      where: { id },
      select: {
        originalUrl: true,
        destinationsJson: true,
      },
    });

    // 2) If not found, fall back to homepage
    if (!link) {
      return NextResponse.redirect(
        process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co"
      );
    }

    // 3) Choose destination (destinationsJson.default → else originalUrl)
    let dest = link.originalUrl;
    try {
      const dj = link.destinationsJson as any;
      if (dj && typeof dj === "object" && dj.default) {
        dest = String(dj.default);
      }
    } catch {
      // ignore and use originalUrl
    }

    // 4) Log the click (EventLog keeps schema-safe; avoid assumptions about Click model)
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

    // 5) Redirect to the actual product page
    return NextResponse.redirect(dest);
  } catch (e) {
    console.error("r/[id] handler error:", e);
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co"
    );
  }
}
