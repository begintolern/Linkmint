import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// Make sure this runs on Node (not Edge) so process.env is available.
export const runtime = "nodejs";

export async function GET() {
  const keys = ["DATABASE_URL", "NODE_ENV", "NEXTAUTH_URL"];
  const result: Record<string, string> = {};
  for (const k of keys) {
    const v = process.env[k];
    result[k] = v ? (k === "DATABASE_URL" ? "set" : v) : "missing";
  }
  // Railway exposes these; if present they confirm which service/env we’re on
  result.RAILWAY_SERVICE_NAME = process.env.RAILWAY_SERVICE_NAME ?? "unknown";
  result.RAILWAY_ENVIRONMENT = process.env.RAILWAY_ENVIRONMENT ?? "unknown";
  return NextResponse.json(result);
}
