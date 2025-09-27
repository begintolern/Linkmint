// app/api/market/set/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";

const VALID = new Set(["PH", "US"]); // expand later as needed

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const to = (url.searchParams.get("to") || "").toUpperCase().trim(); // e.g., "US" or "PH"
  const back = url.searchParams.get("back") || "/"; // where to return after setting

  if (!VALID.has(to)) {
    return NextResponse.json({ ok: false, error: "Invalid market code" }, { status: 400 });
  }

  const now = new Date();
  const res = NextResponse.redirect(back, { status: 302 });

  // 24h override cookies
  res.cookies.set("lm_market", to, {
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
    sameSite: "lax",
  });
  res.cookies.set("lm_market_at", now.toISOString(), {
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });

  return res;
}
