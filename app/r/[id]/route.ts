// app/r/[id]/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function safeUrl(u?: string | null): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    // Optional: allow only http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // 1) Look up smart link by id
    const link = await prisma.smartLink.findUnique({
      where: { id },
      select: {
        id: true,
        originalUrl: true,
        destinationsJson: true,
        merchantName: true,
      },
    });

    if (!link) {
      // Not found → 404 to make issues obvious during testing
      return NextResponse.json({ ok: false, error: "Smart link not found" }, { status: 404 });
    }

    // 2) Resolve destination (destinationsJson.default > originalUrl)
    let to: string | null = null;
    const dj: any = link.destinationsJson ?? null;

    if (dj && typeof dj === "object" && typeof dj.default === "string") {
      to = safeUrl(dj.default);
    }
    if (!to) {
      to = safeUrl(link.originalUrl);
    }
    if (!to) {
      return NextResponse.json({ ok: false, error: "Invalid destination URL" }, { status: 400 });
    }

    // 3) Log click (best-effort)
    try {
      await prisma.eventLog.create({
        data: {
          type: "LINK_CLICK",
          message: `id=${link.id}`,
          detail: JSON.stringify({
            to,
            ua: req.headers.get("user-agent") ?? "",
            ref: req.headers.get("referer") ?? "",
            ip: (req as any).ip ?? "",
          }),
          severity: 1,
        },
      });
    } catch (e) {
      console.error("r/[id] click log error:", e);
    }

    // 4) Redirect to merchant product
    return NextResponse.redirect(to, { status: 302 });
  } catch (e) {
    console.error("r/[id] fatal error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
