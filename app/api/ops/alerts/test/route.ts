// app/api/ops/alerts/test/route.ts
import { NextResponse } from "next/server";
import { sendOpsAlert } from "@/lib/ops/alerts";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  const result = await sendOpsAlert("[OPS] Test alert from /api/ops/alerts/test");
  return NextResponse.json(result);
}
