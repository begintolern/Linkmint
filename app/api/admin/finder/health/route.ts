// app/api/admin/finder/health/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { curated } from "@/lib/finder/curated";
// If you have this guard, keep it. If not, you can remove the guard lines.
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";

export async function GET(req: NextRequest) {
  // Admin gate (comment out if you don't use it)
  if (typeof adminGuardFromReq === "function") {
    const gate = await adminGuardFromReq(req);
    if (!gate.ok) return gate.res;
  }

  const totalItems = curated.length;
  const source = "curated";
  const mode = "PROVISION";
  const lastUpdated =
    process.env.FINDER_LAST_REFRESH ||
    new Date().toISOString(); // placeholder until you wire a cache/refresh job

  return NextResponse.json({
    ok: true,
    mode,
    source,
    totalItems,
    lastUpdated,
  });
}
