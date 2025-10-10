// app/api/_diag/session/route.ts
import { NextResponse } from "next/server";
import { cookies as nextCookies, headers } from "next/headers";
import { authOptions } from "@/lib/auth/options";
import NextAuth from "next-auth/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Read incoming request cookies (server-side)
  const ck = nextCookies();
  const allCookies = ck.getAll().map(c => ({ name: c.name, value: c.value?.slice(0, 8)+"...", domain: "req", }));
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "unknown";
  const xfHost = h.get("x-forwarded-host") || null;

  // Also ask NextAuth for the current session (same as /api/auth/session)
  const handler = (NextAuth as unknown as (o: any) => any)(authOptions as any);
  const res = await handler.GET!({} as any);

  return NextResponse.json({
    info: { host, proto, xfHost },
    cookies: allCookies,
    sessionEndpointStatus: res?.status ?? null,
  });
}
