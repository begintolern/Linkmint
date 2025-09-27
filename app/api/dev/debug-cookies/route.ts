// app/api/dev/debug-cookies/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  return NextResponse.json({
    ok: true,
    cookies: cookieHeader,
  });
}
