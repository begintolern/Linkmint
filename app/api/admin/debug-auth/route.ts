import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const incoming = req.headers.get("x-admin-key");
  const configured = (process.env.ADMIN_KEY ?? "").trim();
  return NextResponse.json({
    incoming,
    hasConfigured: !!configured,
    configuredLen: configured.length
  });
}
