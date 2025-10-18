// app/api/admin/set-key/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_key";

// POST: validate key and set a secure, HttpOnly cookie
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "");
  const admin = process.env.ADMIN_API_KEY || "";

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Server key not set" }, { status: 500 });
  }
  if (!key || key !== admin) {
    return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 401 });
  }

  // 8 hours
  const maxAge = 60 * 60 * 8;

  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(key)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  );
  return res;
}
