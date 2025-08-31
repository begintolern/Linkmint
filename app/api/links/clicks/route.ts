// app/api/links/clicks/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/links/clicks
 * Body: { shortUrls: string[] }
 * Returns: { counts: Record<string, number> }
 *
 * Reads clicks from EventLog where:
 *   type   = 'LINK_CLICK'
 *   detail = <shortUrl>
 *
 * Fails soft: if anything goes wrong, returns zeros so the UI still renders.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const shortUrls: string[] = Array.isArray(body?.shortUrls) ? body.shortUrls : [];

    if (!shortUrls.length) {
      return NextResponse.json({ counts: {} });
    }

    // Fetch recent LINK_CLICK logs and count matches by detail = shortUrl
    // (We cap the scan to avoid large full-table scans in MVP.)
    const recent = await prisma.eventLog.findMany({
      where: { type: "LINK_CLICK" },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { detail: true },
    });

    const counts: Record<string, number> = Object.fromEntries(shortUrls.map(u => [u, 0]));

    for (const row of recent) {
      const d = row?.detail;
      if (typeof d === "string" && counts[d] != null) {
        counts[d] += 1;
      }
    }

    return NextResponse.json({ counts });
  } catch {
    // Fail-soft
    return NextResponse.json({ counts: {} });
  }
}
