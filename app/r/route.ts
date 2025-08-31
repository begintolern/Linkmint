// app/r/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /r?to=<encoded target>&sid=<referralCode>
 * - Redirects to the target URL
 * - Best-effort logs a click (tries several model shapes, then no-ops on failure)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to");
    const sid = url.searchParams.get("sid") || null;

    if (!to) {
      return NextResponse.json({ ok: false, error: "Missing 'to' param" }, { status: 400 });
    }

    // validate target
    let target: URL;
    try {
      target = new URL(to);
      if (!/^https?:$/i.test(target.protocol)) throw new Error("invalid protocol");
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid target URL" }, { status: 400 });
    }

    // gather simple context
    const ip =
      // common header set by proxies/CDNs
      (req.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim() || null;
    const ua = req.headers.get("user-agent") || null;
    const referer = req.headers.get("referer") || null;
    const clickedAt = new Date();

    // --- Best-effort logging (schema-agnostic) ---
    try {
      const db: any = prisma as any;

      // 1) If there's a dedicated Click model
      if (db.linkClick?.create) {
        await db.linkClick.create({
          data: {
            shortUrl: url.origin + url.pathname + url.search, // the /r?... URL itself
            targetUrl: target.toString(),
            sid,
            ip,
            userAgent: ua,
            referer,
            createdAt: clickedAt,
          },
        });
      }
      // 2) Or an EventLog model with flexible JSON
      else if (db.eventLog?.create) {
        await db.eventLog.create({
          data: {
            type: "LINK_CLICK",
            // userId can be null/unknown for anonymous clicks
            userId: null,
            // put everything into a json/metadata field if present; fall back to message
            payload: {
              shortUrl: url.origin + url.pathname + url.search,
              targetUrl: target.toString(),
              sid,
              ip,
              ua,
              referer,
              clickedAt,
            },
            message: `CLICK ${sid ?? ""} -> ${target.toString()}`.trim(),
            createdAt: clickedAt,
          },
        } as any);
      }
      // 3) Or a very generic Log/Tracking model
      else if (db.trackingEvent?.create) {
        await db.trackingEvent.create({
          data: {
            event: "LINK_CLICK",
            data: {
              shortUrl: url.origin + url.pathname + url.search,
              targetUrl: target.toString(),
              sid,
              ip,
              ua,
              referer,
            },
            createdAt: clickedAt,
          },
        });
      }
      // if none of the above exist, we silently no-op
    } catch {
      // never block the redirect on logging issues
    }

    // finally redirect
    return new Response(null, {
      status: 302,
      headers: { Location: target.toString() },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
