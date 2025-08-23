// app/api/_debug/paypal/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

export async function GET() {
  const cid = process.env.PAYPAL_CLIENT_ID || "";
  const sec = process.env.PAYPAL_CLIENT_SECRET || "";
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  const nodeEnv = process.env.NODE_ENV || "";
  const apiBase =
    mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  // Build the Basic auth header exactly like our token call does
  const authSample = cid && sec ? Buffer.from(`${cid}:${sec}`).toString("base64") : "";

  return NextResponse.json({
    ok: true,
    // mask sensitive values but show enough to verify
    PAYPAL_CLIENT_ID_prefix: cid ? cid.slice(0, 6) : null,
    PAYPAL_CLIENT_ID_len: cid.length || 0,
    PAYPAL_CLIENT_SECRET_len: sec.length || 0,
    PAYPAL_MODE: mode,
    NODE_ENV: nodeEnv,
    API_BASE: apiBase,
    basicAuth_prefix: authSample ? authSample.slice(0, 12) : null,
  });
}
