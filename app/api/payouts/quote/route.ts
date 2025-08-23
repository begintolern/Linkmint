// app/api/payouts/quote/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { quoteFeeCents } from "@/lib/payouts/fees";
import type { PayoutProvider } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await (getServerSession as any)(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { amountCents, provider } = await req.json();

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!provider || !["PAYPAL", "PAYONEER"].includes(provider)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }

    const { feeCents, netCents } = quoteFeeCents(provider as PayoutProvider, amountCents);
    return NextResponse.json({ success: true, amountCents, feeCents, netCents });
  } catch (e) {
    console.error("POST /api/payouts/quote error", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
