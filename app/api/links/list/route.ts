export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

/**
 * Tries common model names: smartLink, link, shortLink.
 * Normalizes to a simple shape the frontend expects.
 */
export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    const userId: string | null = session?.user?.id ?? null;

    // If not logged in, just return an empty list (UI will fallback to localStorage)
    if (!userId) {
      return NextResponse.json({ links: [] });
    }

    const db: any = prisma as any;
    let rows: any[] = [];

    // Try SmartLink
    if (db.smartLink?.findMany) {
      rows = await db.smartLink.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          createdAt: true,
          shortUrl: true,
          targetUrl: true,
          clicks: true,
          earningsCents: true,
        },
      });
    }
    // Try Link
    else if (db.link?.findMany) {
      rows = await db.link.findMany({
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
          destUrl: true,
          url: true,
          clicks: true,
          earningsCents: true,
        },
      });
    }
    // Try ShortLink
    else if (db.shortLink?.findMany) {
      rows = await db.shortLink.findMany({
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
    } else {
      // No matching model in this schema — return empty so UI can fallback
      return NextResponse.json({ links: [] });
    }

    // Normalize across possible model shapes
    const normalized = rows.map((l: any) => ({
      id: l.id,
      createdAt: l.createdAt,
      shortUrl:
        l.shortUrl ??
        (l.code ? `https://linkmint.co/r/${l.code}` : null) ??
        (l.slug ? `https://linkmint.co/r/${l.slug}` : null) ??
        null,
      targetUrl: l.targetUrl ?? l.destUrl ?? l.url ?? null,
      clicks: l.clicks ?? 0,
      earningsCents: l.earningsCents ?? null,
    }));

    return NextResponse.json({ links: normalized });
  } catch (err) {
    console.error("GET /api/links/list failed:", err);
    // Fail-soft so the client can fallback to localStorage
    return NextResponse.json({ links: [] });
  }
}
