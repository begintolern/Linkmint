// app/api/auth/dev-set/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

const KEY = process.env.DEV_COOKIE_KEY; // set this in Railway

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const email = (url.searchParams.get("email") || "").trim();
  const role = (url.searchParams.get("role") || "user").trim().toLowerCase();
  const uid  = (url.searchParams.get("uid")  || "").trim();

  if (!KEY || key !== KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!email) {
    return NextResponse.json({ ok: false, error: "missing email" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, email, role, uid: uid || null });

  // Set cookies for server-side reads in app/layout.tsx
  const opts = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  res.cookies.set("email", email, opts);
  res.cookies.set("role", role, opts);
  if (uid) res.cookies.set("uid", uid, opts);

  return res;
}
