// app/api/market/set/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";

const VALID = new Set(["PH", "US"]); // expand later as needed

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl; // robust: has origin/protocol/host
    const to = (url.searchParams.get("to") || "").toUpperCase().trim(); // e.g., "US" or "PH"
    const backParam = url.searchParams.get("back") || "/";

    if (!VALID.has(to)) {
      return NextResponse.json({ ok: false, error: "Invalid market code" }, { status: 400 });
    }

    // Build absolute back URL relative to current origin (avoids 500 from bad redirects)
    const backUrl = new URL(backParam, url.origin);

    const secure = backUrl.protocol === "https:";
    const res = NextResponse.redirect(backUrl, { status: 302 });

    // 24h override cookies
    res.cookies.set("lm_market", to, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
      sameSite: "lax",
      secure,
      httpOnly: false,
    });
    res.cookies.set("lm_market_at", new Date().toISOString(), {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure,
      httpOnly: false,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
