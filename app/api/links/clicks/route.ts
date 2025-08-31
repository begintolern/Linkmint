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
 * Tries multiple possible schemas:
 *  - linkClick (fields: shortUrl, createdAt)
 *  - eventLog   (fields: type='LINK_CLICK', payload.shortUrl)
 *  - trackingEvent (fields: event='LINK_CLICK', data.shortUrl)
 * Fails soft: if no model is found, returns zeros.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const shortUrls: string[] = Array.isArray(body?.shortUrls) ? body.shortUrls : [];

    // Nothing to do
    if (!shortUrls.length) {
      return NextResponse.json({ counts: {} });
    }

    const db: any = prisma as any;
    const counts: Record<string, number> = Object.fromEntries(shortUrls.map(u => [u, 0]));

    // 1) linkClick model (most direct)
    if (db.linkClick?.findMany) {
      const rows = await db.linkClick.findMany({
        where: { shortUrl: { in: shortUrls } },
        select: { shortUrl: true },
      });
      for (const r of rows) {
        if (r?.shortUrl && counts[r.shortUrl] != null) counts[r.shortUrl] += 1;
      }
      return NextResponse.json({ counts });
    }

    // 2) eventLog model with payload.shortUrl and type='LINK_CLICK'
    if (db.eventLog?.findMany) {
      // Some schemas store payload as JSON, so we fetch recent rows and count in JS.
      const recent = await db.eventLog.findMany({
        where: { type: "LINK_CLICK" },
        orderBy: { createdAt: "desc" },
        take: 5000, // cap to avoid big scans; good enough for MVP
        select: { payload: true },
      });

      for (const row of recent) {
        const short = row?.payload?.shortUrl;
        if (typeof short === "string" && counts[short] != null) counts[short] += 1;
      }
      return NextResponse.json({ counts });
    }

    // 3) trackingEvent model with data.shortUrl and event='LINK_CLICK'
    if (db.trackingEvent?.findMany) {
      const recent = await db.trackingEvent.findMany({
        where: { event: "LINK_CLICK" },
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: { data: true },
      });

      for (const row of recent) {
        const short = row?.data?.shortUrl;
        if (typeof short === "string" && counts[short] != null) counts[short] += 1;
      }
      return NextResponse.json({ counts });
    }

    // If none exist, fail-soft with zeros
    return NextResponse.json({ counts });
  } catch (e) {
    // Fail-soft: never block the UI
    return NextResponse.json({ counts: {} });
  }
}
