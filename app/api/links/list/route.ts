export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type MaybeSession = { user?: { id?: string | null } } | null;

export async function GET() {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Be tolerant of field names across versions.
  // Prefer a Link (or ShortLink) table if present.
  // We try common field names and fall back with `as any`.
  try {
    const links = await (prisma as any).link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        // common names; any missing fields will just be undefined
        shortUrl: true,
        code: true,
        slug: true,
        short: true,
        targetUrl: true,
        destUrl: true,
        url: true,
        clicks: true,
        earningsCents: true,
      },
    });

    // Normalize shape for the client
    const normalized = links.map((l: any) => ({
      id: l.id,
      createdAt: l.createdAt,
      shortUrl: l.shortUrl ?? l.short ?? (l.code ? `https://linkmint.co/r/${l.code}` : null) ?? (l.slug ? `https://linkmint.co/r/${l.slug}` : null),
      targetUrl: l.targetUrl ?? l.destUrl ?? l.url ?? null,
      clicks: l.clicks ?? 0,
      earningsCents: l.earningsCents ?? null,
    }));

    return NextResponse.json({ success: true, links: normalized });
  } catch {
    // If your table is named ShortLink instead of Link
    try {
      const links = await (prisma as any).shortLink.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          createdAt: true,
          shortUrl: true,
          code: true,
          slug: true,
          targetUrl: true,
          clicks: true,
          earningsCents: true,
        },
      });
      const normalized = links.map((l: any) => ({
        id: l.id,
        createdAt: l.createdAt,
        shortUrl: l.shortUrl ?? (l.code ? `https://linkmint.co/r/${l.code}` : null) ?? (l.slug ? `https://linkmint.co/r/${l.slug}` : null),
        targetUrl: l.targetUrl ?? null,
        clicks: l.clicks ?? 0,
        earningsCents: l.earningsCents ?? null,
      }));
      return NextResponse.json({ success: true, links: normalized });
    } catch (e) {
      console.error("[links/list] error", e);
      return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
  }
}
