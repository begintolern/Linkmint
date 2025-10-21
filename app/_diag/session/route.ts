// app/api/_diag/session/route.ts
import { NextResponse } from "next/server";
import { cookies as nextCookies, headers } from "next/headers";
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Read incoming request cookies on the server
  const ck = nextCookies();
  const allCookies = ck.getAll().map(c => ({
    name: c.name,
    value: (c.value || "").slice(0, 10) + (c.value && c.value.length > 10 ? "…" : ""),
  }));

  // See what host/proto the server thinks this is
  const h = headers();
  const info = {
    host: h.get("host"),
    proto: h.get("x-forwarded-proto") || "unknown",
    xfHost: h.get("x-forwarded-host") || null,
  };

  // Ask NextAuth’s built-in session endpoint, too
  const handler = (NextAuth as unknown as (o: any) => any)(authOptions as any);
  const res = await handler.GET!({} as any);

  return NextResponse.json({
    info,
    cookies: allCookies,
    sessionEndpointStatus: res?.status ?? null,
  });
}
