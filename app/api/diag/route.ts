// app/api/diag/route.ts
import { NextResponse } from "next/server";
import { cookies as nextCookies, headers } from "next/headers";
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ck = nextCookies();
  const allCookies = ck.getAll().map(c => ({
    name: c.name,
    valuePreview: (c.value || "").slice(0, 10) + ((c.value?.length ?? 0) > 10 ? "…" : ""),
  }));

  const h = headers();
  const info = {
    host: h.get("host"),
    proto: h.get("x-forwarded-proto") || "unknown",
    xfHost: h.get("x-forwarded-host") || null,
  };

  // Also ask NextAuth's session endpoint status
  const handler = (NextAuth as unknown as (o: any) => any)(authOptions as any);
  const res = await (handler as any).GET?.({} as any);

  return NextResponse.json({
    info,
    cookies: allCookies,
    sessionEndpointStatus: res?.status ?? null,
  });
}
