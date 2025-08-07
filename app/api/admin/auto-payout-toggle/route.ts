// app/api/admin/auto-payout-toggle-fix/route.ts
import { NextResponse } from "next/server";
import { handleAutoPayoutToggle } from "@/lib/apiHandlers/payoutToggleHandler";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  const result = await handleAutoPayoutToggle();
  return NextResponse.json(result);
}
