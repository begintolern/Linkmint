import { NextRequest, NextResponse } from "next/server";

function getIp(req: NextRequest): string {
  const h = req.headers;
  const cand =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("cf-connecting-ip") ||
    h.get("fly-client-ip") ||
    "";
  return cand || "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") ?? "unknown";

  // Return a small subset so it’s safe
  const snapshot = {
    computed: { ip, ua },
    headers: {
      "x-real-ip": req.headers.get("x-real-ip") || null,
      "x-forwarded-for": req.headers.get("x-forwarded-for") || null,
      "cf-connecting-ip": req.headers.get("cf-connecting-ip") || null,
      "fly-client-ip": req.headers.get("fly-client-ip") || null,
      "user-agent": req.headers.get("user-agent") || null,
    },
  };

  return NextResponse.json(snapshot);
}
