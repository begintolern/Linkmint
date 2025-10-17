export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { finalizeCommission } from "@/lib/engines/payout/finalizeCommission";

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

// ✅ Simple route: finalize an existing commission by ID
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const commissionId = searchParams.get("commissionId");
  if (!commissionId) {
    return NextResponse.json({ ok: false, error: "Missing commissionId" });
  }

  try {
    const result = await finalizeCommission(commissionId);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
