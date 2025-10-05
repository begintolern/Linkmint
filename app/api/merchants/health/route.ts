// app/api/merchants/health/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { merchantHealth } from "@/lib/merchants/registry";

export async function GET() {
  const items = merchantHealth();
  return NextResponse.json({
    ok: true,
    region: "PH",
    items,
  });
}
