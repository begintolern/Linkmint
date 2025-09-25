// app/api/payouts/quote/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { quoteFeeCents } from "@/lib/payouts/fees";

// Local provider type (since Prisma doesn't export it in your schema)
type PayoutProvider = "PAYPAL" | "PAYONEER";

type QuoteBody = {
  amountCents?: number;
  provider?: string; // validated and narrowed below
};

// Keep session typing consistent with other routes
type MaybeSession = { user?: { id?: string | null } } | null;

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as MaybeSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { amountCents, provider } = (await req.json().catch(() => ({}))) as QuoteBody;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    if (!provider || !["PAYPAL", "PAYONEER"].includes(provider)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }

    // Narrow provider to our local union type
    const prov = provider as PayoutProvider;

    // If quoteFeeCents is still typed to a Prisma enum, keep `as any` to satisfy its signature
    const { feeCents, netCents } = quoteFeeCents(prov as any, amountCents);

    return NextResponse.json({ success: true, amountCents, feeCents, netCents });
  } catch (e) {
    console.error("POST /api/payouts/quote error", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
