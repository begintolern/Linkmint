// app/api/admin/finder/health/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { curated } from "@/lib/finder/curated";

export async function GET() {
  const totalItems = curated.length;
  const source = "curated";
  const mode = "PROVISION";
  const lastUpdated =
    process.env.FINDER_LAST_REFRESH || new Date().toISOString();

  return NextResponse.json({
    ok: true,
    mode,
    source,
    totalItems,
    lastUpdated,
  });
}
