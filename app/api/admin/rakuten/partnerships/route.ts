// app/api/admin/rakuten/partnerships/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { requireAdminFromReq } from "@/lib/utils/adminGuardReq";
import { listPartnerships } from "@/lib/partners/rakutenClient";

// GET /api/admin/rakuten/partnerships
export async function GET(req: Request) {
  // Enforce admin via JWT token (NEXTAUTH_SECRET)
  // Note: Next’s Request is compatible enough for getToken under the hood.
  const guard = await requireAdminFromReq(req as any);
  if (!("ok" in guard) || !guard.ok) {
    return guard.res; // 401/403 handled by the guard
  }

  try {
    const data = await listPartnerships({ page: 1, pageSize: 20 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Rakuten partnerships fetch failed" },
      { status: 500 }
    );
  }
}
