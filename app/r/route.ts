// app/r/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /r?to=<encoded target>&sid=<referralCode>
 * - Redirects to the target URL
 * - Logs a click into EventLog (type='LINK_CLICK', detail=<shortUrl>)
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

    // build the exact short URL string being clicked (used as EventLog.detail)
    // Always normalize to your public domain so counts match table rows
    const shortUrl = `https://linkmint.co${url.pathname}${url.search}`;


    // gather simple context for message
    const ip =
      (req.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim() || undefined;
    const ua = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;

    // --- Log click into EventLog (fail-soft) ---
    try {
      await prisma.eventLog.create({
        data: {
          type: "LINK_CLICK",
          // store the exact short URL so we can count later
          detail: shortUrl,
          // optional human-readable context
          message: `sid=${sid ?? ""} ip=${ip ?? ""} ua=${ua ?? ""} ref=${referer ?? ""} -> ${target.toString()}`.slice(0, 1000),
        },
      });
    } catch {
      // never block redirect on logging issues
    }

    // redirect to target
    return new Response(null, {
      status: 302,
      headers: { Location: target.toString() },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
