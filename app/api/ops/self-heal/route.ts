// app/api/ops/self-heal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runSelfHeal } from "@/lib/ops/selfHeal";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    const result = await runSelfHeal(action);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SELF_HEAL_API_ERROR" },
      { status: 500 }
    );
  }
}
