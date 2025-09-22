import { NextResponse } from "next/server";
import { routeCommission } from "@/lib/engines/recordCommissionRouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expect body: { click, rule, order }
    const result = routeCommission(body);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("shopee-commission test error:", err);
    return NextResponse.json({ ok: false, message: "Test failed." }, { status: 500 });
  }
}
