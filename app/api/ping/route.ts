export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, now: Date.now() });
}
