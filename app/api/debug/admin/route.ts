// app/api/debug/admin/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

function mask(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  if (s.length <= 4) return "*".repeat(s.length);
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const showCookie = url.searchParams.get("cookie") === "1";

  // Read env and normalize
  const envKey = (process.env.ADMIN_API_KEY || "").trim();

  // Build a plain headers object safely
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const cookieHeader = headers["cookie"] || null;

  // Parse admin_key cookie
  let cookieKey: string | null = null;
  if (cookieHeader) {
    const parts = cookieHeader.split(";").map((s) => s.trim());
    const kv = parts.find((s) => s.toLowerCase().startsWith("admin_key="));
    if (kv) cookieKey = kv.substring("admin_key=".length);
  }

  return NextResponse.json({
    ok: true,
    env: {
      ADMIN_API_KEY_present: Boolean(envKey),
      ADMIN_API_KEY_masked: mask(envKey),
      ADMIN_API_KEY_length: envKey.length,
    },
    cookie: showCookie
      ? {
          raw: cookieHeader,
          admin_key_masked: mask(cookieKey),
          admin_key_length: cookieKey ? cookieKey.length : 0,
        }
      : { note: "add ?cookie=1 to see cookie header details" },
    hint:
      "Compare env.ADMIN_API_KEY vs cookie admin_key (length/masked). They must match exactly after trim.",
  });
}
