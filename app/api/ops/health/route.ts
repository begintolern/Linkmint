// app/api/ops/health/route.ts
import { NextResponse } from "next/server";
import { getOpsHealth } from "@/lib/ops/health";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const health = await getOpsHealth();
  return NextResponse.json({ ok: true, health });
}
